'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Loader2, Edit3, Trash2, RefreshCw, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSlug, setEditSlug] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', price_monthly: '', daily_limit: '100', monthly_limit: '3000', features: '', active: true, sort_order: '0' })

  function load() {
    setLoading(true)
    authFetch('/api/admin/plans').then(d => setPlans(d.plans || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditSlug(''); setForm({ name: '', slug: '', description: '', price_monthly: '', daily_limit: '100', monthly_limit: '3000', features: '', active: true, sort_order: '0' }); setShowModal(true) }

  function openEdit(p: any) {
    setEditSlug(p.slug); setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      price_monthly: String(p.price_monthly || '0'), daily_limit: String(p.daily_limit || '100'),
      monthly_limit: String(p.monthly_limit || '3000'), features: p.features || '',
      active: !!p.active, sort_order: String(p.sort_order || '0'),
    }); setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const body = { ...form, price_monthly: parseFloat(form.price_monthly), daily_limit: parseInt(form.daily_limit), monthly_limit: parseInt(form.monthly_limit), sort_order: parseInt(form.sort_order) }
    if (editSlug) {
      await authFetch(`/api/admin/plans/${editSlug}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await authFetch('/api/admin/plans', { method: 'POST', body: JSON.stringify(body) })
    }
    setShowModal(false); load()
  }

  async function handleDelete(slug: string) {
    if (!confirm('Delete this plan?')) return
    await authFetch(`/api/admin/plans/${slug}`, { method: 'DELETE' })
    load()
  }

  async function handleToggle(p: any) {
    await authFetch(`/api/admin/plans/${p.slug}`, { method: 'PUT', body: JSON.stringify({ active: !p.active }) })
    load()
  }

  async function syncStripe() {
    setSyncing(true)
    await authFetch('/api/admin/plans/sync-stripe', { method: 'POST' })
    setSyncing(false); load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500">Manage subscription plans and sync to Stripe.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncStripe} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all text-sm disabled:opacity-50">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> Sync to Stripe
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
            <Plus size={16} /> Add Plan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="px-4 py-3 font-medium text-gray-500">Daily</th>
              <th className="px-4 py-3 font-medium text-gray-500">Monthly</th>
              <th className="px-4 py-3 font-medium text-gray-500">Stripe</th>
              <th className="px-4 py-3 font-medium text-gray-500">Active</th>
              <th className="px-4 py-3 font-medium text-gray-500"></th>
            </tr></thead>
            <tbody>{plans.map((p: any) => (
              <tr key={p.slug} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><span className="font-medium text-gray-900">{p.name}</span><br /><span className="text-[10px] text-gray-400">{p.slug}</span></td>
                <td className="px-4 py-3 font-medium">${p.price_monthly}</td>
                <td className="px-4 py-3">{p.daily_limit?.toLocaleString()}</td>
                <td className="px-4 py-3">{p.monthly_limit?.toLocaleString()}</td>
                <td className="px-4 py-3">{p.stripe_price_id ? <span className="text-[10px] font-mono text-green-600">✅ {p.stripe_price_id.slice(0, 12)}...</span> : <span className="text-[10px] text-gray-400">—</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(p)} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {p.active ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(p.slug)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSlug ? 'Edit Plan' : 'New Plan'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" required disabled={!!editSlug} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label><input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Daily limit</label><input type="number" value={form.daily_limit} onChange={e => setForm({ ...form, daily_limit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly limit</label><input type="number" value={form.monthly_limit} onChange={e => setForm({ ...form, monthly_limit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label><textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono text-xs" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">{editSlug ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
