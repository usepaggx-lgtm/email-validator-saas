'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Upload, Download, CheckCircle, XCircle, AlertTriangle, Loader2, List } from 'lucide-react'
import { apiValidateAuth, apiValidateBatch } from '@/lib/utils'
import { apiGetLists, apiAddContacts } from '@/lib/lists'

export default function ValidateContent() {
  const [tab, setTab] = useState<'single' | 'batch'>('single')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [csvResults, setCsvResults] = useState<any[]>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [lists, setLists] = useState<any[]>([])
  const [selectedList, setSelectedList] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    apiGetLists().then(d => {
      const all = d.lists || []
      setLists(all)
      const def = all.find((l: any) => l.name === 'Default List')
      if (def) setSelectedList(def.id)
      else if (all.length > 0) setSelectedList(all[0].id)
    }).catch(() => {})
  }, [])

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true); setResult(null); setSaveMsg('')
    const data = await apiValidateAuth(email.trim())
    setResult(data)
    if (data.status && selectedList) {
      setSaving(true)
      try {
        await apiAddContacts(selectedList, [{ email: email.trim() }])
        setSaveMsg('Saved to list ✓')
      } catch {}
      setSaving(false)
    }
    setLoading(false)
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).slice(0, 100)
      const contacts = lines.map(l => {
        const parts = l.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
        return { email: parts[0], name: parts[1] || '', company: parts[2] || '' }
      }).filter(c => c.email)

      setCsvLoading(true)
      const data = await apiValidateBatch(contacts.map(c => c.email))
      setCsvResults(data.results || [])

      if (selectedList) {
        try { await apiAddContacts(selectedList, contacts) }
        catch {}
      }
      setCsvLoading(false)
    }
    reader.readAsText(file)
  }

  function downloadCSV() {
    const headers = 'Email,Status,Score,Syntax,MX,Deliverable,Disposable,Role,Gibberish,Spamtrap,CatchAll,InboxFull,Disabled\n'
    const rows = csvResults.map((r, i) =>
      `"${r.email}","${r.status}",${r.score ?? 0},"${r.is_valid_syntax ?? ''}","${r.mx_accepts_mail ?? ''}","${r.is_deliverable ?? ''}","${r.is_disposable ?? ''}","${r.is_role_account ?? ''}","${r.is_gibberish ?? ''}","${r.is_spamtrap ?? ''}","${r.is_catch_all ?? ''}","${r.has_inbox_full ?? ''}","${r.is_disabled ?? ''}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'validation-results.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const StatBadge = ({ label, ok, icon }: { label: string; ok: boolean | undefined | null; icon?: string }) => (
    <span className={`px-3 py-2 rounded-lg text-xs font-medium ${ok === undefined || ok === null ? 'bg-gray-100 text-gray-500' : ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {icon || (ok ? '✓' : '✗')} {label}
    </span>
  )

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Email Validation</h1>
          <p className="text-sm text-gray-500">Validate single emails or bulk upload CSV files.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm min-w-[200px]">
          <List size={16} className="text-gray-400 shrink-0" />
          <select value={selectedList} onChange={e => setSelectedList(e.target.value)}
            className="bg-transparent text-gray-700 font-medium focus:outline-none flex-1 cursor-pointer">
            {lists.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button onClick={() => setTab('single')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Mail size={16} className="inline mr-1.5" />Single</button>
        <button onClick={() => setTab('batch')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'batch' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Upload size={16} className="inline mr-1.5" />Bulk CSV</button>
      </div>

      {tab === 'single' ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSingle} className="flex gap-2 mb-6">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
              className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <div className="relative group shrink-0">
              <select value={selectedList} onChange={e => setSelectedList(e.target.value)}
                className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl pl-3.5 pr-10 py-3.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[160px] transition-all">
                {lists.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <button type="submit" disabled={loading}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading && <Loader2 size={16} className="animate-spin" />}{loading ? '...' : 'Validate'}
            </button>
          </form>

          {(result || saving) && (
            <div className={`p-5 rounded-xl border ${result?.is_safe_to_send ? 'bg-green-50 border-green-200' : result?.status === 'DISPOSABLE' || result?.status === 'CATCH_ALL' || result?.status === 'INBOX_FULL' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              {result && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {result.is_safe_to_send ? <CheckCircle size={24} className="text-green-600" /> :
                     result.status === 'CATCH_ALL' || result.status === 'DISPOSABLE' ? <AlertTriangle size={24} className="text-yellow-600" /> :
                     <XCircle size={24} className="text-red-600" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{result.email}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.is_safe_to_send ? 'bg-green-100 text-green-700' : result.status === 'CATCH_ALL' ? 'bg-amber-100 text-amber-700' : result.status === 'DISPOSABLE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{result.status}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.score >= 70 ? 'bg-green-100 text-green-700' : result.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{result.score}/100</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {saveMsg && <span className="text-xs text-green-600">{saveMsg}</span>}
                        {saving && <Loader2 size={12} className="animate-spin text-blue-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    <StatBadge label="syntax" ok={result.is_valid_syntax} icon={result.is_valid_syntax ? '✓' : '✗'} />
                    <StatBadge label="mx" ok={result.mx_accepts_mail} icon={result.mx_accepts_mail ? '✓' : '✗'} />
                    <StatBadge label="deliverable" ok={result.is_deliverable} icon={result.is_deliverable === undefined ? '—' : result.is_deliverable ? '✓' : '✗'} />
                    <StatBadge label="disposable" ok={!result.is_disposable} icon={result.is_disposable ? '✓' : '✗'} />
                    <StatBadge label="role" ok={!result.is_role_account} icon={result.is_role_account ? '✓' : '✗'} />
                    <StatBadge label="smtp" ok={result.can_connect_smtp} icon={result.can_connect_smtp ? '✓' : '—'} />
                    <StatBadge label="catch all" ok={!result.is_catch_all} icon={result.is_catch_all ? '⚠' : '✗'} />
                    <StatBadge label="gibberish" ok={!result.is_gibberish} icon={result.is_gibberish ? '✓' : '✗'} />
                    <StatBadge label="spamtrap" ok={!result.is_spamtrap} icon={result.is_spamtrap ? '✓' : '✗'} />
                    <StatBadge label="inbox full" ok={!result.has_inbox_full} icon={result.has_inbox_full ? '⚠' : '✗'} />
                    <StatBadge label="disabled" ok={!result.is_disabled} icon={result.is_disabled ? '✓' : '✗'} />
                    {result.webmail_provider && <span className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">{result.webmail_provider}</span>}
                  </div>
                  {result.alias_of && <p className="mt-3 text-xs text-blue-600">Alias of: <span className="font-mono">{result.alias_of}</span></p>}
                  {result.suggestion && <p className="mt-1 text-xs text-amber-600">Did you mean: {result.email.split('@')[0]}@{result.suggestion}</p>}
                  {result.usage && <p className="mt-2 text-xs text-gray-400">Usage: {result.usage.used}/{result.usage.limit} today</p>}
                  {result.error && <p className="mt-2 text-xs text-red-500">{result.error}</p>}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center transition-all ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { fileRef.current!.files = e.dataTransfer.files; handleCSV({ target: { files: e.dataTransfer.files } } as any) } }}>
            <Upload size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-900 font-medium mb-1">Drop your CSV here, or <button type="button" onClick={() => fileRef.current?.click()} className="text-blue-600 hover:underline">browse</button></p>
            <p className="text-sm text-gray-400">Format: <code className="bg-gray-100 px-1 rounded">email, name, company</code> — one per line</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
          </div>
          {csvLoading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" /><p className="text-sm text-gray-500">Validating emails...</p></div>}

           {csvResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Results ({csvResults.length})</span>
                <button onClick={downloadCSV} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"><Download size={16} /> Download CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Score</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Syntax</th>
                    <th className="px-4 py-3 font-medium text-gray-500">MX</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Deliverable</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Disposable</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                  </tr></thead>
                  <tbody>{csvResults.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-[180px] truncate">{r.email}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'VALID' ? 'bg-green-100 text-green-700' : r.status === 'CATCH_ALL' ? 'bg-amber-100 text-amber-700' : r.status === 'DISPOSABLE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-xs font-medium">{r.score ?? 0}</td>
                      <td className="px-4 py-3">{r.is_valid_syntax ? '✓' : '✗'}</td>
                      <td className="px-4 py-3">{r.mx_accepts_mail ? '✓' : '✗'}</td>
                      <td className="px-4 py-3">{r.is_deliverable === undefined ? '—' : r.is_deliverable ? '✓' : '✗'}</td>
                      <td className="px-4 py-3">{r.is_disposable ? '⚠' : '✓'}</td>
                      <td className="px-4 py-3">{r.is_role_account ? '⚠' : '✓'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
