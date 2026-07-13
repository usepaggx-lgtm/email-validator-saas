'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, Loader2, CreditCard, Clock, ArrowUpRight, History } from 'lucide-react'
import { authFetch } from '@/lib/utils'

const PACKAGES = [
  { label: 'R$ 50', description: 'Adicione saldo à sua carteira', amount: 5000, popular: false },
  { label: 'R$ 100', description: 'Adicione saldo à sua carteira', amount: 10000, popular: true },
  { label: 'R$ 300', description: 'Adicione saldo à sua carteira', amount: 30000, popular: false },
  { label: 'R$ 500', description: 'Adicione saldo à sua carteira', amount: 50000, popular: false },
]

const TYPE_LABEL: Record<string, string> = {
  purchase: 'Compra',
  deduction: 'Consulta',
  refund: 'Estorno',
  admin_adjust: 'Ajuste',
}

const TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-green-50 text-green-700',
  deduction: 'bg-red-50 text-red-700',
  refund: 'bg-blue-50 text-blue-700',
  admin_adjust: 'bg-yellow-50 text-yellow-700',
}

export default function CreditsPage() {
  const [balanceCents, setBalanceCents] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingTx, setLoadingTx] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)
  const limit = 20

  useEffect(() => {
    authFetch('/api/credits/balance').then(d => {
      setBalanceCents(d.balance_cents ?? 0)
    }).catch(() => {}).finally(() => setLoadingBalance(false))
  }, [])

  useEffect(() => {
    setLoadingTx(true)
    authFetch(`/api/credits/transactions?page=${page}`).then(d => {
      setTransactions(d.transactions ?? [])
      setTotal(d.total ?? 0)
    }).catch(() => {}).finally(() => setLoadingTx(false))
  }, [page])

  async function handlePurchase(amount: number) {
    setPurchasing(amount)
    try {
      const d = await authFetch('/api/credits/purchase', { method: 'POST', body: JSON.stringify({ amount }) })
      if (d.url) {
        window.location.href = d.url
      }
    } catch {}
    finally { setPurchasing(null) }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const balanceBrl = (balanceCents / 100).toFixed(2)

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center">
          <Wallet size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Carteira</h1>
          <p className="text-sm text-gray-500">Gerencie seu saldo e acompanhe suas transações</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-purple-200">Saldo disponível</p>
            <h2 className="text-3xl font-bold">R$ {balanceBrl}</h2>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3 text-center">
            <Wallet size={24} className="mx-auto mb-1 text-purple-200" />
            <div className="text-xs text-purple-200">carteira</div>
          </div>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min((balanceCents / 5000000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-purple-200 mt-2">
          Saldo de R$ {balanceBrl} em conta
        </p>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Plus size={16} className="text-gray-400" /> Adicionar saldo
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PACKAGES.map((pkg) => {
          const loading = purchasing === pkg.amount
          return (
            <button
              key={pkg.amount}
              onClick={() => handlePurchase(pkg.amount)}
              disabled={purchasing !== null}
              className={`relative bg-white rounded-2xl border-2 p-5 text-left transition-all hover:shadow-lg hover:border-purple-300 disabled:opacity-60 ${
                pkg.popular ? 'border-purple-500 shadow-md shadow-purple-500/10' : 'border-gray-100'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold text-white bg-purple-600 px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-xl font-bold text-gray-900 mb-1">{pkg.label}</div>
              <div className="text-sm text-gray-500 mb-4">{pkg.description}</div>
              <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-500 text-white">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {loading ? 'Processando...' : 'Comprar'}
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <History size={16} className="text-gray-400" /> Histórico de transações
          </h3>
          <span className="text-xs text-gray-400">{total} registro{total !== 1 ? 's' : ''}</span>
        </div>

        {loadingTx ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-purple-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            <History size={32} className="mx-auto mb-2 text-gray-300" />
            Nenhuma transação encontrada
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs">Data</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs">Tipo</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs">Valor</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, i: number) => {
                    const amountCents = tx.amount ?? 0
                    const isPositive = amountCents > 0
                    return (
                      <tr key={tx.id ?? i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-300" />
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type] || 'bg-gray-50 text-gray-700'}`}>
                            {TYPE_LABEL[tx.type] || tx.type}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex items-center gap-1">
                            {isPositive ? <ArrowUpRight size={12} /> : <span className="rotate-180 inline-block"><ArrowUpRight size={12} /></span>}
                            R$ {Math.abs(amountCents / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">{tx.description || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        p === page
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
