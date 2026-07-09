const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ev_token')
}

export function setToken(token: string) {
  localStorage.setItem('ev_token', token)
}

export function clearToken() {
  localStorage.removeItem('ev_token')
  localStorage.removeItem('ev_user')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('ev_user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

export function setUser(user: any) {
  localStorage.setItem('ev_user', JSON.stringify(user))
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...options, headers })
  return res.json()
}

export async function apiRegister(email: string, password: string, name: string) {
  return authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) })
}

export async function apiLogin(email: string, password: string) {
  return authFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function apiGetMe() {
  return authFetch('/api/auth/me')
}

export async function apiValidateAuth(email: string) {
  return authFetch('/api/validate/auth', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function apiValidateBatch(emails: string[]) {
  return authFetch('/api/validate/batch', { method: 'POST', body: JSON.stringify({ emails }) })
}

export async function apiGetKeys() {
  return authFetch('/api/keys')
}

export async function apiCreateKey(name: string) {
  return authFetch('/api/keys', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function apiDeleteKey(id: string) {
  return authFetch(`/api/keys/${id}`, { method: 'DELETE' })
}

export async function apiGetUsage() {
  return authFetch('/api/usage')
}

export async function apiGetHistory(page: number = 1) {
  return authFetch(`/api/history?page=${page}`)
}

export async function apiUpgradePlan(plan: string) {
  return authFetch('/api/plan/upgrade', { method: 'POST', body: JSON.stringify({ plan }) })
}

export async function apiUpdateProfile(name: string) {
  return authFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ name }) })
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  return authFetch('/api/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
}

export async function api2faStatus() {
  return authFetch('/api/auth/2fa/status')
}

export async function api2faSetup(password: string) {
  return authFetch('/api/auth/2fa/setup', { method: 'POST', body: JSON.stringify({ password }) })
}

export async function api2faVerify(code: string, secret: string) {
  return authFetch('/api/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code, secret }) })
}

export async function api2faDisable(code: string, password: string) {
  return authFetch('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code, password }) })
}

export async function api2faLogin(tempToken: string, code: string) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
  const res = await fetch(`${API}/api/auth/2fa/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temp_token: tempToken, code }),
  })
  return res.json()
}

export async function apiFinder(name: string, domain: string) {
  return authFetch('/api/finder', { method: 'POST', body: JSON.stringify({ name, domain }) })
}

export async function apiEnricher(email: string) {
  return authFetch('/api/enricher', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function apiCredits() {
  return authFetch('/api/credits')
}

export async function apiStats() {
  return authFetch('/api/stats')
}
