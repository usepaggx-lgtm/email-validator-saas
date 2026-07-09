'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, Loader2, Building, User, Globe, Copy, Check } from 'lucide-react'
import { getUser, apiEnricher, apiCredits } from '@/lib/utils'

export default function EnricherPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState({ used: 0, limit: 100 })

  useEffect(() => {
    if (!getUser()) { router.push('/login'); return }
    apiCredits().then(d => setCredits(d.enricher)).catch(() => {})
  }, [])

  async function handleEnrich(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true); setResult(null)
    try {
      const d = await apiEnricher(email.trim())
      setResult(d.result)
      apiCredits().then(d2 => setCredits(d2.enricher)).catch(() => {})
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Email Enricher</h1>
          <p className="text-sm text-gray-500">Enrich email addresses with name, company, and more.</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 text-sm text-purple-700">
          <span className="font-bold">{credits.limit - credits.used}</span> credits left this month
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <form onSubmit={handleEnrich} className="flex gap-3">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading || !email.includes('@')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Enriching...' : 'Enrich'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Enriched Data</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 break-all">{result.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <User size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="text-sm font-medium text-gray-900">{result.name || 'Not found'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Building size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Company</p>
                <p className="text-sm font-medium text-gray-900">{result.company || 'Not found'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Globe size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Domain</p>
                <p className="text-sm font-medium text-gray-900">{result.domain}</p>
              </div>
            </div>
          </div>
          {result.source && (
            <p className="text-xs text-gray-400 mt-4">
              Source: {result.source === 'database' ? 'Your contact lists' : 'Pattern-based generation'}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
        <p className="text-sm text-gray-600">We extract the name from the email address and look up the domain to identify the company. If the email exists in your contact lists, we use that data for more accurate results.</p>
      </div>
    </>
  )
}
