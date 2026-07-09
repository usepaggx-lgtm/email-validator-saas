'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, Download, Search, ChevronLeft, ChevronRight, Trash2, Loader2, List, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { apiGetLists, apiCreateList, apiDeleteList, apiGetList, apiAddContacts, apiExportList } from '@/lib/lists'
import Modal from '@/components/ui/Modal'

export default function ListsPage() {
  const [view, setView] = useState<'lists' | 'detail'>('lists')
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [listId, setListId] = useState<string | null>(null)
  const [list, setList] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [summary, setSummary] = useState<any>(null)
  const limit = 50

  useEffect(() => { loadLists() }, [])

  async function loadLists() {
    try { const d = await apiGetLists(); setLists(d.lists || []) }
    catch {} finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try { const d = await apiCreateList(newName.trim()); setLists(prev => [d, ...prev]); setNewName(''); setShowCreate(false) }
    catch {} finally { setCreating(false) }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    try { await apiDeleteList(id); setLists(prev => prev.filter(l => l.id !== id)) }
    catch {}
  }

  async function openList(id: string) {
    setListId(id)
    setView('detail')
    setPage(1)
    setSearch('')
    setStatusFilter('')
    setShowUpload(false)
    setSummary(null)
    loadDetail(1, id, '', '')
  }

  async function loadDetail(p: number, id?: string, s?: string, st?: string) {
    const lid = id || listId
    const searchParam = s !== undefined ? s : search
    const statusParam = st !== undefined ? st : statusFilter
    setDetailLoading(true)
    const pStr = `?page=${p}&status=${statusParam}&search=${searchParam}`
    try {
      const d = await apiGetList(lid!, pStr)
      setList(d.list); setContacts(d.contacts || []); setTotal(d.total || 0); setPage(d.page || 1)
    } catch {}
    finally { setDetailLoading(false) }
  }

  async function handleSearch() { loadDetail(1) }
  function handleStatusFilter(val: string) { setStatusFilter(val); loadDetail(1, listId!, search, val) }

  async function handleUpload() {
    const lines = csvText.split('\n').filter(Boolean)
    const contacts = lines.map(line => {
      const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return { email: parts[0] || '', name: parts[1] || '', company: parts[2] || '' }
    }).filter(c => c.email)
    if (contacts.length === 0) return
    setUploading(true)
    try { const d = await apiAddContacts(listId!, contacts); setSummary(d.summary); loadDetail(1) }
    catch {} finally { setUploading(false); setCsvText('') }
  }

  function back() { setView('lists'); setListId(null); setList(null); setContacts([]) }

  const pages = Math.ceil(total / limit)
  const statusColor = (s: string) => s === 'VALID' ? 'bg-green-50 text-green-700' : s === 'DISPOSABLE' ? 'bg-yellow-50 text-yellow-700' : s === 'PROBABLY_VALID' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
  const statusIcon = (s: string) => s === 'VALID' ? <CheckCircle size={14} className="text-green-500" /> : s === 'DISPOSABLE' ? <AlertTriangle size={14} className="text-yellow-500" /> : <XCircle size={14} className="text-red-500" />

  if (view === 'detail' && listId) {
    return (
      <>
        <button onClick={back} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} /> Back to Lists</button>
        {list && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{list.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{total} contacts · {list.valid_count || 0} valid · {list.disposable_count || 0} disposable · {list.invalid_count || 0} invalid</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"><Upload size={16} /> Upload CSV</button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"><Download size={16} /> Export</button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-1 hidden group-hover:block z-10 min-w-[160px]">
                  <button onClick={() => apiExportList(listId, '')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">All contacts</button>
                  <button onClick={() => apiExportList(listId, 'VALID')} className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg">Only valid</button>
                  <button onClick={() => apiExportList(listId, 'INVALID_FORMAT')} className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg">Only invalid</button>
                  <button onClick={() => apiExportList(listId, 'DISPOSABLE')} className="w-full text-left px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg">Only disposable</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {summary && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm">
            <p className="font-semibold text-green-800 mb-1">Validation Complete</p>
            <p className="text-green-700">{summary.total} contacts · {summary.valid} valid · {summary.invalid} invalid · {summary.disposable} disposable</p>
            <button onClick={() => setSummary(null)} className="text-xs text-green-600 hover:text-green-700 mt-1">Dismiss</button>
          </div>
        )}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Upload Contacts</h3>
            <p className="text-xs text-gray-500 mb-4">Format: <code className="bg-gray-100 px-1 rounded">email, name, company</code> — one per line</p>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={4} placeholder="email1@example.com, John Doe, Acme Inc"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs" />
            <div className="flex gap-3 mt-4">
              <button onClick={handleUpload} disabled={uploading || !csvText.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
                {uploading && <Loader2 size={14} className="animate-spin" />}Validate & Add
              </button>
              <button onClick={() => setShowUpload(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">Cancel</button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="relative group">
              <select value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[170px] transition-all">
                <option value="">All Status</option>
                <option value="VALID">✓ Valid</option>
                <option value="PROBABLY_VALID">~ Probably Valid</option>
                <option value="DISPOSABLE">⚠ Disposable</option>
                <option value="INVALID_FORMAT">✗ Invalid Format</option>
                <option value="INVALID_DOMAIN">✗ Invalid Domain</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          {detailLoading ? (
            <div className="p-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-blue-600" /></div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center text-gray-400"><p className="text-sm">{total === 0 ? 'No contacts yet. Upload a CSV to get started.' : 'No results.'}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Email</th><th className="px-4 py-3 font-medium text-gray-500">Name</th><th className="px-4 py-3 font-medium text-gray-500">Company</th><th className="px-4 py-3 font-medium text-gray-500">Status</th><th className="px-4 py-3 font-medium text-gray-500">Score</th></tr></thead>
                <tbody>{contacts.map((c: any, i: number) => (
                  <tr key={c.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{statusIcon(c.status)}<span className="font-mono text-xs text-gray-700 truncate max-w-[200px]">{c.email}</span></div></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.company || '-'}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>{c.status}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.score}%` }} /></div><span className="text-xs text-gray-500 font-medium">{c.score}</span></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{total} results</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => loadDetail(page - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 3, pages - 5))
                  const p = start + i + 1
                  return <button key={p} onClick={() => loadDetail(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
                })}
                <button disabled={page >= pages} onClick={() => loadDetail(page + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Email Lists</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage validation lists. Keep your contacts organized.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"><Plus size={16} /> New List</button>
      </div>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New List">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">List name</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Newsletter Subscribers"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={creating || !newName.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Create List'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">Cancel</button>
          </div>
        </div>
      </Modal>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <List size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-900 mb-1">No lists yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first list to start organizing your validations.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">Create your first list</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list: any) => (
            <div key={list.id} onClick={() => openList(list.id)} className="bg-white rounded-2xl border border-gray-200 p-5 card-hover cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0"><List size={18} className="text-white" /></div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{list.total_count || 0} contacts · Updated {list.updated_at ? new Date(list.updated_at).toLocaleDateString() : 'never'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {list.valid_count || 0}</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-yellow-500" /> {list.disposable_count || 0}</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-red-500" /> {list.invalid_count || 0}</span>
                  </div>
                  <button onClick={(e) => handleDelete(e, list.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
