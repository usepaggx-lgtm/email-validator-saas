import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { validateSyntax } from './validators/syntax'
import { validateDomain } from './validators/dns'
import { isDisposable } from './validators/disposable'
import { isRoleAccount } from './validators/roles'
import { detectAlias } from './validators/alias'
import { suggestDomain } from './validators/suggest'
import { isGibberish } from './validators/gibberish'
import { detectWebmail } from './validators/webmail'
import { isSpamtrap } from './validators/spamtrap'

type Bindings = {
  EV_KV: KVNamespace
  DB: D1Database
  SMTP_VERIFIER?: string
  CRAWLER_URL?: string
  ENVIRONMENT?: string
  BASE_URL?: string
  WHATSAPP_SERVICE_URL?: string
  WHATSAPP_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }))

const RATE_LIMITS: Record<string, { window: number; max: number }> = {
  public: { window: 60, max: 10 },
  auth: { window: 60, max: 100 },
  batch: { window: 60, max: 10 },
  finder: { window: 60, max: 20 },
  login: { window: 60, max: 5 },
}

async function rateLimit(c: any, tier: string): Promise<{ ok: boolean; remaining: number; reset: number }> {
  try {
    const cfg = RATE_LIMITS[tier] || RATE_LIMITS.public
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const token = c.req.header('authorization')?.slice(7) || ''
    const key = `rl:${tier}:${token || ip}`
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / cfg.window) * cfg.window

    const current = await c.env.EV_KV.get(key)
    if (current) {
      const data = JSON.parse(current)
      if (data.window === windowStart) {
        const remaining = Math.max(0, cfg.max - data.count)
        if (data.count >= cfg.max) {
          return { ok: false, remaining: 0, reset: windowStart + cfg.window }
        }
        await c.env.EV_KV.put(key, JSON.stringify({ count: data.count + 1, window: windowStart }), { expirationTtl: cfg.window * 2 })
        return { ok: true, remaining: cfg.max - data.count - 1, reset: windowStart + cfg.window }
      }
    }

    await c.env.EV_KV.put(key, JSON.stringify({ count: 1, window: windowStart }), { expirationTtl: cfg.window * 2 })
    return { ok: true, remaining: cfg.max - 1, reset: windowStart + cfg.window }
  } catch { return { ok: true, remaining: 999, reset: 0 } }
}

function setRateHeaders(c: any, rl: { remaining: number; reset: number }) {
  c.header('X-RateLimit-Remaining', String(rl.remaining))
  c.header('X-RateLimit-Reset', String(rl.reset))
}

app.use('*', async (c, next) => {
  const cl = c.req.header('content-length')
  if (cl && parseInt(cl) > 500000) return c.json({ error: 'Request too large' }, 413)
  await next()
})

const PLANS: Record<string, { daily: number; monthly: number }> = {
  free: { daily: 100, monthly: 3000 },
  starter: { daily: 1000, monthly: 10000 },
  pro: { daily: 10000, monthly: 100000 },
  enterprise: { daily: 100000, monthly: 999999999 },
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const toHex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === hashHex
}

function generateToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
}

function generateKey(): string {
  const b = crypto.getRandomValues(new Uint8Array(24))
  return 'ev_live_' + Array.from(b).map(x => x.toString(36).padStart(2, '0')).join('').slice(0, 32)
}

function getId(): string {
  const b = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(b).map(x => x.toString(36).padStart(2, '0')).join('')
}

async function getUserFromToken(c: any): Promise<any | null> {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const data = await c.env.EV_KV.get(`session:${token}`)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

async function checkLimit(user: any, db: D1Database): Promise<{ ok: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10)
  const row = await db.prepare('SELECT count FROM usage_daily WHERE user_id = ? AND date = ?').bind(user.id, today).first() as any
  const used = row?.count || 0
  const plan = PLANS[user.plan] || PLANS.free
  return { ok: used < plan.daily, used, limit: plan.daily }
}

async function recordUsage(userId: string, db: D1Database, email: string, status: string, source: string) {
  const today = new Date().toISOString().slice(0, 10)
  await db.prepare(
    'INSERT INTO usage_daily (user_id, date, count) VALUES (?, ?, 1) ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1'
  ).bind(userId, today).run()
  await db.prepare('UPDATE users SET validations_used = validations_used + 1, validations_total = validations_total + 1 WHERE id = ?').bind(userId).run()
  await db.prepare('INSERT INTO validation_log (user_id, email, status, source) VALUES (?, ?, ?, ?)').bind(userId, email, status, source).run()
}

const emailSchema = z.object({ email: z.string().min(1) })
const batchSchema = z.object({ emails: z.array(z.string()).min(1).max(100) })

