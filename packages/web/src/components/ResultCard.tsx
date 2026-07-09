'use client'

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

const STATUS_COLORS: Record<string, string> = {
  VALID: 'bg-green-100 text-green-800 border-green-200',
  INVALID_FORMAT: 'bg-red-100 text-red-800 border-red-200',
  INVALID_DOMAIN: 'bg-red-100 text-red-800 border-red-200',
  DISPOSABLE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROBABLY_VALID: 'bg-blue-100 text-blue-800 border-blue-200',
}

const STATUS_LABELS: Record<string, string> = {
  VALID: 'Valid',
  INVALID_FORMAT: 'Invalid Format',
  INVALID_DOMAIN: 'Invalid Domain',
  DISPOSABLE: 'Disposable',
  PROBABLY_VALID: 'Probably Valid',
}

export default function ResultCard({ result }: { result: ValidationResult }) {
  const colorClass = STATUS_COLORS[result.status] || 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm break-all">{result.email}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colorClass} ml-2 shrink-0`}>
          {STATUS_LABELS[result.status] || result.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {Object.entries(result.validations).map(([k, v]) => {
          const isRisk = ['is_disposable', 'is_role_based', 'is_gibberish', 'is_spamtrap'].includes(k)
          const good = isRisk ? !v : v
          return (
            <div key={k} className={`flex items-center gap-1 ${good ? 'text-green-700' : 'text-red-500'}`}>
              <span>{v ? '✓' : '✗'}</span>
              <span>{k.replace(/^is_/, '').replace(/_/g, ' ')}</span>
            </div>
          )
        })}
      </div>

      {result.alias_of && (
        <p className="mt-2 text-xs text-blue-600">
          Alias of: <span className="font-mono">{result.alias_of}</span>
        </p>
      )}

      {result.suggestion && (
        <p className="mt-1 text-xs text-amber-600">
          Did you mean: <span className="font-mono">{result.email.split('@')[0]}@{result.suggestion}</span>
        </p>
      )}

      {result.error && (
        <p className="mt-1 text-xs text-red-500">{result.error}</p>
      )}
    </div>
  )
}
