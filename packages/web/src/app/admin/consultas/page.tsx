'use client'

import { useState, useEffect } from 'react'
import { Database, Search, Edit3, Save, Loader2, Check, X, Filter } from 'lucide-react'
import { authFetch } from '@/lib/utils'

const GROUPS = [
  { value: '', label: 'Todos os Grupos' },
  { value: 'pessoas', label: 'Pessoas' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'enderecos', label: 'Endereços' },
  { value: 'processos', label: 'Processos' },
  { value: 'veiculos', label: 'Veículos' },
  { value: 'ondemand', label: 'On Demand' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'modelagem', label: 'Modelagem' },
]

export default function AdminConsultasPage() {
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null)

  function load() {
    setLoading(true)
    const params = group ? `?group=${group}` : ''
    authFetch(`/api/admin/bigdatacorp/pricing${params}`)
      .then(d => setDatasets(d.datasets || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [group])

  function startEdit(d: any) {
    setEditingId(d.id)
    setEditValue(((d.cost_cents ?? 0) / 100).toFixed(2))
    setFeedback(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
    setFeedback(null)
  }

  async function handleSave(id: string) {
    setSavingId(id)
    setFeedback(null)
    const costCents = Math.round(parseFloat(editValue || '0') * 100)
    try {
      const res = await authFetch(`/api/admin/bigdatacorp/pricing/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ cost_cents: costCents }),
      })
      if (res.error) {
        setFeedback({ id, ok: false })
      } else {
        setFeedback({ id, ok: true })
        setDatasets(prev =>
          prev.map(d => (d.id === id ? { ...d, cost_cents: costCents } : d))
        )
        setEditingId(null)
      }
    } catch {
      setFeedback({ id, ok: false })
    }
    setSavingId(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
            Consultas - Pricing
          </h1>
          <p className="text-sm text-gray-500">Gerencie os preços dos datasets BigDataCorp.</p>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={group}
            onChange={e => { setGroup(e.target.value); setEditingId(null); setFeedback(null) }}
            className="w-48 pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none bg-white"
          >
            {GROUPS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
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
                  <th className="px-4 py-3 font-medium text-gray-500">Consulta</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Grupo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Preço Base (R$)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Custo (R$)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ativo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {datasets.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Nenhuma consulta encontrada</td></tr>
                ) : (
                  datasets.map((d: any) => (
                    <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-700">{d.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {d.group}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">R$ {(d.base_price ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {editingId === d.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-24 px-2 py-1.5 border border-purple-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            autoFocus
                          />
                        ) : (
                          <span className="text-xs text-gray-700">R$ {((d.cost_cents ?? 0) / 100).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            <Check size={10} /> Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            <X size={10} /> Não
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {feedback && feedback.id === d.id ? (
                          feedback.ok ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check size={14} /> Salvo</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500"><X size={14} /> Erro</span>
                          )
                        ) : editingId === d.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(d.id)}
                              disabled={savingId === d.id}
                              className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                            >
                              {savingId === d.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(d)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
