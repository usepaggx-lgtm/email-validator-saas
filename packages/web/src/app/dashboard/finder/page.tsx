'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Globe, Building, Loader2, CheckCircle, XCircle, Copy, Check, ChevronRight } from 'lucide-react'
import { getUser, apiFinder, apiCredits, authFetch } from '@/lib/utils'

export default function FinderPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'name' | 'company'>('name')
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')
  const [result, setResult] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState({ used: 0, limit: 100 })
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getUser()) { router.push('/login'); return }
    apiCredits().then(d => setCredits(d.finder)).catch(() => {})
  }, [])

  async function handleByName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !domain.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const d = await apiFinder(name.trim(), domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
      if (d.error) { setError(d.error); return }
      setResult(d.result)
      apiCredits().then(d2 => setCredits(d2.finder)).catch(() => {})
    } catch { setError('Connection failed') }
    finally { setLoading(false) }
  }

  async function handleByCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!companyDomain.trim()) return
    setLoading(true); setResults([]); setError('')
    try {
      const d = await authFetch('/api/finder/company', {
        method: 'POST',
        body: JSON.stringify({ domain: companyDomain.trim() }),
      })
      if (d.error) { setError(d.error); return }
      setResults(d.results || [])
      apiCredits().then(d2 => setCredits(d2.finder)).catch(() => {})
    } catch { setError('Connection failed') }
    finally { setLoading(false) }
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email)
    setCopied(email)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Email Finder</h1>
          <p className="text-sm text-gray-500">Find email addresses from names or companies.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm text-blue-700 whitespace-nowrap">
          <span className="font-bold">{credits.limit - credits.used}</span> credits left
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        <button onClick={() => setTab('name')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'name' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <User size={16} className="inline mr-1.5" />By Name
        </button>
        <button onClick={() => setTab('company')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'company' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building size={16} className="inline mr-1.5" />By Company
        </button>
      </div>

      {tab === 'name' ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleByName} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-[2]">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name (e.g. John Silva)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="relative flex-[3]">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="Company domain (e.g. empresa.com)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading || !name || !domain}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? '...' : 'Find'}
            </button>
          </form>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600">{error}</div>}

          {result && (
            <div className={`mt-6 rounded-xl border ${result.email ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${result.email ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center shrink-0`}>
                    {result.email ? <CheckCircle size={22} className="text-green-600" /> : <XCircle size={22} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {result.email ? (
                      <>
                        <p className="text-sm text-green-700 font-medium mb-1">Email found</p>
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-green-100 px-4 py-3">
                          <span className="font-semibold text-gray-900 text-base">{result.email}</span>
                          <button onClick={() => copyEmail(result.email)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            {copied === result.email ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-gray-600">{result.name}</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{result.source}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900">No email found</p>
                        <p className="text-sm text-gray-500 mt-1">Could not find an email for {name} at {domain}.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleByCompany} className="flex gap-3">
            <div className="relative flex-1">
              <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={companyDomain} onChange={e => setCompanyDomain(e.target.value)} placeholder="Company domain (e.g. empresa.com)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading || !companyDomain}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? '...' : 'Search Domain'}
            </button>
          </form>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-sm text-red-600">{error}</div>}

          {results.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3">{results.length} email{results.length !== 1 ? 's' : ''} found</p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.email}</p>
                        <p className="text-xs text-gray-500">{r.role || r.name || r.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.confidence === 'verified' && <span className="text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
                      {r.confidence === 'database' && <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Your data</span>}
                      {r.confidence === 'unverified' && <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unverified</span>}
                      <button onClick={() => copyEmail(r.email)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                        {copied === r.email ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !loading && companyDomain && (
            <div className="mt-6 text-center py-8 text-gray-400">
              <Building size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No emails found for this domain. Try a different domain or check "By Name".</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue-500 mt-0.5 shrink-0" /><span><strong>By Name:</strong> We generate common email patterns (nome.sobrenome@, n.sobrenome@, nome@) and validate them.</span></li>
          <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue-500 mt-0.5 shrink-0" /><span><strong>By Company:</strong> We search your contact database and generate role-based emails (info@, contact@, sales@).</span></li>
        </ul>
      </div>
    </>
  )
}
