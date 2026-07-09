'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, Sparkles, ExternalLink } from 'lucide-react'
import { getUser, authFetch, apiGetUsage, apiUpgradePlan } from '@/lib/utils'

export default function BillingContent() {
  const [user, setUser] = useState<any>(null)
  const [usage, setUsage] = useState({ today: 0, total: 0, daily_limit: 100, plan: 'free', keys: 0 })
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState('')
  const [stripeReady, setStripeReady] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    Promise.all([
      apiGetUsage().then(setUsage).catch(() => {}),
      fetch(`${API}/api/plans`).then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {}),
      authFetch('/api/stripe/status').then(d => setStripeReady(!!d.stripe_publishable_key)).catch(() => {}),
    ]).finally(() => {
      setLoading(false)
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') setMessage('Subscription activated! Welcome aboard.')
      if (params.get('canceled') === 'true') setMessage('Checkout canceled. No changes were made.')
    })
  }, [])

  async function handleUpgrade(planSlug: string) {
    if (stripeReady) {
      setUpgrading(planSlug)
      try {
        const d = await authFetch('/api/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ plan_slug: planSlug }) })
        if (d.url) window.location.href = d.url
        else setMessage('Checkout failed: ' + (d.error || 'Unknown error'))
      } catch { setMessage('Failed to start checkout') }
      finally { setUpgrading('') }
    } else {
      setUpgrading(planSlug)
      try { const d = await apiUpgradePlan(planSlug); if (d.success) { setUsage(prev => ({ ...prev, plan: planSlug })); setMessage(`Upgraded to ${planSlug}!`) } } catch {}
      finally { setUpgrading('') }
    }
  }

  async function handlePortal() {
    const d = await authFetch('/api/stripe/portal')
    if (d.url) window.location.href = d.url
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>

  const remaining = Math.max(usage.daily_limit - usage.today, 0)

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Billing & Plans</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your subscription and usage.</p>

      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">{message}</div>
      )}

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-blue-200">Current Plan</p>
            <h2 className="text-2xl font-bold capitalize">{usage.plan}</h2>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3 text-center">
            <div className="text-2xl font-bold">{remaining}</div>
            <div className="text-xs text-blue-200">validations left today</div>
          </div>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min((usage.today / usage.daily_limit) * 100, 100)}%` }} />
        </div>
        <p className="text-xs text-blue-200 mt-2">{usage.today} of {usage.daily_limit} used today · {usage.total.toLocaleString()} all time</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.filter(p => p.active).map((plan: any) => {
          const isCurrent = usage.plan === plan.slug
          const features = (plan.features || '').split('\n').filter(Boolean)
          return (
            <div key={plan.slug} className={`bg-white rounded-2xl border-2 p-6 card-hover ${isCurrent && usage.plan !== 'free' ? 'border-blue-200' : !isCurrent && plan.slug === 'starter' ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-gray-100'}`}>
              {plan.slug === 'starter' && !isCurrent && <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-3">Most Popular</div>}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price_monthly}</span>
                {plan.price_monthly > 0 && <span className="text-sm text-gray-500">/month</span>}
              </div>
              <div className="text-sm text-gray-500 mb-5">
                <strong className="text-gray-700">{plan.daily_limit?.toLocaleString()}</strong>/day · <strong className="text-gray-700">{plan.monthly_limit?.toLocaleString()}</strong>/month
              </div>
              <ul className="space-y-2.5 mb-6">
                {features.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600"><Check size={15} className="text-green-500 mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              {plan.price_monthly === 0 ? (
                <span className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-blue-50 text-blue-700">Free</span>
              ) : isCurrent ? (
                <span className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-blue-50 text-blue-700">Current Plan</span>
              ) : (
                <button onClick={() => handleUpgrade(plan.slug)} disabled={upgrading === plan.slug}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {upgrading === plan.slug ? <Loader2 size={16} className="animate-spin" /> : null}
                  {upgrading === plan.slug ? 'Processing...' : stripeReady ? 'Subscribe with Card' : 'Upgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {stripeReady && usage.plan !== 'free' && (
        <div className="flex justify-center mb-8">
          <button onClick={handlePortal} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            <ExternalLink size={16} /> Manage Subscription in Stripe
          </button>
        </div>
      )}
    </>
  )
}
