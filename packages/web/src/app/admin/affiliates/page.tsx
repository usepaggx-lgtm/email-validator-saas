'use client'

import { useState, useEffect } from 'react'
import { Gift, DollarSign, Loader2, Check, X, Search, ExternalLink } from 'lucide-react'
import { authFetch } from '@/lib/utils'

export default function AdminAffiliatesPage() {
  const [tab, setTab] = useState<'affiliates' | 'payouts'>('affiliates')
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    Promise.all([
      authFetch('/api/admin/affiliates').then(d => setAffiliates(d.affiliates || [])).catch(() => {}),
      authFetch('/api/admin/affiliates/payouts').then(d => setPayouts(d.payouts || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  async function processPayout(id: number, status: string) {
    const notes = status === 'rejected' ? prompt('Reason for rejection:') || 'Rejected' : 'Processed'
    await authFetch(`/api/admin/affiliates/payouts/${id}/process`, { method: 'POST', body: JSON.stringify({ status, notes }) })
    load()
  }

  const filtered = affiliates.filter((a: any) =>
    a.email?.toLowerCase().includes(search.toLowerCase()) || a.affiliate_code?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingPayouts = payouts.filter((p: any) => p.status === 'pending')

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Affiliates</h1>
          <p className="text-sm text-gray-500">{affiliates.length} affiliates · {pendingPayouts.length} pending payouts</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setTab('affiliates')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'affiliates' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Affiliates</button>
          <button onClick={() => setTab('payouts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'payouts' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            Payouts {pendingPayouts.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">{pendingPayouts.length}</span>}
          </button>
        </div>
      </div>

      {tab === 'affiliates' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">User</th>
                <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 font-medium text-gray-500">Earnings</th>
                <th className="px-4 py-3 font-medium text-gray-500">Balance</th>
              </tr></thead>
              <tbody>{filtered.map((a: any) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="text-xs font-medium text-gray-900">{a.name}</div><div className="text-[10px] text-gray-500">{a.email}</div></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{a.affiliate_code}</td>
                  <td className="px-4 py-3 text-xs font-medium text-green-600">${(a.affiliate_earnings || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-amber-600">${(a.affiliate_balance || 0).toFixed(2)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">User</th>
                <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-500">PayPal</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr></thead>
              <tbody>{payouts.map((p: any) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="text-xs text-gray-900">{p.name}</div><div className="text-[10px] text-gray-500">{p.email}</div></td>
                  <td className="px-4 py-3 font-medium">${(p.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.paypal_email || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-50 text-green-700' : p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => processPayout(p.id, 'paid')} className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-600" title="Mark as paid"><Check size={14} /></button>
                        <button onClick={() => processPayout(p.id, 'rejected')} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Reject"><X size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
