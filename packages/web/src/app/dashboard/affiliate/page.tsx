'use client'

import { useState, useEffect } from 'react'
import { Gift, Copy, Check, ExternalLink, Users, DollarSign, MousePointerClick, Loader2, Edit3, Twitter, Linkedin, MessageCircle, Wallet, History } from 'lucide-react'
import { getUser, authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function AffiliatePage() {
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [clicks, setClicks] = useState<any[]>([])
  const [convs, setConvs] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
    load()
  }, [])

  function load() {
    Promise.all([
      authFetch('/api/affiliate').then(setData).catch(() => {}),
      authFetch('/api/affiliate/clicks').then(d => setClicks(d.clicks || [])).catch(() => {}),
      authFetch('/api/affiliate/conversions').then(d => setConvs(d.conversions || [])).catch(() => {}),
      authFetch('/api/affiliate/payouts').then(d => setPayouts(d.payouts || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  async function changeCode() {
    if (!newCode || newCode.length < 4) return
    const d = await authFetch('/api/affiliate/code', { method: 'PUT', body: JSON.stringify({ code: newCode }) })
    if (d.success) { setData({ ...data, code: newCode }); setEditing(false) }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    if (!paypalEmail.includes('@')) return
    setWithdrawing(true); setMsg('')
    const d = await authFetch('/api/affiliate/withdraw', { method: 'POST', body: JSON.stringify({ paypal_email: paypalEmail }) })
    if (d.error) { setMsg(d.error) } else { setMsg(`Withdrawal of $${d.amount.toFixed(2)} requested!`); setShowWithdraw(false); load() }
    setWithdrawing(false)
  }

  function copy() { navigator.clipboard.writeText(data?.link || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const shareUrl = data?.link || ''
  const shareText = 'Validate your emails for free!'
  const canWithdraw = (data?.balance || 0) >= 50

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
  if (!data) return null

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Affiliate Program</h1>
          <p className="text-sm text-gray-500">Earn 20% recurring commission on every referral.</p>
        </div>
        <button onClick={() => setShowWithdraw(true)} disabled={!canWithdraw}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
          <Wallet size={16} /> Withdraw (${(data.balance || 0).toFixed(2)})
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">{msg}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Balance', value: `$${(data.balance || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Earned', value: `$${(data.earnings || 0).toFixed(2)}`, icon: TrendingUp2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Clicks', value: data.clicks || 0, icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Conversions', value: data.conversions || 0, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'To withdraw', value: canWithdraw ? 'Ready' : `$${(50 - (data.balance || 0)).toFixed(2)} left`, icon: Wallet, color: canWithdraw ? 'text-green-600' : 'text-gray-500', bg: canWithdraw ? 'bg-green-50' : 'bg-gray-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}><card.icon size={16} className={card.color} /></div>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Referral Link</h3>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-3">
          <code className="flex-1 text-sm font-mono text-gray-700 truncate">{data.link}</code>
          <button onClick={copy} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="text-gray-500">Your code:</span>
          {editing ? (
            <div className="flex items-center gap-2">
              <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" maxLength={12} />
              <button onClick={changeCode} className="text-sm font-medium text-blue-600 hover:text-blue-700">Save</button>
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500">Cancel</button>
            </div>
          ) : (
            <>
              <span className="font-mono font-medium text-gray-900">{data.code}</span>
              <button onClick={() => { setNewCode(data.code); setEditing(true) }} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit3 size={12} /></button>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ icon: Twitter, label: 'Twitter', color: 'bg-blue-500', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
            { icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-700', href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
            { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500', href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
            { icon: ExternalLink, label: 'Email', color: 'bg-gray-600', href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}` },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener" className={`flex items-center gap-2 px-3 py-2 ${s.color} text-white text-xs font-medium rounded-xl hover:opacity-90 transition-opacity`}>
              <s.icon size={14} /> {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><History size={16} className="text-gray-400" /> Payout History</h3>
          {payouts.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No withdrawals yet</p> : (
            <div className="space-y-2">
              {payouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-50 text-green-700' : p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>
                    <span className="text-gray-600">${(p.amount || 0).toFixed(2)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">How it works</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Share your referral link anywhere</li>
            <li>Someone registers (cookie 60 days)</li>
            <li>They subscribe to a paid plan → you earn 20%</li>
            <li>Withdraw when balance reaches <strong>$50</strong></li>
            <li>Paid via PayPal within 7 days</li>
          </ol>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Conversions</h3>
        {convs.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No conversions yet</p> : (
          <div className="space-y-2">
            {convs.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{c.status}</span>
                  <span className="text-gray-600">{c.referred_email}</span>
                </div>
                <span className="font-medium text-gray-900">${(c.commission || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="bg-amber-50 rounded-xl p-4 text-sm">
            <p className="font-medium text-amber-800">Available balance: <strong>${(data.balance || 0).toFixed(2)}</strong></p>
            <p className="text-amber-600 text-xs mt-1">Minimum withdrawal: $50. Paid via PayPal within 7 days.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
            <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="your@paypal.com" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <p className="text-xs text-gray-400">You'll receive ${(data.balance || 0).toFixed(2)} minus any PayPal fees.</p>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={withdrawing || !paypalEmail.includes('@')}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
              {withdrawing ? 'Processing...' : `Withdraw $${(data.balance || 0).toFixed(2)}`}
            </button>
            <button type="button" onClick={() => setShowWithdraw(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function TrendingUp2(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 7l-9 9-4-4-6 6"/><path d="M16 7h6v6"/></svg> }