async function validateSingleEmail(email: string, smtpUrl?: string) {
  const syntax = validateSyntax(email)
  if (!syntax.valid) return {
    email,
    status: 'INVALID_FORMAT',
    is_safe_to_send: false,
    is_valid_syntax: false,
    is_disposable: false,
    is_role_account: false,
    is_gibberish: false,
    is_spamtrap: false,
    is_webmail: false,
    mx_accepts_mail: false,
    mx_records: [],
    can_connect_smtp: false,
    has_inbox_full: false,
    is_catch_all: false,
    is_deliverable: false,
    is_disabled: false,
    score: 0,
    error: syntax.error,
  }

  const domain = syntax.domain!
  const username = syntax.username!
  const domainResult = await validateDomain(domain)
  const disposable = isDisposable(domain)
  const roleBased = isRoleAccount(username)
  const gibberish = isGibberish(username)
  const webmail = detectWebmail(domain)
  const spamtrap = isSpamtrap(email, username, domain)
  const alias = detectAlias(email, username, domain)
  const suggestion = suggestDomain(domain)

  let smtp: any = null
  let smtpAvailable = false
  let hasInboxFull = false
  let isDisabled = false
  if (domainResult.mx_records && smtpUrl) {
    try {
      const res = await fetch(`${smtpUrl}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        smtp = await res.json()
        smtpAvailable = !smtp.reason?.includes('Connection failed') && !smtp.reason?.includes('Timeout') && smtp.deliverable !== undefined
        hasInboxFull = smtp.reason?.includes('552') || false
        isDisabled = smtp.reason?.includes('5.2.1') || smtp.reason?.includes('disabled') || false
      }
    } catch {}
  }

  const score = (10) + (domainResult.domain_exists ? 10 : 0) + (domainResult.mx_records ? 10 : 0) + (smtp?.deliverable ? 20 : 0) + (!smtp?.catch_all ? 10 : 0) + (!disposable ? 10 : 0) + (!roleBased ? 10 : 0) + (!gibberish ? 10 : 0) + (!spamtrap ? 10 : 0)

  const is_deliverable = smtpAvailable ? smtp?.deliverable : domainResult.mx_records
  const can_connect_smtp = smtpAvailable
  const is_catch_all = smtpAvailable ? (smtp?.catch_all || false) : false

  let status: string
  if (spamtrap) status = 'SPAMTRAP'
  else if (disposable) status = 'DISPOSABLE'
  else if (gibberish) status = 'GIBBERISH'
  else if (isDisabled) status = 'DISABLED'
  else if (hasInboxFull) status = 'INBOX_FULL'
  else if (is_catch_all) status = 'CATCH_ALL'
  else if (smtpAvailable && !smtp?.deliverable) status = 'INVALID'
  else if (!domainResult.domain_exists) status = 'INVALID_DOMAIN'
  else if (roleBased) status = 'PROBABLY_VALID'
  else status = 'VALID'

  const is_safe_to_send = ['VALID', 'PROBABLY_VALID'].includes(status)

  return {
    email,
    status,
    score,
    is_safe_to_send,
    is_valid_syntax: true,
    is_disposable: disposable,
    is_role_account: roleBased,
    is_gibberish: gibberish,
    is_spamtrap: spamtrap,
    is_webmail: webmail.isWebmail,
    webmail_provider: webmail.provider || null,
    mx_accepts_mail: domainResult.mx_records,
    mx_records: domainResult.records || [],
    can_connect_smtp,
    has_inbox_full: hasInboxFull,
    is_catch_all,
    is_deliverable,
    is_disabled: isDisabled,
    smtp,
    ...(alias.isAlias && alias.aliasOf ? { alias_of: alias.aliasOf } : {}),
    ...(suggestion ? { suggestion } : {}),
  }
}

app.post('/api/auth/register', async (c) => {
  const rl = await rateLimit(c, 'login')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many attempts. Try again later.' }, 429)
  try {
    const { email, password, name } = await c.req.json() as any
    if (!email || !password || !name) return c.json({ error: 'email, password and name are required' }, 400)
    if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400)

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) return c.json({ error: 'Email already registered' }, 409)

    const id = getId()
    const hash = await hashPassword(password)
    const affCode = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || id.slice(0, 8)
    try { await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name, plan, affiliate_code) VALUES (?, ?, ?, ?, ?, ?)').bind(id, email, hash, name, 'free', affCode).run() } catch { await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name, plan, affiliate_code) VALUES (?, ?, ?, ?, ?, ?)').bind(id, email, hash, name, 'free', id.slice(0, 8)).run() }

    // Track affiliate referral
    const refCode = c.req.header('x-ref-code') || ''
    if (refCode) {
      const aff = await c.env.DB.prepare('SELECT id FROM users WHERE affiliate_code = ?').bind(refCode).first() as any
      if (aff && aff.id !== id) {
        await c.env.DB.prepare("INSERT INTO affiliate_conversions (affiliate_user_id, referred_email, amount, commission, status) VALUES (?, ?, 0, 0, 'pending')").bind(aff.id, email).run()
      }
    }

    const token = generateToken()
    const session = { id, email, name, plan: 'free', daily_limit: 100, is_admin: 0 }
    await c.env.EV_KV.put(`session:${token}`, JSON.stringify(session), { expirationTtl: 86400 * 30 })

    return c.json({ token, user: session })
  } catch (err: any) {
    return c.json({ error: err.message || 'Registration failed' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  const rl = await rateLimit(c, 'login')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many attempts. Try again later.' }, 429)
  try {
    const { email, password } = await c.req.json() as any
    if (!email || !password) return c.json({ error: 'email and password are required' }, 400)

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any
    if (!user) return c.json({ error: 'Invalid credentials' }, 401)

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

    const twofaSecret = await c.env.EV_KV.get(`2fa_secret:${user.id}`)
    if (twofaSecret) {
      const tempToken = generateToken()
      await c.env.EV_KV.put(`2fa_temp:${tempToken}`, user.id, { expirationTtl: 300 })
      return c.json({ requires_2fa: true, temp_token: tempToken, email: user.email })
    }

    const token = generateToken()
    const session = { id: user.id, email: user.email, name: user.name, plan: user.plan, daily_limit: PLANS[user.plan]?.daily || 100, is_admin: user.is_admin || 0 }
    await c.env.EV_KV.put(`session:${token}`, JSON.stringify(session), { expirationTtl: 86400 * 30 })

    return c.json({ token, user: session })
  } catch (err: any) {
    return c.json({ error: err.message || 'Login failed' }, 500)
  }
})

app.post('/api/auth/2fa/login', async (c) => {
  try {
    const { temp_token, code } = await c.req.json() as any
    if (!temp_token || !code) return c.json({ error: 'temp_token and code required' }, 400)

    const userId = await c.env.EV_KV.get(`2fa_temp:${temp_token}`)
    if (!userId) return c.json({ error: 'Invalid or expired token' }, 401)

    const storedSecret = await c.env.EV_KV.get(`2fa_secret:${userId}`)
    if (!storedSecret) return c.json({ error: '2FA not configured' }, 400)

    const raw = base32Decode(storedSecret)
    const ok = await totpVerify(raw, code)
    if (!ok) return c.json({ error: 'Invalid code' }, 401)

    await c.env.EV_KV.delete(`2fa_temp:${tempToken}`)

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any
    const token = generateToken()
    const session = { id: user.id, email: user.email, name: user.name, plan: user.plan, daily_limit: PLANS[user.plan]?.daily || 100, is_admin: user.is_admin || 0 }
  } catch (err: any) {
    return c.json({ error: err.message || '2FA verification failed' }, 500)
  }
})

app.get('/api/auth/me', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const today = new Date().toISOString().slice(0, 10)
  const row = await c.env.DB.prepare('SELECT count FROM usage_daily WHERE user_id = ? AND date = ?').bind(user.id, today).first() as any
  const total = await c.env.DB.prepare('SELECT validations_total as t FROM users WHERE id = ?').bind(user.id).first() as any

  return c.json({
    ...user,
    usage_today: row?.count || 0,
    usage_total: total?.t || 0,
  })
})

app.post('/api/validate', async (c) => {
  const rl = await rateLimit(c, 'public')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests. Try again shortly.', retry_after: rl.reset - Math.floor(Date.now() / 1000) }, 429)
  try {
    const body = await c.req.json()
    const parsed = emailSchema.parse(body)
    const result = await validateSingleEmail(parsed.email, c.env.SMTP_VERIFIER)
    return c.json(result)
  } catch (err) {
    if (err instanceof z.ZodError) return c.json({ error: 'Invalid request', details: err.errors }, 400)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/validate/auth', async (c) => {
  const rl = await rateLimit(c, 'auth')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests', retry_after: rl.reset - Math.floor(Date.now() / 1000) }, 429)
  try {
    const user = await getUserFromToken(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const limit = await checkLimit(user, c.env.DB)
    if (!limit.ok) return c.json({ error: 'Daily limit reached', usage: limit.used, limit: limit.limit }, 429)

    const body = await c.req.json()
    const parsed = emailSchema.parse(body)
    const result = await validateSingleEmail(parsed.email, c.env.SMTP_VERIFIER)
    await recordUsage(user.id, c.env.DB, parsed.email, result.status, 'dashboard')
    return c.json({ ...result, usage: { used: limit.used + 1, limit: limit.limit } })
  } catch (err) {
    if (err instanceof z.ZodError) return c.json({ error: 'Invalid request', details: err.errors }, 400)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/validate/batch', async (c) => {
  const rl = await rateLimit(c, 'batch')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests', retry_after: rl.reset - Math.floor(Date.now() / 1000) }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const limit = await checkLimit(user, c.env.DB)
  if (!limit.ok) return c.json({ error: 'Daily limit reached', usage: limit.used, limit: limit.limit }, 429)

  try {
    const body = await c.req.json()
    const parsed = batchSchema.parse(body)

    if (parsed.emails.length > limit.limit - limit.used) {
      return c.json({ error: `Batch too large. Only ${limit.limit - limit.used} validations remaining today.` }, 429)
    }

    const results = await Promise.all(parsed.emails.map(email => validateSingleEmail(email, c.env.SMTP_VERIFIER)))

    for (const r of results) {
      await recordUsage(user.id, c.env.DB, r.email, r.status, 'batch')
    }

    return c.json({ results, usage: { used: limit.used + parsed.emails.length, limit: limit.limit } })
  } catch (err) {
    if (err instanceof z.ZodError) return c.json({ error: 'Invalid request', details: err.errors }, 400)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/api/keys', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const keys = await c.env.DB.prepare('SELECT id, name, key, created_at, last_used_at, usage_count FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all()
  return c.json({ keys: keys.results })
})

app.post('/api/keys', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { name } = await c.req.json() as any
  if (!name) return c.json({ error: 'Name is required' }, 400)
  const id = getId()
  const key = generateKey()
  await c.env.DB.prepare('INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)').bind(id, user.id, name, key).run()
  return c.json({ id, name, key, created_at: new Date().toISOString(), last_used_at: null, usage_count: 0 })
})

app.delete('/api/keys/:id', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  const key = await c.env.DB.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ?').bind(id, user.id).first()
  if (!key) return c.json({ error: 'Key not found' }, 404)
  await c.env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/history', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const url = new URL(c.req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const rows = await c.env.DB.prepare('SELECT email, status, source, created_at FROM validation_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(user.id, limit, offset).all()
  const total = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log WHERE user_id = ?').bind(user.id).first() as any
  return c.json({ history: rows.results, total: total?.c || 0, page, limit })
})

app.get('/api/usage', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const today = new Date().toISOString().slice(0, 10)
  const dailyRow = await c.env.DB.prepare('SELECT count FROM usage_daily WHERE user_id = ? AND date = ?').bind(user.id, today).first() as any
  const totalRow = await c.env.DB.prepare('SELECT validations_total as t, plan FROM users WHERE id = ?').bind(user.id).first() as any
  const keyCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM api_keys WHERE user_id = ?').bind(user.id).first() as any

  return c.json({
    today: dailyRow?.count || 0,
    total: totalRow?.t || 0,
    daily_limit: PLANS[totalRow?.plan]?.daily || 100,
    plan: totalRow?.plan || 'free',
    keys: keyCount?.c || 0,
  })
})

app.post('/api/plan/upgrade', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { plan } = await c.req.json() as any
  const dbPlan = await c.env.DB.prepare('SELECT * FROM plans WHERE slug = ?').bind(plan).first() as any
  if (!dbPlan) return c.json({ error: 'Invalid plan' }, 400)
  await c.env.DB.prepare('UPDATE users SET plan = ?, daily_limit = ? WHERE id = ?').bind(plan, dbPlan.daily_limit, user.id).run()
  await c.env.DB.prepare('INSERT INTO subscription_events (user_id, plan, event_type) VALUES (?, ?, ?)').bind(user.id, plan, 'upgrade').run()
  return c.json({ success: true, plan })
})

function calcScore(v: any): number {
  let s = 0
  if (v.syntax) s += 20
  if (v.domain_exists) s += 25
  if (v.mx_records) s += 25
  if (!v.is_disposable) s += 15
  if (!v.is_role_based) s += 15
  return s
}

async function ensureDefaultList(userId: string, db: D1Database): Promise<string> {
  const existing = await db.prepare('SELECT id FROM lists WHERE user_id = ? AND name = ?').bind(userId, 'Default List').first() as any
  if (existing) return existing.id
  const id = getId()
  await db.prepare('INSERT INTO lists (id, user_id, name) VALUES (?, ?, ?)').bind(id, userId, 'Default List').run()
  return id
}

app.get('/api/lists', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  await ensureDefaultList(user.id, c.env.DB)
  const rows = await c.env.DB.prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY updated_at DESC').bind(user.id).all()
  return c.json({ lists: rows.results })
})

app.post('/api/lists', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { name } = await c.req.json() as any
  if (!name) return c.json({ error: 'Name is required' }, 400)
  const id = getId()
  await c.env.DB.prepare('INSERT INTO lists (id, user_id, name) VALUES (?, ?, ?)').bind(id, user.id, name).run()
  return c.json({ id, name, total_count: 0, valid_count: 0, invalid_count: 0, disposable_count: 0 })
})

app.delete('/api/lists/:id', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  const list = await c.env.DB.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').bind(id, user.id).first()
  if (!list) return c.json({ error: 'List not found' }, 404)
  await c.env.DB.prepare('DELETE FROM list_contacts WHERE list_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM lists WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/lists/:id', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  const list = await c.env.DB.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').bind(id, user.id).first() as any
  if (!list) return c.json({ error: 'List not found' }, 404)

  const url = new URL(c.req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const status = url.searchParams.get('status') || ''
  const search = url.searchParams.get('search') || ''
  const limit = 50
  const offset = (page - 1) * limit

  let where = 'WHERE list_id = ?'
  const params: any[] = [id]
  if (status) { where += ' AND status = ?'; params.push(status) }
  if (search) { where += ' AND email LIKE ?'; params.push(`%${search}%`) }

  const total = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM list_contacts ${where}`).bind(...params).first() as any
  const contacts = await c.env.DB.prepare(`SELECT * FROM list_contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...params, limit, offset).all()

  return c.json({ list, contacts: contacts.results, total: total?.c || 0, page, limit })
})

app.post('/api/lists/:id/contacts', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const listId = c.req.param('id')

  const list = await c.env.DB.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').bind(listId, user.id).first()
  if (!list) return c.json({ error: 'List not found' }, 404)

  const body = await c.req.json() as any
  const contacts = body.contacts || []
  if (!Array.isArray(contacts) || contacts.length === 0) return c.json({ error: 'contacts array required' }, 400)

  const limitCheck = await checkLimit(user, c.env.DB)
  if (!limitCheck.ok) return c.json({ error: 'Daily limit reached', usage: limitCheck.used, limit: limitCheck.limit }, 429)
  if (contacts.length > limitCheck.limit - limitCheck.used) {
    return c.json({ error: `Only ${limitCheck.limit - limitCheck.used} validations remaining today` }, 429)
  }

  const results: any[] = []
  let valid = 0, invalid = 0, disposableCount = 0

  for (const contact of contacts) {
    const email = contact.email?.trim()
    if (!email) continue

    const v = validateSyntax(email)
    let status = 'pending', score = 0, validations: any = {}

    if (!v.valid) {
      status = 'INVALID_FORMAT'; validations = { syntax: false, domain_exists: false, mx_records: false, is_disposable: false, is_role_based: false }
    } else {
      const domainResult = await validateDomain(v.domain!)
      const isDisp = isDisposable(v.domain!)
      const roleBased = isRoleAccount(v.username!)
      const alias = detectAlias(email, v.username!, v.domain!)
      const suggestion = suggestDomain(v.domain!)
      validations = { syntax: true, domain_exists: domainResult.domain_exists, mx_records: domainResult.mx_records, is_disposable: isDisp, is_role_based: roleBased }
      score = calcScore(validations)

      if (isDisp) { status = 'DISPOSABLE'; disposableCount++ }
      else if (!domainResult.domain_exists) { status = 'INVALID_DOMAIN'; invalid++ }
      else if (roleBased) { status = 'PROBABLY_VALID'; valid++ }
      else { status = 'VALID'; valid++ }
    }

    const extra = JSON.stringify({ name: contact.name || '', company: contact.company || '', ...(contact.extra || {}) })
    await c.env.DB.prepare(
      'INSERT INTO list_contacts (list_id, email, name, company, extra_data, status, score, validations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(listId, email, contact.name || '', contact.company || '', extra, status, score, JSON.stringify(validations)).run()

    results.push({ email, status, score, validations, alias_of: null, suggestion: null })
    await recordUsage(user.id, c.env.DB, email, status, 'list')
  }

  await c.env.DB.prepare(
    'UPDATE lists SET total_count = total_count + ?, valid_count = valid_count + ?, invalid_count = invalid_count + ?, disposable_count = disposable_count + ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(contacts.length, valid, invalid, disposableCount, listId).run()

  return c.json({ results, summary: { total: contacts.length, valid, invalid, disposable: disposableCount } })
})

app.get('/api/lists/:id/export', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')

  const list = await c.env.DB.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').bind(id, user.id).first() as any
  if (!list) return c.json({ error: 'List not found' }, 404)

  const url = new URL(c.req.url)
  const status = url.searchParams.get('status') || ''

  let where = 'WHERE list_id = ?'
  const params: any[] = [id]
  if (status) { where += ' AND status = ?'; params.push(status) }

  const contacts = await c.env.DB.prepare(`SELECT * FROM list_contacts ${where} ORDER BY created_at DESC`).bind(...params).all()

  const header = 'Email,Name,Company,Status,Score,Syntax,Domain,MX,Disposable,RoleBased,Extra\n'
  const rows = (contacts.results || []).map((r: any) => {
    const v = typeof r.validations === 'string' ? JSON.parse(r.validations) : r.validations
    return `"${r.email}","${r.name || ''}","${r.company || ''}","${r.status}",${r.score},${v.syntax||false},${v.domain_exists||false},${v.mx_records||false},${v.is_disposable||false},${v.is_role_based||false},"${(r.extra_data || '{}').replace(/"/g, '""')}"`
  }).join('\n')

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="list-${id}-${status || 'all'}.csv"`)
  return c.body(header + rows)
})

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buf: Uint8Array): string {
  let bits = 0, value = 0, output = ''
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(s: string): Uint8Array {
  const cleaned = s.replace(/=+$/, '').toUpperCase()
  const bytes: number[] = []
  let bits = 0, value = 0
  for (const ch of cleaned) {
    value = (value << 5) | BASE32.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(bytes)
}

async function totpVerify(secret: Uint8Array, code: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000)
  for (let offset = -1; offset <= 1; offset++) {
    let counter = Math.floor(time / 30) + offset
    const msg = new Uint8Array(8)
    for (let i = 7; i >= 0; i--) { msg[i] = counter & 255; counter = Math.floor(counter / 256) }

    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, msg)
    const hmac = new Uint8Array(sig)
    const offset2 = hmac[hmac.length - 1] & 0xf
    const binCode = ((hmac[offset2] & 0x7f) << 24) | ((hmac[offset2 + 1] & 0xff) << 16) | ((hmac[offset2 + 2] & 0xff) << 8) | (hmac[offset2 + 3] & 0xff)
    const totp = String(binCode % 1000000).padStart(6, '0')
    if (totp === code) return true
  }
  return false
}

app.put('/api/auth/profile', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { name } = await c.req.json() as any
  if (!name || typeof name !== 'string') return c.json({ error: 'Name is required' }, 400)
  await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name.trim(), user.id).run()
  user.name = name.trim()
  const token = generateToken()
  await c.env.EV_KV.put(`session:${token}`, JSON.stringify(user), { expirationTtl: 86400 * 30 })
  return c.json({ success: true, user })
})

app.put('/api/auth/password', async (c) => {
  const rl = await rateLimit(c, 'auth')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests' }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { currentPassword, newPassword } = await c.req.json() as any
  if (!currentPassword || !newPassword) return c.json({ error: 'Current and new password required' }, 400)
  if (newPassword.length < 6) return c.json({ error: 'New password must be at least 6 characters' }, 400)

  const dbUser = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first() as any
  const valid = await verifyPassword(currentPassword, dbUser.password_hash)
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 403)

  const hash = await hashPassword(newPassword)
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, user.id).run()
  return c.json({ success: true })
})

app.get('/api/auth/2fa/status', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const secret = await c.env.EV_KV.get(`2fa_secret:${user.id}`)
  return c.json({ enabled: !!secret })
})

app.post('/api/auth/2fa/setup', async (c) => {
  const rl = await rateLimit(c, 'auth')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests' }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { password } = await c.req.json() as any
  if (!password) return c.json({ error: 'Password required' }, 400)

  const dbUser = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first() as any
  const valid = await verifyPassword(password, dbUser.password_hash)
  if (!valid) return c.json({ error: 'Password is incorrect' }, 403)

  const raw = crypto.getRandomValues(new Uint8Array(20))
  const secret = base32Encode(raw)
  const uri = `otpauth://totp/EmailValidator:${user.email}?secret=${secret}&issuer=EmailValidator&algorithm=SHA1&digits=6&period=30`
  return c.json({ secret, uri })
})

