'use client'

import { useState, useEffect } from 'react'
import { Coins, Search, Plus, Minus, Loader2, User, Check } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    authFetch(`/api/admin/credits/users${params}`)
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openAdjust(u: any) {
    setSelectedUser(u)
    setAmount('')
    setDescription('')
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(amount)
    if (isNaN(parsed) || parsed === 0) { setError('Amount must be a non-zero integer'); return }
    if (!description.trim()) { setError('Description is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/credits/manual', {
        method: 'POST',
        body: JSON.stringify({ user_id: selectedUser.id, amount: parsed, description: description.trim() }),
      })
      if (res.error) {
        setError(res.error)
      } else {
        setShowModal(false)
        load()
      }
    } catch {
      setError('Failed to submit adjustment')
    }
    setSubmitting(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
            Credit Management
          </h1>
          <p className="text-sm text-gray-500">Manually adjust user credit balances.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load() }}
            placeholder="Search by name or email..."
            className="w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Balance</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">No users found</td></tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-xs text-gray-700">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                          <Coins size={12} /> {u.balance ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openAdjust(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                          <Plus size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Adjust Credits — ${selectedUser?.name || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-gray-400 font-normal">(positive to add, negative to deduct)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 100 or -50"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
              <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Reason for adjustment"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {submitting ? 'Submitting...' : 'Submit Adjustment'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
