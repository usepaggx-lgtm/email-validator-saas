'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Loader2, X, Check } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const CATEGORIES = ['subscription', 'hosting', 'marketing', 'salary', 'tools', 'domain', 'other']
const RECURRING = ['one-time', 'monthly', 'yearly']

export default function AdminFinancesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', type: 'expense', category: 'other', amount: '', date: new Date().toISOString().slice(0, 10), recurring: 'one-time', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function load() {
    setLoading(true)
    Promise.all([
      authFetch('/api/admin/finances').then(d => setTransactions(d.transactions || [])).catch(() => {}),
      authFetch('/api/admin/finances/summary').then(setSummary).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true); setMsg('')
    try {
      const d = await authFetch('/api/admin/finances', {
        method: 'POST',
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (d.error) { setMsg(d.error); return }
      setShowModal(false)
      setForm({ description: '', type: 'expense', category: 'other', amount: '', date: new Date().toISOString().slice(0, 10), recurring: 'one-time', notes: '' })
      load()
    } catch { setMsg('Failed') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    await authFetch(`/api/admin/finances/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  const revenue = summary?.total_revenue || 0
  const expenses = summary?.total_expenses || 0
  const profit = summary?.net_profit || 0

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Finances</h1>
          <p className="text-sm text-gray-500">Track revenue, expenses, and profitability.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
          <Plus size={16} /> New Transaction
        </button>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{msg}</div>}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue', value: `$${revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Expenses', value: `$${expenses.toFixed(2)}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Net Profit', value: `$${profit.toFixed(2)}`, icon: DollarSign, color: profit >= 0 ? 'text-green-600' : 'text-red-600', bg: profit >= 0 ? 'bg-green-50' : 'bg-red-50' },
          { label: 'Margin', value: `${summary?.profit_margin || 0}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
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

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
              <span className="text-xs text-gray-400">{transactions.length} this month</span>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No transactions yet. Click "New Transaction" to add one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Description</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500"></th>
                  </tr></thead>
                  <tbody>{transactions.map((t: any) => (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-700">{t.description}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type === 'revenue' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{t.type}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{t.category}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'revenue' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{t.date}</td>
                      <td className="px-4 py-3"><button onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Expenses by Category</h3>
            {summary?.expenses_by_category?.length > 0 ? (
              <div className="space-y-3">
                {summary.expenses_by_category.map((c: any) => {
                  const max = Math.max(...summary.expenses_by_category.map((x: any) => x.total), 1)
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 capitalize">{c.category}</span>
                        <span className="font-medium text-gray-900">${parseFloat(c.total).toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: `${c.total / max * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-sm text-gray-400 py-4 text-center">No expenses</p>}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Transaction">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Servidor Render Julho" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="expense">Expense</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
            <select value={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              {RECURRING.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !form.description || !form.amount} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Transaction'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
