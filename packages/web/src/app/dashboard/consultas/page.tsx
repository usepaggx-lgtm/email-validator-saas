'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Search, Loader2, DollarSign, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, Building, MapPin, Car, Briefcase, ShoppingCart, Box, Layers, CreditCard } from 'lucide-react'
import { getUser, authFetch } from '@/lib/utils'

const GROUP_ICONS: Record<string, any> = {
  pessoas: Building,
  empresas: Briefcase,
  veiculos: Car,
  imoveis: MapPin,
  produtos: ShoppingCart,
  beneficios: Box,
  processos: FileText,
}

export default function ConsultasPage() {
  const router = useRouter()
  const [balanceCents, setBalanceCents] = useState<number | null>(null)
  const [groups, setGroups] = useState<Record<string, any>>({})
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDataset, setSelectedDataset] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (!getUser()) { router.push('/login'); return }
    Promise.all([
      authFetch('/api/credits/balance').then(d => setBalanceCents(d.balance_cents ?? 0)).catch(() => {}),
      authFetch('/api/bigdatacorp/pricing').then(d => {
        if (d.groups) {
          setGroups(d.groups)
          const keys = Object.keys(d.groups)
          if (keys.length > 0) {
            setSelectedGroup(keys[0])
          }
        }
      }).catch(() => {}),
      fetchHistory(1),
    ]).finally(() => setPageLoading(false))
  }, [])

  useEffect(() => {
    if (selectedGroup && groups[selectedGroup]?.results?.length > 0) {
      setSelectedDataset(groups[selectedGroup].results[0].dataset_key || '')
    }
  }, [selectedGroup, groups])

  async function fetchHistory(page: number) {
    setHistoryLoading(true)
    try {
      const d = await authFetch(`/api/consultas/history?page=${page}`)
      if (d.history) setHistory(d.history)
    } catch {}
    setHistoryLoading(false)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !selectedGroup || !selectedDataset || loading) return
    setLoading(true)
    setResult(null)
    setError('')
    const startTime = Date.now()
    try {
      const d = await authFetch(`/api/bigdatacorp/${selectedGroup}/${selectedDataset}`, {
        method: 'POST',
        body: JSON.stringify({ q: query.trim() }),
      })
      if (d.error) { setError(d.error); return }
      setResult({ ...d, _elapsed: Date.now() - startTime })
      if (d._meta?.balance_cents !== undefined) setBalanceCents(d._meta.balance_cents)
      fetchHistory(1)
    } catch {
      setError('Falha na conexão')
    }
    setLoading(false)
  }

  function getDatasetsForGroup(groupKey: string): any[] {
    return groups[groupKey]?.results || []
  }

  function getDatasetLabel(datasetKey: string): string {
    if (!datasetKey) return ''
    return datasetKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toFixed(2)}`
  }

  if (pageLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>

  const datasets = getDatasetsForGroup(selectedGroup)

  return (
    <>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Consultas</h1>
            <p className="text-sm text-purple-100">BigDataCorp Data Platform</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Saldo Disponível</p>
              <p className="text-2xl font-bold text-gray-900">
                {balanceCents !== null ? formatBRL(balanceCents) : '—'}
              </p>
            </div>
          </div>
          <a href="/dashboard/credits" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
            <CreditCard size={15} />
            Adicionar Saldo
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-purple-500" /> Grupos de API
          </h2>
          {Object.keys(groups).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum grupo disponível</p>
          ) : (
            Object.entries(groups).map(([key, group]) => {
              const datasets = group.results || []
              const isExpanded = expandedGroup === key
              const Icon = GROUP_ICONS[key] || Database
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : key)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Icon size={16} className="text-purple-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 capitalize">{key}</p>
                        <p className="text-[11px] text-gray-400">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 py-2 space-y-1.5 bg-gray-50/50">
                      {datasets.map((ds: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5">
                          <span className="text-gray-700">{ds.dataset_name || getDatasetLabel(ds.dataset_key)}</span>
                          <span className="font-medium text-purple-600">{formatBRL(ds.cost_cents ?? ds.cost ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search size={16} className="text-purple-500" /> Nova Consulta
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Consulta (CPF, CNPJ, nome, etc.)</label>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Digite sua consulta..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Grupo</label>
                  <div className="relative">
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer">
                      {Object.keys(groups).map(key => (
                        <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Base de Dados</label>
                  <div className="relative">
                    <select value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer">
                      {datasets.map((ds: any, i: number) => (
                        <option key={i} value={ds.dataset_key}>{ds.dataset_name || getDatasetLabel(ds.dataset_key)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || !query.trim() || !selectedGroup || !selectedDataset}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Consultando...' : 'Consultar'}
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-start gap-3">
              <XCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-purple-500" /> Resultado
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  {result._meta && (
                    <>
                      <span className="flex items-center gap-1 text-purple-600 font-medium">
                        <DollarSign size={12} /> {formatBRL(result._meta.cost_cents ?? 0)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={12} /> {result._elapsed ?? result._meta?.elapsed_ms ?? 0}ms
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle size={12} /> Sucesso
                  </span>
                </div>
              </div>
              <div className="p-5 overflow-auto max-h-[500px]">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-purple-500" /> Consultas Recentes
          </h2>
          {history.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={() => { const p = Math.max(1, historyPage - 1); setHistoryPage(p); fetchHistory(p) }}
                disabled={historyPage <= 1}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                Anterior
              </button>
              <span className="text-xs text-gray-400 px-2">{historyPage}</span>
              <button onClick={() => { const p = historyPage + 1; setHistoryPage(p); fetchHistory(p) }}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                Próximo
              </button>
            </div>
          )}
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-purple-500" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma consulta ainda. Faça sua primeira consulta acima.</p>
        ) : (
          <div className="space-y-2">
            {history.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Database size={14} className="text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.query || item.q}</p>
                    <p className="text-xs text-gray-400">
                      {item.dataset_name || item.dataset_key || item.dataset || ''}
                      {item.created_at && ` · ${new Date(item.created_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {item.cost_cents != null && (
                    <span className="text-xs font-medium text-purple-600">{formatBRL(item.cost_cents)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
