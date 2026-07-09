'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, CheckCircle, XCircle, Loader2, Shield,
  Mail, ChevronRight, Play,
} from 'lucide-react'

export default function HeroSection() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    setTimeout(() => setVisible(true), 200)
    return () => { mounted.current = false }
  }, [])

  async function handleDemoValidate(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (mounted.current) setResult(data)
    } catch {
      if (mounted.current) setResult({ email, status: 'UNKNOWN', validations: { syntax: false, domain_exists: false, mx_records: false, is_disposable: false, is_role_based: false } })
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  const isSuccess = result?.status === 'VALID'

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-8 animate-slide-down">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-sm text-white/80 font-medium">99.9% Uptime — Trusted by 10,000+ companies</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6 text-balance">
              Stop Sending Emails
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-200">
                That Never Arrive
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-lg">
              Validate every email address in real-time. Protect your sender reputation,
              reduce bounce rates, and save money with enterprise-grade email verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-300 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Try it: enter@any-email.com"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/50 transition-all"
                />
              </div>
              <button
                onClick={handleDemoValidate}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Play size={16} className="group-hover:translate-x-0.5 transition-transform" />
                )}
                {loading ? 'Validating...' : 'Verify Email'}
              </button>
            </div>

            {result && (
              <div className={`p-5 rounded-2xl backdrop-blur-sm border transition-all duration-500 animate-slide-up ${
                isSuccess ? 'bg-green-500/10 border-green-500/30' : result.status === 'DISPOSABLE' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-xl ${isSuccess ? 'bg-green-500/20' : result.status === 'DISPOSABLE' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    {isSuccess ? <CheckCircle size={22} className="text-green-400" /> : <XCircle size={22} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{result.email}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isSuccess ? 'bg-green-500/20 text-green-300' : result.status === 'DISPOSABLE' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                      }`}>{result.status}</span>
                    </div>
                    {result.validations && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                        {Object.entries(result.validations).map(([k, v]) => (
                          <span key={k} className={v ? 'text-green-300' : 'text-red-300'}>
                            {v ? '✓' : '✗'} {k.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {result.suggestion && (
                      <p className="mt-1.5 text-sm text-amber-300">Did you mean: <span className="font-mono">{result.email.split('@')[0]}@{result.suggestion}</span>?</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-white/40" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-white/40" />
                <span>Zero Data Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70 font-semibold">99.9%</span>
                <span>Accuracy Rate</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 animate-float">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <span className="text-xs text-white/40 font-medium">Quick Start — cURL Example</span>
                </div>
                <pre className="text-sm text-white/70 font-mono leading-relaxed overflow-x-auto">
                  <code>{`curl -X POST https://api.emailvalidator.dev/validate \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: YOUR_KEY" \\
  -d '{"email": "user@example.com"}'`}</code>
                </pre>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white/20 flex items-center justify-center text-[10px] text-white font-bold">
                          {['J', 'M', 'A'][i - 1]}
                        </div>
                      ))}
                    </div>
                    <span className="text-white/50">Join <strong className="text-white/80">10,000+</strong> developers already using EmailValidator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