app.post('/api/auth/2fa/verify', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { code, secret } = await c.req.json() as any
  if (!code || !secret) return c.json({ error: 'Code and secret required' }, 400)

  const raw = base32Decode(secret)
  const ok = await totpVerify(raw, code)
  if (!ok) return c.json({ error: 'Invalid code' }, 400)

  await c.env.EV_KV.put(`2fa_secret:${user.id}`, secret, { expirationTtl: 86400 * 365 * 10 })
  return c.json({ success: true, message: '2FA enabled' })
})

app.post('/api/auth/2fa/disable', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { code, password } = await c.req.json() as any

  const dbUser = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first() as any
  const valid = await verifyPassword(password, dbUser.password_hash)
  if (!valid) return c.json({ error: 'Password is incorrect' }, 403)

  const storedSecret = await c.env.EV_KV.get(`2fa_secret:${user.id}`)
  if (storedSecret) {
    const raw = base32Decode(storedSecret)
    const ok = await totpVerify(raw, code)
    if (!ok) return c.json({ error: 'Invalid code' }, 400)
  }

  await c.env.EV_KV.delete(`2fa_secret:${user.id}`)
  return c.json({ success: true, message: '2FA disabled' })
})

app.post('/api/auth/avatar', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { image } = await c.req.json() as any
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) return c.json({ error: 'Invalid image data' }, 400)
    if (image.length > 500000) return c.json({ error: 'Image too large (max 500KB)' }, 400)
    await c.env.EV_KV.put(`avatar:${user.id}`, image, { expirationTtl: 86400 * 365 })
    return c.json({ success: true, avatar: `/api/auth/avatar/${user.id}` })
  } catch { return c.json({ error: 'Upload failed' }, 500) }
})

app.get('/api/auth/avatar/:userId', async (c) => {
  const userId = c.req.param('userId')
  const data = await c.env.EV_KV.get(`avatar:${userId}`)
  if (!data) return c.json({ error: 'Not found' }, 404)
  const m = data.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!m) return c.json({ error: 'Invalid' }, 500)
  c.header('Content-Type', m[1])
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(new Uint8Array(atob(m[2]).split('').map(c => c.charCodeAt(0))))
})

async function checkFeatureCredits(userId: string, feature: string, db: D1Database): Promise<{ ok: boolean; used: number; limit: number }> {
  const month = new Date().toISOString().slice(0, 7)
  try {
    const row = await db.prepare('SELECT used, monthly_limit FROM user_credits WHERE user_id = ? AND feature = ? AND month = ?').bind(userId, feature, month).first() as any
    const used = row?.used || 0
    const limit = row?.monthly_limit || 100
    return { ok: used < limit, used, limit }
  } catch { return { ok: true, used: 0, limit: 100 } }
}

async function useFeatureCredit(userId: string, feature: string, db: D1Database) {
  const month = new Date().toISOString().slice(0, 7)
  try {
    const existing = await db.prepare('SELECT id FROM user_credits WHERE user_id = ? AND feature = ? AND month = ?').bind(userId, feature, month).first()
    if (existing) {
      await db.prepare('UPDATE user_credits SET used = used + 1 WHERE user_id = ? AND feature = ? AND month = ?').bind(userId, feature, month).run()
    } else {
      await db.prepare('INSERT INTO user_credits (user_id, feature, monthly_limit, used, month) VALUES (?, ?, 100, 1, ?)').bind(userId, feature, month).run()
    }
  } catch (e) {}
}

function generateEmailPatterns(firstName: string, lastName: string, domain: string): string[] {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const f = normalize(firstName)
  const l = normalize(lastName)
  const fi = f[0] || ''
  const li = l[0] || ''
  const patterns = new Set<string>()
  if (f && l) patterns.add(`${f}.${l}@${domain}`)
  if (f && l) patterns.add(`${f}${l}@${domain}`)
  if (fi && l) patterns.add(`${fi}.${l}@${domain}`)
  if (fi && l) patterns.add(`${fi}${l}@${domain}`)
  if (f && li) patterns.add(`${f}.${li}@${domain}`)
  if (f) patterns.add(`${f}@${domain}`)
  if (l) patterns.add(`${l}@${domain}`)
  if (fi && li) patterns.add(`${fi}.${li}@${domain}`)
  if (f && l) patterns.add(`${f}_${l}@${domain}`)
  if (l && f) patterns.add(`${l}.${f}@${domain}`)
  return Array.from(patterns)
}

function extractNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0].toLowerCase()
  const parts = local.split(/[._\-]/)
  const first = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1) || ''
  const last = parts.length > 1 ? parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1) || '' : ''
  return { firstName: first, lastName: last }
}

function capitalizeName(s: string): string {
  return s.split(/[._\-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

const NAME_PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.']

app.post('/api/finder', async (c) => {
  const rl = await rateLimit(c, 'finder')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests' }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const credits = await checkFeatureCredits(user.id, 'finder', c.env.DB)
  if (!credits.ok) return c.json({ error: 'Monthly finder credits exhausted', used: credits.used, limit: credits.limit }, 429)

  try {
    const { name, domain } = await c.req.json() as any
    if (!name || !domain) return c.json({ error: 'Name and domain are required' }, 400)

    const nameParts = name.trim().split(/\s+/)
    const firstName = nameParts[0].replace(/[^a-zA-Z\u00C0-\u024F]/g, '')
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/[^a-zA-Z\u00C0-\u024F]/g, '') : ''

    const patterns = generateEmailPatterns(firstName, lastName, domain)

    let foundInDb: any = null
    const dbResult = await c.env.DB.prepare(
      'SELECT DISTINCT lc.email FROM list_contacts lc JOIN lists l ON lc.list_id = l.id WHERE lc.email LIKE ? AND l.user_id = ? LIMIT 1'
    ).bind(`%@${domain}`, user.id).first() as any
    if (dbResult) {
      const nameGuess = capitalizeName(dbResult.email.split('@')[0])
      foundInDb = { email: dbResult.email, name: nameGuess, source: 'database' }
    }

    let found = foundInDb || null
    if (!found) {
      for (const pattern of patterns) {
        const syntax = validateSyntax(pattern)
        if (!syntax.valid) continue
        const domainResult = await validateDomain(domain)
        if (domainResult.mx_records) {
          found = { email: pattern, name: `${firstName} ${lastName}`, source: 'pattern', confidence: 'medium' }
          break
        }
      }
    }

    const result = found || { email: '', name: `${firstName} ${lastName}`, source: 'none', confidence: 'low' }

    try { await useFeatureCredit(user.id, 'finder', c.env.DB) } catch {}
    try { await c.env.DB.prepare(
      'INSERT INTO finder_queries (user_id, name, domain, result, email_found, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, name, domain, JSON.stringify(result), result.email || '', result.email ? 'found' : 'not_found').run() } catch {}

    return c.json({ result, credits: { used: credits.used + 1, limit: credits.limit } })
  } catch (err: any) { return c.json({ error: 'Finder failed', detail: err.message, stack: err.stack }, 500) }
})

app.post('/api/finder/company', async (c) => {
  const rl = await rateLimit(c, 'finder')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests' }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const credits = await checkFeatureCredits(user.id, 'finder', c.env.DB)
  if (!credits.ok) return c.json({ error: 'Monthly finder credits exhausted', used: credits.used, limit: credits.limit }, 429)

  try {
    const { domain } = await c.req.json() as any
    if (!domain) return c.json({ error: 'Domain is required' }, 400)

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()

    const contacts = await c.env.DB.prepare(
      'SELECT DISTINCT lc.email, lc.name, lc.company FROM list_contacts lc JOIN lists l ON lc.list_id = l.id WHERE lc.email LIKE ? AND l.user_id = ? ORDER BY lc.created_at DESC LIMIT 50'
    ).bind(`%@${cleanDomain}`, user.id).all() as any

    const dbEmails = (contacts.results || []).map((r: any) => ({
      email: r.email,
      name: r.name || '',
      company: r.company || '',
      confidence: 'verified' as const,
      source: 'database' as const,
    }))

    const roleEmails = [
      `info@${cleanDomain}`, `contact@${cleanDomain}`, `support@${cleanDomain}`,
      `sales@${cleanDomain}`, `marketing@${cleanDomain}`, `hello@${cleanDomain}`,
      `admin@${cleanDomain}`, `press@${cleanDomain}`, `jobs@${cleanDomain}`,
      `contato@${cleanDomain}`, `rh@${cleanDomain}`, `financeiro@${cleanDomain}`,
      `comercial@${cleanDomain}`, `sac@${cleanDomain}`, `ouvidoria@${cleanDomain}`,
    ]

    const smtpUrl = (c.env as any).SMTP_VERIFIER
    let validRoleEmails: any[] = []

    const domainResult = await validateDomain(cleanDomain)
    if (domainResult.mx_records) {
      for (const email of roleEmails) {
        const syntax = validateSyntax(email)
        if (!syntax.valid) continue

        let confidence = 'low'
        let verified = false

        if (smtpUrl) {
          try {
            const res = await fetch(`${smtpUrl}/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
              signal: AbortSignal.timeout(15000),
            })
            if (res.ok) {
              const smtp = await res.json()
              if (smtp.deliverable) { confidence = 'verified'; verified = true }
              else if (!smtp.reason?.includes('Connection failed')) { confidence = 'invalid' }
              else confidence = 'unverified'
            }
          } catch { confidence = 'unverified' }
        } else {
          confidence = 'unverified'
        }

        if (confidence !== 'invalid') {
          validRoleEmails.push({ email, role: email.split('@')[0], confidence, source: 'pattern' })
        }
      }
    }

    let crawlerEmails: any[] = []
    const crawlerUrl = (c.env as any).CRAWLER_URL
    if (crawlerUrl) {
      try {
        const res = await fetch(`${crawlerUrl}/crawl`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
          signal: AbortSignal.timeout(30000),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.emails) {
            crawlerEmails = data.emails
              .filter((e: any) => !e.email.endsWith(`@${cleanDomain}`) || e.email.startsWith('info@') || e.email.startsWith('contato@') || e.source !== 'pattern')
              .map((e: any) => ({ email: e.email, source: e.source, context: e.context, confidence: 'found', role: '' }))
          }
        }
      } catch {}
    }

    const seen = new Set<string>()
    const all = [...dbEmails, ...crawlerEmails, ...validRoleEmails].filter(e => {
      if (seen.has(e.email)) return false
      seen.add(e.email)
      return true
    })

    try { await useFeatureCredit(user.id, 'finder', c.env.DB) } catch {}
    try { await c.env.DB.prepare(
      'INSERT INTO finder_queries (user_id, name, domain, result, email_found, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, '', cleanDomain, JSON.stringify(all), all.length > 0 ? all[0].email : '', all.length > 0 ? 'found' : 'not_found').run() } catch {}

    return c.json({ results: all, total: all.length, credits: { used: credits.used + 1, limit: credits.limit } })
  } catch (err: any) { return c.json({ error: 'Company finder failed', detail: err.message }, 500) }
})

app.post('/api/enricher', async (c) => {
  const rl = await rateLimit(c, 'finder')
  setRateHeaders(c, rl)
  if (!rl.ok) return c.json({ error: 'Too many requests' }, 429)
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const credits = await checkFeatureCredits(user.id, 'enricher', c.env.DB)
  if (!credits.ok) return c.json({ error: 'Monthly enricher credits exhausted', used: credits.used, limit: credits.limit }, 429)

  try {
    const { email } = await c.req.json() as any
    if (!email || !email.includes('@')) return c.json({ error: 'Valid email required' }, 400)

    const domain = email.split('@')[1]
    const localPart = email.split('@')[0]
    const nameGuess = capitalizeName(localPart)
    const nameParts = extractNameFromEmail(email)

    const dbContact = await c.env.DB.prepare(
      'SELECT lc.name, lc.company, lc.email FROM list_contacts lc JOIN lists l ON lc.list_id = l.id WHERE lc.email = ? AND l.user_id = ? LIMIT 1'
    ).bind(email, user.id).first() as any

    const companyName = domain
      .replace('.com.br', '')
      .replace('.com', '')
      .replace('.net', '')
      .replace('.org', '')
      .split('.')[0]
    const companyGuess = companyName.charAt(0).toUpperCase() + companyName.slice(1)

    const result = {
      email,
      name: dbContact?.name || nameGuess || '',
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      company: dbContact?.company || companyGuess || '',
      domain,
      title: '',
      source: dbContact ? 'database' : 'pattern',
    }

    await useFeatureCredit(user.id, 'enricher', c.env.DB)
    await c.env.DB.prepare(
      'INSERT INTO enricher_queries (user_id, email, name, company, domain, result) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, email, result.name, result.company, domain, JSON.stringify(result)).run()

    return c.json({ result, credits: { used: credits.used + 1, limit: credits.limit } })
  } catch { return c.json({ error: 'Enricher failed' }, 500) }
})

app.get('/api/finder/history', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const rows = await c.env.DB.prepare('SELECT * FROM finder_queries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(user.id).all()
  return c.json({ history: rows.results })
})

app.get('/api/enricher/history', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const rows = await c.env.DB.prepare('SELECT * FROM enricher_queries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(user.id).all()
  return c.json({ history: rows.results })
})

app.get('/api/credits', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const month = new Date().toISOString().slice(0, 7)
  const rows = await c.env.DB.prepare('SELECT feature, used, monthly_limit FROM user_credits WHERE user_id = ? AND month = ?').bind(user.id, month).all()
  const finder = rows.results.find((r: any) => r.feature === 'finder')
  const enricher = rows.results.find((r: any) => r.feature === 'enricher')
  return c.json({
    finder: { used: finder?.used || 0, limit: finder?.monthly_limit || 100 },
    enricher: { used: enricher?.used || 0, limit: enricher?.monthly_limit || 100 },
  })
})

app.get('/api/stats', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  const total = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log WHERE user_id = ?').bind(user.id).first() as any
  const todayCount = await c.env.DB.prepare("SELECT COUNT(*) as c FROM validation_log WHERE user_id = ? AND created_at >= ?").bind(user.id, today).first() as any
  const weekCount = await c.env.DB.prepare("SELECT COUNT(*) as c FROM validation_log WHERE user_id = ? AND created_at >= ?").bind(user.id, sevenDaysAgo).first() as any

  const statusDist = await c.env.DB.prepare('SELECT status, COUNT(*) as count FROM validation_log WHERE user_id = ? GROUP BY status ORDER BY count DESC LIMIT 10').bind(user.id).all()
  const dailyVolume = await c.env.DB.prepare("SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM validation_log WHERE user_id = ? AND created_at >= ? GROUP BY date ORDER BY date ASC").bind(user.id, sevenDaysAgo).all()
  const topDomains = await c.env.DB.prepare("SELECT LOWER(substr(email, instr(email, '@') + 1)) as domain, COUNT(*) as count FROM validation_log WHERE user_id = ? GROUP BY domain ORDER BY count DESC LIMIT 10").bind(user.id).all()
  const listCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM lists WHERE user_id = ?').bind(user.id).first() as any
  const contactCount = await c.env.DB.prepare('SELECT SUM(total_count) as c FROM lists WHERE user_id = ?').bind(user.id).first() as any

  return c.json({ total: total?.c || 0, today: todayCount?.c || 0, week: weekCount?.c || 0, status_distribution: statusDist.results || [], daily_volume: dailyVolume.results || [], top_domains: topDomains.results || [], lists: listCount?.c || 0, contacts: contactCount?.c || 0 })
})



app.get('/api/admin/users', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)

  const users = await c.env.DB.prepare('SELECT id, email, name, plan, is_admin, validations_total, validations_used, created_at FROM users ORDER BY created_at DESC LIMIT 100').all()
  const total = await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first() as any
  const totalValidations = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log').first() as any
  const todayValidations = await c.env.DB.prepare("SELECT COUNT(*) as c FROM validation_log WHERE created_at >= ?").bind(new Date().toISOString().slice(0, 10)).first() as any

  return c.json({ users: users.results, total: total?.c || 0, total_validations: totalValidations?.c || 0, today_validations: todayValidations?.c || 0 })
})

app.get('/api/admin/stats', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first() as any
  const totalValidations = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log').first() as any
  const todayValidations = await c.env.DB.prepare("SELECT COUNT(*) as c FROM validation_log WHERE created_at >= ?").bind(today).first() as any
  const weekVolume = await c.env.DB.prepare("SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM validation_log WHERE created_at >= ? GROUP BY date ORDER BY date ASC").bind(weekAgo).all()
  const topDomainsAll = await c.env.DB.prepare("SELECT LOWER(substr(email, instr(email, '@') + 1)) as domain, COUNT(*) as count FROM validation_log GROUP BY domain ORDER BY count DESC LIMIT 15").all()
  const planDist = await c.env.DB.prepare('SELECT plan, COUNT(*) as count FROM users GROUP BY plan').all()
  const apiKeysTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM api_keys').first() as any
  const listsTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM lists').first() as any
  const contactsTotal = await c.env.DB.prepare('SELECT SUM(total_count) as c FROM lists').first() as any

  return c.json({
    users: totalUsers?.c || 0,
    validations: totalValidations?.c || 0,
    today: todayValidations?.c || 0,
    week_volume: weekVolume.results || [],
    top_domains: topDomainsAll.results || [],
    plans: planDist.results || [],
    api_keys: apiKeysTotal?.c || 0,
    lists: listsTotal?.c || 0,
    contacts: contactsTotal?.c || 0,
  })
})

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 29, pro: 99, enterprise: 499 }

app.get('/api/admin/metrics', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)

  const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first() as any
  const newUsersMonth = await c.env.DB.prepare('SELECT COUNT(*) as c FROM users WHERE created_at >= ?').bind(monthStart).first() as any
  const newUsersToday = await c.env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE created_at >= ?").bind(today).first() as any

  const planDist = await c.env.DB.prepare('SELECT plan, COUNT(*) as count FROM users GROUP BY plan').all() as any
  const mrr = (planDist.results || []).reduce((sum: number, p: any) => sum + (PLAN_PRICES[p.plan] || 0) * p.count, 0)
  const payingUsers = (planDist.results || []).filter((p: any) => p.plan !== 'free').reduce((sum: number, p: any) => sum + p.count, 0)
  const totalUserCount = totalUsers?.c || 1
  const conversionRate = Math.round(payingUsers / totalUserCount * 100)

  const validationsTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log').first() as any
  const validationsMonth = await c.env.DB.prepare('SELECT COUNT(*) as c FROM validation_log WHERE created_at >= ?').bind(monthStart).first() as any
  const validationsToday = await c.env.DB.prepare("SELECT COUNT(*) as c FROM validation_log WHERE created_at >= ?").bind(today).first() as any

  const userGrowth = await c.env.DB.prepare(
    "SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM users WHERE created_at >= ? GROUP BY date ORDER BY date ASC"
  ).bind(thirtyDaysAgo).all()

  const validationGrowth = await c.env.DB.prepare(
    "SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM validation_log WHERE created_at >= ? GROUP BY date ORDER BY date ASC"
  ).bind(thirtyDaysAgo).all()

  const upgradesTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM subscription_events').first() as any

  const activeUsers = await c.env.DB.prepare(
    'SELECT COUNT(DISTINCT user_id) as c FROM usage_daily WHERE date >= ?'
  ).bind(thirtyDaysAgo).first() as any

  const apiKeysTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM api_keys').first() as any
  const listsTotal = await c.env.DB.prepare('SELECT COUNT(*) as c FROM lists').first() as any
  const contactsTotal = await c.env.DB.prepare('SELECT COALESCE(SUM(total_count),0) as c FROM lists').first() as any

  const financeRevenue = await c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as c FROM financial_transactions WHERE type = 'revenue' AND date >= ?").bind(monthStart).first() as any
  const financeExpenses = await c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as c FROM financial_transactions WHERE type = 'expense' AND date >= ?").bind(monthStart).first() as any
  const totalRevenue = (financeRevenue?.c || 0) + mrr
  const totalExpenses = financeExpenses?.c || 0
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0

  return c.json({
    growth: {
      total_users: totalUsers?.c || 0,
      new_this_month: newUsersMonth?.c || 0,
      new_today: newUsersToday?.c || 0,
      user_growth_daily: userGrowth.results || [],
      validation_growth_daily: validationGrowth.results || [],
      total_validations: validationsTotal?.c || 0,
      validations_this_month: validationsMonth?.c || 0,
      validations_today: validationsToday?.c || 0,
    },
    financial: {
      mrr,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      paying_users: payingUsers,
      conversion_rate: conversionRate,
      arpu: mrr > 0 ? Math.round(mrr / totalUserCount * 100) / 100 : 0,
      plan_distribution: planDist.results || [],
      price_per_plan: PLAN_PRICES,
      total_upgrades: upgradesTotal?.c || 0,
    },
    usage: {
      active_users_30d: activeUsers?.c || 0,
      api_keys: apiKeysTotal?.c || 0,
      lists: listsTotal?.c || 0,
      contacts: contactsTotal?.c || 0,
      daily_limit_total: totalUserCount * 100,
    },
  })
})

app.get('/api/admin/finances', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const url = new URL(c.req.url)
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const startDate = `${month}-01`
  const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().slice(0, 10)
  const type = url.searchParams.get('type') || ''

  let sql = 'SELECT * FROM financial_transactions WHERE date >= ? AND date <= ?'
  const params: any[] = [startDate, endDate]
  if (type) { sql += ' AND type = ?'; params.push(type) }
  sql += ' ORDER BY date DESC, created_at DESC'

  const rows = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json({ transactions: rows.results })
})

app.post('/api/admin/finances', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { description, type, category, amount, date, recurring, notes } = await c.req.json() as any
  if (!description || !amount) return c.json({ error: 'Description and amount required' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO financial_transactions (description, type, category, amount, date, recurring, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(description, type || 'expense', category || 'other', amount, date || new Date().toISOString().slice(0, 10), recurring || 'one-time', notes || '', user.email).run()

  return c.json({ success: true, id: result.meta?.last_row_id })
})

app.delete('/api/admin/finances/:id', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM financial_transactions WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/admin/finances/summary', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)

  const now = new Date()
  const monthStart = now.toISOString().slice(0, 7)
  const monthStartDate = `${monthStart}-01`
  const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const revenue = await c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as c FROM financial_transactions WHERE type = 'revenue' AND date >= ? AND date <= ?").bind(monthStartDate, monthEndDate).first() as any
  const expenses = await c.env.DB.prepare("SELECT COALESCE(SUM(amount),0) as c FROM financial_transactions WHERE type = 'expense' AND date >= ? AND date <= ?").bind(monthStartDate, monthEndDate).first() as any

  const byCategory = await c.env.DB.prepare("SELECT category, COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE type = 'expense' AND date >= ? AND date <= ? GROUP BY category ORDER BY total DESC").bind(monthStartDate, monthEndDate).all()

  const totalRevenue = revenue?.c || 0
  const totalExpenses = expenses?.c || 0
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0

  return c.json({
    month: monthStart,
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    profit_margin: profitMargin,
    expenses_by_category: byCategory.results || [],
  })
})

const MODULES = ['validate', 'lists', 'finder', 'enricher', 'history', 'api_keys', 'billing', 'whatsapp', 'consultas']

app.get('/api/modules', async (c) => {
  const user = await getUserFromToken(c)
  const userId = user?.id || ''
  const globals = await c.env.DB.prepare('SELECT module, enabled FROM module_toggles').all() as any
  const userOverrides = userId ? await c.env.DB.prepare('SELECT module, enabled FROM user_module_toggles WHERE user_id = ?').bind(userId).all() as any : { results: [] }

  const globalMap: Record<string, number> = {}
  for (const g of (globals.results || [])) globalMap[g.module] = g.enabled
  const overrideMap: Record<string, number> = {}
  for (const o of (userOverrides.results || [])) overrideMap[o.module] = o.enabled

  const result: Record<string, boolean> = {}
  for (const m of MODULES) {
    const globalEnabled = globalMap[m] !== 0
    const userOverride = overrideMap[m]
    result[m] = userOverride !== undefined ? (userOverride === 1) : globalEnabled
  }

  return c.json({ modules: result })
})

app.get('/api/admin/modules', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const globals = await c.env.DB.prepare('SELECT module, enabled FROM module_toggles ORDER BY module').all() as any
  const users = await c.env.DB.prepare("SELECT id, email, name FROM users WHERE is_admin = 0 ORDER BY created_at DESC LIMIT 100").all() as any
  const overrides = await c.env.DB.prepare('SELECT user_id, module, enabled FROM user_module_toggles').all() as any

  const overrideMap: Record<string, Record<string, number>> = {}
  for (const o of (overrides.results || [])) {
    if (!overrideMap[o.user_id]) overrideMap[o.user_id] = {}
    overrideMap[o.user_id][o.module] = o.enabled
  }

  const usersWithOverrides = (users.results || []).map((u: any) => ({
    ...u,
    overrides: overrideMap[u.id] || {},
  }))

  return c.json({ modules: globals.results || [], users: usersWithOverrides })
})

app.post('/api/admin/modules/toggle', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { module, enabled } = await c.req.json() as any
  if (!MODULES.includes(module)) return c.json({ error: 'Invalid module' }, 400)
  await c.env.DB.prepare('UPDATE module_toggles SET enabled = ? WHERE module = ?').bind(enabled ? 1 : 0, module).run()
  return c.json({ success: true, module, enabled: !!enabled })
})

app.post('/api/admin/modules/user-toggle', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { user_id, module, enabled } = await c.req.json() as any
  if (!MODULES.includes(module)) return c.json({ error: 'Invalid module' }, 400)

  if (enabled === null) {
    await c.env.DB.prepare('DELETE FROM user_module_toggles WHERE user_id = ? AND module = ?').bind(user_id, module).run()
  } else {
    await c.env.DB.prepare(
      'INSERT INTO user_module_toggles (user_id, module, enabled) VALUES (?, ?, ?) ON CONFLICT(user_id, module) DO UPDATE SET enabled = ?'
    ).bind(user_id, module, enabled ? 1 : 0, enabled ? 1 : 0).run()
  }

  return c.json({ success: true })
})

app.get('/api/plans', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY sort_order ASC').all()
  return c.json({ plans: rows.results })
})

app.get('/api/admin/plans', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const rows = await c.env.DB.prepare('SELECT * FROM plans ORDER BY sort_order ASC').all()
  return c.json({ plans: rows.results })
})

app.post('/api/admin/plans', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { name, slug, description, price_monthly, daily_limit, monthly_limit, features, active, sort_order } = await c.req.json() as any
  if (!name || !slug) return c.json({ error: 'Name and slug required' }, 400)
  await c.env.DB.prepare(
    'INSERT INTO plans (name, slug, description, price_monthly, daily_limit, monthly_limit, features, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(name, slug, description || '', price_monthly || 0, daily_limit || 100, monthly_limit || 3000, features || '', active !== false ? 1 : 0, sort_order || 0).run()
  return c.json({ success: true })
})

app.put('/api/admin/plans/:slug', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const slug = c.req.param('slug')
  const data = await c.req.json() as any
  const fields: string[] = []; const vals: any[] = []
  for (const key of ['name','description','price_monthly','daily_limit','monthly_limit','features','active','sort_order']) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); vals.push(data[key]) }
  }
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  vals.push(slug)
  await c.env.DB.prepare(`UPDATE plans SET ${fields.join(', ')} WHERE slug = ?`).bind(...vals).run()
  return c.json({ success: true })
})

app.delete('/api/admin/plans/:slug', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  await c.env.DB.prepare('DELETE FROM plans WHERE slug = ?').bind(c.req.param('slug')).run()
  return c.json({ success: true })
})

app.post('/api/admin/plans/sync-stripe', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  if (!sk) return c.json({ error: 'Stripe not configured. Add credentials first.' }, 400)
  const stripe = require('stripe')(sk)
  const plans = await c.env.DB.prepare('SELECT * FROM plans WHERE active = 1 AND price_monthly > 0 ORDER BY sort_order ASC').all() as any
  const results: any[] = []

  for (const plan of (plans.results || [])) {
    try {
      let priceId = plan.stripe_price_id
      if (priceId) {
        try { await stripe.prices.retrieve(priceId) } catch { priceId = '' }
      }
      if (!priceId) {
        const product = await stripe.products.create({ name: plan.name, description: plan.description })
        const price = await stripe.prices.create({
          product: product.id, unit_amount: Math.round(plan.price_monthly * 100),
          currency: 'usd', recurring: { interval: 'month' },
        })
        priceId = price.id
        await c.env.DB.prepare('UPDATE plans SET stripe_price_id = ? WHERE slug = ?').bind(priceId, plan.slug).run()
      }
      results.push({ slug: plan.slug, status: 'synced', price_id: priceId })
    } catch (err: any) {
      results.push({ slug: plan.slug, status: 'error', error: err.message })
    }
  }

  return c.json({ results })
})

app.get('/api/admin/credentials', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const keys = ['stripe_secret_key', 'stripe_publishable_key', 'stripe_webhook_secret', 'smtp_verifier', 'crawler_url', 'bdc_access_token', 'bdc_token_id']
  const result: any[] = []
  for (const key of keys) {
    const val = await c.env.EV_KV.get(`cred:${key}`)
    result.push({ key, value: val ? `${val.slice(0, 8)}...${val.slice(-4)}` : '', exists: !!val })
  }
  return c.json({ credentials: result })
})

app.post('/api/admin/credentials', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { key, value } = await c.req.json() as any
  if (!key || !value) return c.json({ error: 'Key and value required' }, 400)
  await c.env.EV_KV.put(`cred:${key}`, value)
  return c.json({ success: true })
})

app.delete('/api/admin/credentials/:key', async (c) => {
  const user = await getUserFromToken(c)
  if (!user || !user.is_admin) return c.json({ error: 'Forbidden' }, 403)
  await c.env.EV_KV.delete(`cred:${c.req.param('key')}`)
  return c.json({ success: true })
})

app.post('/api/stripe/create-checkout', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  const pk = await c.env.EV_KV.get('cred:stripe_publishable_key')
  if (!sk || !pk) return c.json({ error: 'Stripe not configured' }, 400)

  const { plan_slug } = await c.req.json() as any
  if (!plan_slug) return c.json({ error: 'Plan slug required' }, 400)

  const plan = await c.env.DB.prepare('SELECT * FROM plans WHERE slug = ? AND active = 1').bind(plan_slug).first() as any
  if (!plan) return c.json({ error: 'Invalid plan' }, 400)
  if (!plan.stripe_price_id) return c.json({ error: 'Plan not synced to Stripe. Contact admin.' }, 400)

  const stripe = require('stripe')(sk)
  const existingSub = await c.env.DB.prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND status = 'active'").bind(user.id).first() as any
  let customerId = existingSub?.stripe_customer_id || ''

  if (!customerId) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({ email: user.email, name: user.name })
      customerId = customer.id
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId, mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}/dashboard/billing?success=true`,
    cancel_url: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}/dashboard/billing?canceled=true`,
    metadata: { user_id: user.id, plan_slug: plan.slug },
  })

  return c.json({ url: session.url, session_id: session.id })
})

app.post('/api/stripe/webhook', async (c) => {
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  const whSecret = await c.env.EV_KV.get('cred:stripe_webhook_secret')
  if (!sk) return c.json({ error: 'Stripe not configured' }, 400)

  const stripe = require('stripe')(sk)
  const body = await c.req.text()
  const sig = c.req.header('stripe-signature') || ''

  let event: any
  if (whSecret) {
    try { event = stripe.webhooks.constructEvent(body, sig, whSecret) } catch { return c.json({ error: 'Invalid signature' }, 400) }
  } else {
    try { event = JSON.parse(body) } catch { return c.json({ error: 'Invalid body' }, 400) }
  }

  const session = event.data?.object
  if (event.type === 'checkout.session.completed' && session.metadata) {
    const { user_id, plan_slug } = session.metadata
    if (user_id && plan_slug) {
      await c.env.DB.prepare('UPDATE users SET plan = ?, daily_limit = (SELECT daily_limit FROM plans WHERE slug = ?) WHERE id = ?').bind(plan_slug, plan_slug, user_id).run()
      await c.env.DB.prepare('INSERT INTO subscription_events (user_id, plan, event_type) VALUES (?, ?, ?)').bind(user_id, plan_slug, 'stripe_checkout').run()
      await c.env.DB.prepare(
        'INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_slug, status, current_period_start, current_period_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status = ?'
      ).bind(session.subscription, user_id, session.customer, session.subscription, plan_slug, 'active', new Date().toISOString(), new Date(Date.now() + 30 * 86400000).toISOString(), 'active').run()

      const plan = await c.env.DB.prepare('SELECT price_monthly FROM plans WHERE slug = ?').bind(plan_slug).first() as any
      if (plan?.price_monthly) {
        await c.env.DB.prepare(
          "INSERT INTO financial_transactions (description, type, category, amount, date, notes) VALUES (?, 'revenue', 'subscription', ?, ?, ?)"
        ).bind(`Stripe: ${plan_slug} plan`, plan.price_monthly, new Date().toISOString().slice(0, 10), `Stripe subscription ${session.subscription}`).run()

        const userEmail = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(user_id).first() as any
        if (userEmail) {
          const conv = await c.env.DB.prepare("SELECT id, affiliate_user_id FROM affiliate_conversions WHERE referred_email = ? AND status = 'pending' LIMIT 1").bind(userEmail.email).first() as any
          if (conv) {
            const commission = Math.round(plan.price_monthly * 0.2 * 100) / 100
            await c.env.DB.prepare("UPDATE affiliate_conversions SET status = 'paid', amount = ?, commission = ? WHERE id = ?").bind(plan.price_monthly, commission, conv.id).run()
            await c.env.DB.prepare("UPDATE users SET affiliate_earnings = affiliate_earnings + ?, affiliate_balance = affiliate_balance + ? WHERE id = ?").bind(commission, commission, conv.affiliate_user_id).run()
          }
        }
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = await c.env.DB.prepare("SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?").bind(session.id).first() as any
    if (sub) {
      await c.env.DB.prepare("UPDATE users SET plan = 'free', daily_limit = 100 WHERE id = ?").bind(sub.user_id).run()
      await c.env.DB.prepare("UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?").bind(session.id).run()
    }
  }

  return c.json({ received: true })
})

app.get('/api/stripe/portal', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  if (!sk) return c.json({ error: 'Stripe not configured' }, 400)

  const sub = await c.env.DB.prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND status = 'active'").bind(user.id).first() as any
  if (!sub?.stripe_customer_id) return c.json({ error: 'No active subscription' }, 400)

  const stripe = require('stripe')(sk)
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}/dashboard/billing`,
  })

  return c.json({ url: portal.url })
})

app.get('/api/stripe/status', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const sub = await c.env.DB.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'").bind(user.id).first() as any
  const pk = await c.env.EV_KV.get('cred:stripe_publishable_key')
  return c.json({ subscription: sub || null, stripe_publishable_key: pk || '' })
})

app.get('/api/affiliate', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const dbUser = await c.env.DB.prepare("SELECT affiliate_code, affiliate_earnings, affiliate_balance FROM users WHERE id = ?").bind(user.id).first() as any
  const clicks = await c.env.DB.prepare("SELECT COUNT(*) as c FROM affiliate_clicks WHERE code = ?").bind(dbUser?.affiliate_code || '').first() as any
  const conversions = await c.env.DB.prepare("SELECT COUNT(*) as c, COALESCE(SUM(COALESCE(commission,0)),0) as total FROM affiliate_conversions WHERE affiliate_user_id = ? AND status = 'paid'").bind(user.id).first() as any
  return c.json({
    code: dbUser?.affiliate_code || '',
    link: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}?ref=${dbUser?.affiliate_code || ''}`,
    clicks: clicks?.c || 0,
    conversions: conversions?.c || 0,
    earnings: conversions?.total || 0,
    balance: dbUser?.affiliate_balance || 0,
  })
})

app.put('/api/affiliate/code', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { code } = await c.req.json() as any
  if (!code || code.length < 4 || !/^[a-z0-9]+$/.test(code)) return c.json({ error: 'Code must be 4+ alphanumeric characters' }, 400)
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE affiliate_code = ? AND id != ?').bind(code, user.id).first()
  if (existing) return c.json({ error: 'Code already taken' }, 409)
  await c.env.DB.prepare('UPDATE users SET affiliate_code = ? WHERE id = ?').bind(code, user.id).run()
  return c.json({ success: true, code })
})

app.get('/api/affiliate/clicks', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const dbUser = await c.env.DB.prepare("SELECT affiliate_code FROM users WHERE id = ?").bind(user.id).first() as any
  const rows = await c.env.DB.prepare("SELECT * FROM affiliate_clicks WHERE code = ? ORDER BY created_at DESC LIMIT 50").bind(dbUser?.affiliate_code || '').all()
  return c.json({ clicks: rows.results })
})

app.get('/api/affiliate/conversions', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const rows = await c.env.DB.prepare("SELECT * FROM affiliate_conversions WHERE affiliate_user_id = ? ORDER BY created_at DESC LIMIT 50").bind(user.id).all()
  return c.json({ conversions: rows.results })
})

app.post('/api/affiliate/withdraw', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const dbUser = await c.env.DB.prepare("SELECT affiliate_balance FROM users WHERE id = ?").bind(user.id).first() as any
  if (!dbUser || (dbUser.affiliate_balance || 0) < 50) return c.json({ error: 'Minimum withdrawal is $50' }, 400)

  const { paypal_email } = await c.req.json() as any
  if (!paypal_email || !paypal_email.includes('@')) return c.json({ error: 'Valid PayPal email required' }, 400)

  const amount = Math.min(dbUser.affiliate_balance, dbUser.affiliate_balance)
  await c.env.DB.prepare('UPDATE users SET affiliate_balance = affiliate_balance - ? WHERE id = ?').bind(amount, user.id).run()
  await c.env.DB.prepare("INSERT INTO affiliate_payouts (user_id, amount, method, paypal_email, status) VALUES (?, ?, 'paypal', ?, 'pending')").bind(user.id, amount, paypal_email).run()
  return c.json({ success: true, amount })
})

app.get('/api/affiliate/payouts', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const rows = await c.env.DB.prepare("SELECT * FROM affiliate_payouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").bind(user.id).all()
  return c.json({ payouts: rows.results })
})

app.get('/api/admin/affiliates', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const rows = await c.env.DB.prepare("SELECT id, email, name, affiliate_code, affiliate_earnings, affiliate_balance FROM users WHERE affiliate_code IS NOT NULL ORDER BY affiliate_earnings DESC LIMIT 100").all()
  return c.json({ affiliates: rows.results })
})

app.post('/api/admin/affiliates/pay', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { user_id, amount } = await c.req.json() as any
  await c.env.DB.prepare("UPDATE users SET affiliate_balance = affiliate_balance - ?, affiliate_earnings = affiliate_earnings - ? WHERE id = ?").bind(amount, amount, user_id).run()
  return c.json({ success: true })
})

app.get('/api/admin/affiliates/payouts', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const rows = await c.env.DB.prepare("SELECT ap.*, u.email, u.name FROM affiliate_payouts ap JOIN users u ON ap.user_id = u.id ORDER BY ap.created_at DESC LIMIT 100").all()
  return c.json({ payouts: rows.results })
})

app.post('/api/admin/affiliates/payouts/:id/process', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const id = c.req.param('id')
  const { status, notes } = await c.req.json() as any
  if (!['paid', 'rejected'].includes(status)) return c.json({ error: 'Invalid status' }, 400)
  await c.env.DB.prepare("UPDATE affiliate_payouts SET status = ?, notes = ?, processed_at = datetime('now') WHERE id = ?").bind(status, notes || '', id).run()
  if (status === 'rejected') {
    const payout = await c.env.DB.prepare('SELECT * FROM affiliate_payouts WHERE id = ?').bind(id).first() as any
    if (payout) await c.env.DB.prepare('UPDATE users SET affiliate_balance = affiliate_balance + ? WHERE id = ?').bind(payout.amount, payout.user_id).run()
  }
  return c.json({ success: true })
})

app.post('/api/affiliate/track-ref', async (c) => {
  const { code } = await c.req.json() as any
  if (!code || !/^[a-z0-9]{4,}$/.test(code)) return c.json({ error: 'Invalid code' }, 400)
  const ip = c.req.header('cf-connecting-ip') || ''
  const ua = c.req.header('user-agent') || ''
  await c.env.DB.prepare("INSERT INTO affiliate_clicks (code, ip, user_agent) VALUES (?, ?, ?)").bind(code, ip, ua).run()
  return c.json({ success: true })
})

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

const BIGDATACORP_BASE = 'https://plataforma.bigdatacorp.com.br'

async function getCredits(userId: string, db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT balance FROM credit_balance WHERE user_id = ?').bind(userId).first() as any
  return row?.balance || 0
}

async function deductCredits(userId: string, amount: number, db: D1Database, description: string, refType: string = '', refId: string = '') {
  const balance = await getCredits(userId, db)
  if (balance < amount) throw new Error('Insufficient credits')
  const newBalance = balance - amount
  await db.prepare('INSERT INTO credit_balance (user_id, balance, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(user_id) DO UPDATE SET balance = ?, updated_at = datetime(\'now\')').bind(userId, newBalance, newBalance).run()
  await db.prepare('INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(userId, 'deduction', -amount, newBalance, description, refType, refId).run()
  return newBalance
}

async function addCredits(userId: string, amount: number, db: D1Database, type: string, description: string, refType: string = '', refId: string = '') {
  const balance = await getCredits(userId, db)
  const newBalance = balance + amount
  await db.prepare('INSERT INTO credit_balance (user_id, balance, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(user_id) DO UPDATE SET balance = ?, updated_at = datetime(\'now\')').bind(userId, newBalance, newBalance).run()
  await db.prepare('INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(userId, type, amount, newBalance, description, refType, refId).run()
  return newBalance
}

app.get('/api/credits/balance', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const balance = await getCredits(user.id, c.env.DB)
  return c.json({ balance })
})

app.get('/api/credits/transactions', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const rows = await c.env.DB.prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(user.id, limit, offset).all()
  const total = await c.env.DB.prepare('SELECT COUNT(*) as c FROM credit_transactions WHERE user_id = ?').bind(user.id).first() as any
  return c.json({ transactions: rows.results, total: total?.c || 0, page, limit })
})

app.post('/api/credits/purchase', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { amount } = await c.req.json() as any
  if (!amount || amount < 1000 || amount > 100000) return c.json({ error: 'Amount must be between R$10 and R$1,000' }, 400)
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  if (!sk) return c.json({ error: 'Payment not configured' }, 400)
  const stripe = require('stripe')(sk)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'brl', product_data: { name: 'Créditos - Consultas', description: `${amount} créditos = R$ ${(amount / 100).toFixed(2)}` }, unit_amount: amount }, quantity: 1 }],
    mode: 'payment',
    success_url: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}/dashboard/credits?success=true`,
    cancel_url: `${c.env.BASE_URL || 'https://email-validator-1ge.pages.dev'}/dashboard/credits?canceled=true`,
    metadata: { user_id: user.id, credit_amount: String(amount) },
  })
  return c.json({ url: session.url })
})

app.post('/api/stripe/credits-webhook', async (c) => {
  const sk = await c.env.EV_KV.get('cred:stripe_secret_key')
  if (!sk) return c.json({ error: 'Not configured' }, 400)
  const whSecret = await c.env.EV_KV.get('cred:stripe_webhook_secret')
  const stripe = require('stripe')(sk)
  let event: any
  try {
    const raw = await c.req.text()
    const sig = c.req.header('stripe-signature') || ''
    event = whSecret ? stripe.webhooks.constructEvent(raw, sig, whSecret) : JSON.parse(raw)
  } catch { return c.json({ error: 'Invalid signature' }, 400) }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { user_id, credit_amount } = session.metadata || {}
    if (user_id && credit_amount) {
      await addCredits(user_id, parseInt(credit_amount), c.env.DB, 'purchase', `Compra de ${parseInt(credit_amount)} créditos`, 'stripe', session.id)
    }
  }
  return c.json({ received: true })
})

app.get('/api/bigdatacorp/pricing', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const groups = await c.env.DB.prepare('SELECT DISTINCT api_group FROM product_pricing WHERE product = \'consultas\' AND is_active = 1 ORDER BY api_group').all()
  const result: any = {}
  for (const g of (groups.results || [])) {
    result[g.api_group] = await c.env.DB.prepare('SELECT dataset_key, dataset_name, credit_cost FROM product_pricing WHERE product = \'consultas\' AND api_group = ? AND is_active = 1 ORDER BY dataset_name').bind(g.api_group).all()
  }
  return c.json({ groups: result })
})

const BDC_GROUP_ENDPOINTS: Record<string, string> = {
  pessoas: '/pessoas', empresas: '/empresas', produtos: '/produtos',
  enderecos: '/enderecos', processos: '/processos', veiculos: '/veiculos',
  ondemand: '/ondemand', marketplace: '/marketplace', modelagem: '/modelagem',
}

app.post('/api/bigdatacorp/:group', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const group = c.req.param('group')
  const endpoint = BDC_GROUP_ENDPOINTS[group]
  if (!endpoint) return c.json({ error: 'Invalid API group' }, 400)

  const { q, dataset, limit } = await c.req.json() as any
  if (!q || !dataset) return c.json({ error: 'q (query) and dataset are required' }, 400)

  const pricing = await c.env.DB.prepare('SELECT credit_cost FROM product_pricing WHERE product = \'consultas\' AND api_group = ? AND dataset_key = ? AND is_active = 1').bind(group, dataset).first() as any
  if (!pricing) return c.json({ error: 'Invalid or inactive dataset' }, 400)

  const creditCost = pricing.credit_cost
  const balance = await getCredits(user.id, c.env.DB)
  if (balance < creditCost) return c.json({ error: 'Insufficient credits', required: creditCost, balance }, 402)

  const accessToken = await c.env.EV_KV.get('cred:bdc_access_token')
  const tokenId = await c.env.EV_KV.get('cred:bdc_token_id')
  if (!accessToken || !tokenId) return c.json({ error: 'BigDataCorp not configured' }, 500)

  const start = Date.now()
  try {
    const res = await fetch(`${BIGDATACORP_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', AccessToken: accessToken, TokenId: tokenId, Accept: 'application/json' },
      body: JSON.stringify({ q, Datasets: dataset, Limit: limit || 10 }),
    })
    const elapsed = Date.now() - start
    const data = await res.json()

    const bdcQueryId = data.QueryId || ''
    const status = res.ok ? 'success' : 'error'

    await deductCredits(user.id, creditCost, c.env.DB, `Consulta ${dataset} (${group})`, 'bigdatacorp', bdcQueryId)
    await c.env.DB.prepare('INSERT INTO consultas_queries (user_id, api_group, dataset, query_text, credit_cost, response_status, bigdatacorp_query_id, elapsed_ms, response_preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(user.id, group, dataset, q, creditCost, status, bdcQueryId, elapsed, JSON.stringify(data).slice(0, 500)).run()

    return c.json({ ...data, _meta: { balance: await getCredits(user.id, c.env.DB), credit_cost: creditCost, elapsed_ms: elapsed } })
  } catch (e: any) {
    await c.env.DB.prepare('INSERT INTO consultas_queries (user_id, api_group, dataset, query_text, credit_cost, response_status, elapsed_ms) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(user.id, group, dataset, q, creditCost, 'error', Date.now() - start).run()
    return c.json({ error: 'BigDataCorp request failed', detail: e.message }, 502)
  }
})

app.get('/api/consultas/history', async (c) => {
  const user = await getUserFromToken(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const rows = await c.env.DB.prepare('SELECT * FROM consultas_queries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(user.id, limit, offset).all()
  const total = await c.env.DB.prepare('SELECT COUNT(*) as c FROM consultas_queries WHERE user_id = ?').bind(user.id).first() as any
  return c.json({ history: rows.results, total: total?.c || 0, page, limit })
})

app.post('/api/admin/credits/manual', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const { user_id, amount, description } = await c.req.json() as any
  if (!user_id || !amount) return c.json({ error: 'user_id and amount required' }, 400)
  const type = amount > 0 ? 'admin_adjust' : 'refund'
  await addCredits(user_id, amount, c.env.DB, type, description || `Admin adjustment: ${amount}`, 'admin', admin.id)
  return c.json({ success: true, balance: await getCredits(user_id, c.env.DB) })
})

app.get('/api/admin/credits/users', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const search = c.req.query('search') || ''
  const rows = await c.env.DB.prepare(`SELECT u.id, u.email, u.name, COALESCE(cb.balance, 0) as balance FROM users u LEFT JOIN credit_balance cb ON u.id = cb.user_id WHERE u.email LIKE ? OR u.name LIKE ? ORDER BY cb.balance DESC LIMIT 100`).bind(`%${search}%`, `%${search}%`).all()
  return c.json({ users: rows.results })
})

app.get('/api/admin/bigdatacorp/pricing', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const group = c.req.query('group') || ''
  const q = group ? `SELECT * FROM product_pricing WHERE product = 'consultas' AND api_group = ? ORDER BY dataset_name` : `SELECT * FROM product_pricing WHERE product = 'consultas' ORDER BY api_group, dataset_name`
  const rows = group ? await c.env.DB.prepare(q).bind(group).all() : await c.env.DB.prepare(q).all()
  return c.json({ pricing: rows.results })
})

app.put('/api/admin/bigdatacorp/pricing/:id', async (c) => {
  const admin = await getUserFromToken(c)
  if (!admin || !admin.is_admin) return c.json({ error: 'Forbidden' }, 403)
  const id = c.req.param('id')
  const { credit_cost, is_active } = await c.req.json() as any
  if (credit_cost !== undefined && (credit_cost < 1 || credit_cost > 100000)) return c.json({ error: 'Invalid credit cost' }, 400)
  const updates: string[] = []
  const vals: any[] = []
  if (credit_cost !== undefined) { updates.push('credit_cost = ?'); vals.push(credit_cost) }
  if (is_active !== undefined) { updates.push('is_active = ?'); vals.push(is_active ? 1 : 0) }
  if (updates.length === 0) return c.json({ error: 'Nothing to update' }, 400)
  updates.push("updated_at = datetime('now')")
  await c.env.DB.prepare(`UPDATE product_pricing SET ${updates.join(', ')} WHERE id = ?`).bind(...vals, id).run()
  return c.json({ success: true })
})

async function proxyWhatsapp(c: any, path: string, method: string = 'GET') {
  try {
    const baseUrl = c.env.WHATSAPP_SERVICE_URL || 'http://localhost:3003'
    const apiKey = c.env.WHATSAPP_API_KEY || 'dev-key'
    const body = method === 'POST' || method === 'PUT' || method === 'DELETE' ? await c.req.json().catch(() => ({})) : undefined
    const url = `${baseUrl}${path}${c.req.query() ? '?' + new URLSearchParams(c.req.query()).toString() : ''}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: 'WhatsApp service unavailable', detail: e.message }, 502)
  }
}

app.get('/api/whatsapp/instances', async (c) => proxyWhatsapp(c, '/api/instances'))
app.get('/api/whatsapp/instance/:id/status', async (c) => proxyWhatsapp(c, `/api/instance/${c.req.param('id')}/status`))
app.post('/api/whatsapp/instance/create', async (c) => proxyWhatsapp(c, '/api/instance/create', 'POST'))
app.post('/api/whatsapp/instance/connect', async (c) => proxyWhatsapp(c, '/api/instance/connect', 'POST'))
app.post('/api/whatsapp/instance/pairing', async (c) => proxyWhatsapp(c, '/api/instance/pairing', 'POST'))
app.post('/api/whatsapp/instance/disconnect', async (c) => proxyWhatsapp(c, '/api/instance/disconnect', 'POST'))
app.delete('/api/whatsapp/instance/:id', async (c) => proxyWhatsapp(c, `/api/instance/${c.req.param('id')}`, 'DELETE'))
app.post('/api/whatsapp/message/text', async (c) => proxyWhatsapp(c, '/api/message/text', 'POST'))
app.post('/api/whatsapp/message/media', async (c) => proxyWhatsapp(c, '/api/message/media', 'POST'))
app.post('/api/whatsapp/message/buttons', async (c) => proxyWhatsapp(c, '/api/message/buttons', 'POST'))
app.post('/api/whatsapp/message/list', async (c) => proxyWhatsapp(c, '/api/message/list', 'POST'))
app.post('/api/whatsapp/message/read', async (c) => proxyWhatsapp(c, '/api/message/read', 'POST'))
app.post('/api/whatsapp/message/seen', async (c) => proxyWhatsapp(c, '/api/message/seen', 'POST'))
app.get('/api/whatsapp/chats/:id', async (c) => proxyWhatsapp(c, `/api/chats/${c.req.param('id')}`))
app.get('/api/whatsapp/messages/:id/*', async (c) => {
  const jid = c.req.raw.url.split('/api/whatsapp/messages/')[1]?.split('?')[0]
  proxyWhatsapp(c, `/api/messages/${jid}`)
})
app.get('/api/whatsapp/contacts/:id', async (c) => proxyWhatsapp(c, `/api/contacts/${c.req.param('id')}`))
app.post('/api/whatsapp/contacts/check', async (c) => proxyWhatsapp(c, '/api/contacts/check', 'POST'))
app.post('/api/whatsapp/group/create', async (c) => proxyWhatsapp(c, '/api/group/create', 'POST'))
app.post('/api/whatsapp/group/add', async (c) => proxyWhatsapp(c, '/api/group/add', 'POST'))
app.post('/api/whatsapp/group/remove', async (c) => proxyWhatsapp(c, '/api/group/remove', 'POST'))
app.post('/api/whatsapp/group/promote', async (c) => proxyWhatsapp(c, '/api/group/promote', 'POST'))
app.post('/api/whatsapp/group/demote', async (c) => proxyWhatsapp(c, '/api/group/demote', 'POST'))
app.get('/api/whatsapp/group/:id/:groupJid', async (c) => proxyWhatsapp(c, `/api/group/${c.req.param('id')}/${encodeURIComponent(c.req.param('groupJid'))}`))
app.get('/api/whatsapp/invite/:id/:groupJid', async (c) => proxyWhatsapp(c, `/api/group/invite/${c.req.param('id')}/${encodeURIComponent(c.req.param('groupJid'))}`))
app.post('/api/whatsapp/webhook/set', async (c) => proxyWhatsapp(c, '/api/webhook/set', 'POST'))
app.get('/api/whatsapp/webhook/:id', async (c) => proxyWhatsapp(c, `/api/webhook/${c.req.param('id')}`))

export default app
