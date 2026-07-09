'use client'

import { useState } from 'react'
import { validateEmail, validateBatch } from '@/lib/api'
import ResultCard from './ResultCard'

interface ValidationResult {
  email: string
  validations: {
    syntax: boolean
    domain_exists: boolean
    mx_records: boolean
    is_disposable: boolean
    is_role_based: boolean
  }
  status: string
  alias_of?: string
  suggestion?: string
  error?: string
}

export default function ValidationForm() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [results, setResults] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults([])

    try {
      if (mode === 'single') {
        const data = await validateEmail(input.trim())
        setResults([data])
      } else {
        const emails = input
          .split(/[\n,]+/)
          .map(e => e.trim())
          .filter(Boolean)
          .slice(0, 100)

        if (emails.length === 0) {
          setError('Please enter at least one email')
          setLoading(false)
          return
        }

        const data = await validateBatch(emails)
        setResults(data.results || [])
      }
    } catch {
      setError('Failed to validate. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const validCount = results.filter(r => r.status === 'VALID').length
  const invalidCount = results.filter(r => r.status === 'INVALID_FORMAT' || r.status === 'INVALID_DOMAIN').length
  const disposableCount = results.filter(r => r.status === 'DISPOSABLE').length

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'single'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'batch'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Batch
          </button>
        </div>

        <div>
          {mode === 'single' ? (
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          ) : (
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter emails separated by commas or new lines (max 100)"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Validating...' : 'Validate Email'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-8">
          {results.length > 1 && (
            <div className="flex gap-4 mb-6 text-sm">
              <span className="text-green-600 font-medium">{validCount} valid</span>
              <span className="text-red-600 font-medium">{invalidCount} invalid</span>
              <span className="text-yellow-600 font-medium">{disposableCount} disposable</span>
            </div>
          )}
          <div className="space-y-3">
            {results.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
