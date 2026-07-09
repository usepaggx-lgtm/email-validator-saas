'use client'

import { useState, useEffect } from 'react'
import { BarChart3, CheckCircle, XCircle, AlertTriangle, Loader2, Sparkles, TrendingUp, List, Globe, Activity } from 'lucide-react'
import { apiGetUsage, apiValidateAuth, apiGetHistory, apiStats, authFetch } from '@/lib/utils'
import { apiGetLists, apiAddContacts } from '@/lib/lists'

const STATUS_COLORS: Record<string, string> = {
  VALID: '#22c55e', PROBABLY_VALID: '#3b82f6', CATCH_ALL: '#f59e0b',
  DISPOSABLE: '#eab308', INVALID: '#ef4444', INVALID_FORMAT: '#dc2626',
  INVALID_DOMAIN: '#dc2626', SPAMTRAP: '#7c3aed', GIBBERISH: '#f97316',
  INBOX_FULL: '#f59e0b', DISABLED: '#ef4444',
}

export default function DashboardContent() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ today: 0, total: 0, daily_limit: 100, plan: 'free', keys: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [lists, setLists] = useState<any[]>([])
  const [selectedList, setSelectedList] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    Promise.all([
      apiGetUsage().then(setUsage).catch(() => {}),
      apiGetHistory(1).then(d => setRecent(d.history?.slice(0, 10) || [])).catch(() => {}),
      apiStats().then(setStats).catch(() => {}),
      apiGetLists().then(d => {
        const all = d.lists || []
        setLists(all)
        const def = all.find((l: any) => l.name === 'Default List')
        setSelectedList(def?.id || all[0]?.id || '')
      }).catch(() => {}),
    ]).finally(() => setPageLoading(false))
  }, [])

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@') || loading) return
    setLoading(true); setResult(null); setSaveMsg('')
    try {
      const data = await authFetch('/api/validate/auth', { method: 'POST', body: JSON.stringify({ email: email.trim() }) })
      if (data.error) { setResult({ email, status: 'ERROR', error: data.error }); return }
      setResult(data)
      setRecent(prev => [{ email: data.email, status: data.status, created_at: new Date().toISOString() }, ...prev].slice(0, 10))
      apiGetUsage().then(setUsage).catch(() => {}); apiStats().then(setStats).catch(() => {})
      if (selectedList) { setSaving(true); try { await apiAddContacts(selectedList, [{ email: email.trim() }]); setSaveMsg('Saved ✓') } catch {}; setSaving(false) }
    } catch { setResult({ email, status: 'ERROR', error: 'Connection failed' }) }
    finally { setLoading(false) }
  }

  if (pageLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>

  const remaining = Math.max(usage.daily_limit - usage.today, 0)
  const dist = stats?.status_distribution || []
  const dailyVol = stats?.daily_volume || []
  const topDomains = stats?.top_domains || []
  const total = dist.reduce((s: number, d: any) => s + d.count, 0)
  const maxVol = Math.max(...dailyVol.map((d: any) => d.count), 1)

  const DonutChart = ({ data }: { data: any[] }) => {
    const totalV = data.reduce((s: number, d: any) => s + d.count, 0)
    if (totalV === 0) return <div className="text-center py-6 text-gray-400 text-sm">No data yet</div>
    let cumulative = 0
    const slices = data.map((d: any) => {
      const start = cumulative / totalV * 100
      cumulative += d.count
      const end = cumulative / totalV * 100
      return { ...d, start, end }
    })
    const safe = data.filter(d => d.status === 'VALID' || d.status === 'PROBABLY_VALID').reduce((s, d) => s + d.count, 0)
    const rate = Math.round(safe / totalV * 100)
    return (
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {slices.map((s: any, i: number) => (
              <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={STATUS_COLORS[s.status] || '#e5e7eb'} strokeWidth="16"
                strokeDasharray={`${(s.end - s.start) * 2.513} 251.3`} strokeDashoffset={`${-s.start * 2.513}`} />
            ))}
            <circle cx="50" cy="50" r="32" fill="white" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{rate}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {data.slice(0, 6).map((d: any) => (
            <div key={d.status} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[d.status] || '#e5e7eb' }} />
              <span className="text-gray-600 flex-1 truncate">{d.status.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="font-medium text-gray-900">{d.count}</span>
              <span className="text-gray-400 w-8 text-right">{Math.round(d.count / totalV * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const BarChart = ({ data }: { data: any[] }) => (
    <div className="space-y-1.5">
      {data.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm">No data this week</div> :
        data.map((d: any) => (
          <div key={d.date} className="flex items-center gap-3 text-xs">
            <span className="w-20 text-gray-500 shrink-0">{d.date.slice(5)}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${d.count / maxVol * 100}%` }} />
            </div>
            <span className="w-8 text-right font-medium text-gray-700">{d.count}</span>
          </div>
        ))
      }
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: usage.total.toLocaleString(), icon: BarChart3, change: '' },
          { label: 'Today', value: usage.today.toLocaleString(), icon: Activity, change: `of ${usage.daily_limit}` },
          { label: 'Success', value: dist.length ? `${Math.round(dist.filter((d: any) => ['VALID','PROBABLY_VALID'].includes(d.status)).reduce((s: number, d: any) => s + d.count, 0) / (dist.reduce((s: number, d: any) => s + d.count, 0) || 1) * 100)}%` : '—', icon: TrendingUp, change: '' },
          { label: 'Lists', value: stats?.lists?.toString() || '0', icon: List, change: `${stats?.contacts || 0} contacts` },
          { label: 'Remaining', value: remaining.toLocaleString(), icon: Sparkles, change: 'validations' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500 font-medium">{card.label}</span>
              <card.icon size={14} className="text-gray-300" />
            </div>
            <div className="text-xl font-bold text-gray-900">{card.value}</div>
            {card.change && <span className="text-[10px] text-gray-400">{card.change}</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Validate</h3>
            <form onSubmit={handleValidate} className="flex gap-2 mb-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..."
                className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <div className="relative shrink-0">
                <select value={selectedList} onChange={e => setSelectedList(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-2.5 pr-7 py-2.5 text-xs text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[100px]">
                  {lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <button type="submit" disabled={loading || remaining <= 0}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 shrink-0">
                {loading ? '...' : 'Go'}
              </button>
            </form>
            {saveMsg && <p className="text-xs text-green-600 mb-2">{saveMsg}</p>}

            {result && (
              <div className={`p-3 rounded-xl border text-xs ${result.is_safe_to_send ? 'bg-green-50 border-green-200' : result.status === 'DISPOSABLE' || result.status === 'CATCH_ALL' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.is_safe_to_send ? <CheckCircle size={14} className="text-green-600 shrink-0" /> : <XCircle size={14} className="text-red-600 shrink-0" />}
                  <span className="font-semibold text-gray-900 truncate">{result.email}</span>
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${result.is_safe_to_send ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{result.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className={`${result.is_valid_syntax ? 'text-green-600' : 'text-red-600'}`}>syntax {result.is_valid_syntax ? '✓' : '✗'}</span>
                  <span className={`${result.mx_accepts_mail ? 'text-green-600' : 'text-red-600'}`}>mx {result.mx_accepts_mail ? '✓' : '✗'}</span>
                  <span className={`${result.is_deliverable ? 'text-green-600' : result.is_deliverable === undefined ? 'text-gray-400' : 'text-red-600'}`}>{result.is_deliverable === undefined ? 'smtp —' : result.is_deliverable ? 'deliverable ✓' : 'deliverable ✗'}</span>
                  {result.is_disposable && <span className="text-red-600">disposable ⚠</span>}
                  {result.is_catch_all && <span className="text-amber-600">catch-all ⚠</span>}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900">Recent</span>
                <a href="/dashboard/history" className="text-[10px] text-blue-600">All →</a>
              </div>
              {recent.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">No activity</p> :
                <div className="space-y-1">
                  {recent.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {r.status === 'VALID' ? <CheckCircle size={10} className="text-green-500 shrink-0" /> : <XCircle size={10} className="text-red-500 shrink-0" />}
                        <span className="text-gray-700 truncate">{r.email}</span>
                      </div>
                      <span className="text-gray-400 shrink-0 ml-2">{r.time || r.created_at ? new Date(r.time || r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Distribution</h3>
            <DonutChart data={dist} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Volume (7 days)</h3>
            <BarChart data={dailyVol} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Globe size={16} className="text-gray-400" /> Top Domains</h3>
        {topDomains.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Validate emails to see top domains</p> :
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {topDomains.map((d: any, i: number) => {
              const max = Math.max(...topDomains.map((x: any) => x.count))
              return (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-mono text-gray-900 truncate">{d.domain}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${d.count / max * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{d.count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        }
      </div>
    </>
  )
}
