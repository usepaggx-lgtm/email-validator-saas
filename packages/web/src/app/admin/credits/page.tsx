'use client'

import { useState, useEffect } from 'react'
import { Coins, Search, Plus, Loader2, User, Check } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function toCents(value: string): number {
  const normalized = value.replace(',', '.').replace(/[^0-9.\-]/g, '')
  const floatVal = parseFloat(normalized)
  if (isNaN(floatVal)) return NaN
  return Math.round(floatVal * 100)
}

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
    const parsed = toCents(amount)
    if (isNaN(parsed) || parsed === 0) { setError('O valor deve ser diferente de zero'); return }
    if (!description.trim()) { setError('Descrição é obrigatória'); return }
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
      setError('Erro ao enviar ajuste')
    }
    setSubmitting(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
            Gestão de Saldo
          </h1>
          <p className="text-sm text-gray-500">Ajuste manual de saldo dos usuários.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load() }}
            placeholder="Buscar por nome ou e-mail..."
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
                  <th className="px-4 py-3 font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 font-medium text-gray-500">E-mail</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Saldo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum usuário encontrado</td></tr>
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
                          <Coins size={12} /> {formatBRL(u.balance ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openAdjust(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                          <Plus size={12} /> Ajustar
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Ajustar Saldo — ${selectedUser?.name || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
          )}
          {selectedUser && (
            <div className="text-sm text-gray-500">
              Saldo atual: <span className="font-semibold text-purple-700">{formatBRL(selectedUser.balance ?? 0)}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Valor em R$ <span className="text-gray-400 font-normal">(positivo para adicionar, negativo para deduzir)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="ex: 50,00 ou -25,00"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
              <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Motivo do ajuste"
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
              {submitting ? 'Enviando...' : 'Aplicar Ajuste'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
