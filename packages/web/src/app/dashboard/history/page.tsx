'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, XCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { apiGetHistory } from '@/lib/utils'

export default function HistoryContent() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState({ history: [], total: 0, page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const perPage = 20

  useEffect(() => { loadPage(1) }, [])

  async function loadPage(p: number) {
    setLoading(true)
    const d = await apiGetHistory(p)
    setData(d)
    setPage(p)
    setLoading(false)
  }

  const filtered = (data.history || []).filter((r: any) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search && !r.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pages = Math.ceil(data.total / perPage)

  const statusIcon = (s: string) => s === 'VALID' ? <CheckCircle size={14} className="text-green-500" /> : s === 'DISPOSABLE' ? <AlertTriangle size={14} className="text-yellow-500" /> : <XCircle size={14} className="text-red-500" />
  const statusColor = (s: string) => s === 'VALID' ? 'bg-green-50 text-green-700' : s === 'DISPOSABLE' ? 'bg-yellow-50 text-yellow-700' : s === 'PROBABLY_VALID' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Validation History</h1>
      <p className="text-sm text-gray-500 mb-6">{data.total} total validations</p>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="relative group">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[170px] transition-all">
              <option value="all">All Status</option>
              <option value="VALID">✓ Valid</option>
              <option value="INVALID_FORMAT">✗ Invalid Format</option>
              <option value="INVALID_DOMAIN">✗ Invalid Domain</option>
              <option value="DISPOSABLE">⚠ Disposable</option>
              <option value="PROBABLY_VALID">~ Probably Valid</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><p className="text-sm">{data.total === 0 ? 'No validation history yet.' : 'No results match your search.'}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Email</th><th className="px-4 py-3 font-medium text-gray-500">Status</th><th className="px-4 py-3 font-medium text-gray-500">Time</th><th className="px-4 py-3 font-medium text-gray-500">Source</th></tr></thead>
              <tbody>{filtered.map((r: any, i: number) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2">{statusIcon(r.status)}<span className="font-mono text-xs text-gray-700">{r.email}</span></div></td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.source || 'Dashboard'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{data.total} results</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => loadPage(page - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 3, pages - 5))
                const p = start + i + 1
                return <button key={p} onClick={() => loadPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
              })}
              <button disabled={page >= pages} onClick={() => loadPage(page + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
