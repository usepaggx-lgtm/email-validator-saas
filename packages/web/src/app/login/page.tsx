'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, Smartphone, Loader2, Shield } from 'lucide-react'
import { apiLogin, api2faLogin } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'login' | '2fa'>('login')
  const [tempToken, setTempToken] = useState('')
  const [code, setCode] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      const data = await apiLogin(email, password)
      if (data.error) { setError(data.error); return }
      if (data.requires_2fa) {
        setTempToken(data.temp_token)
        setStep('2fa')
        return
      }
      localStorage.setItem('ev_token', data.token)
      localStorage.setItem('ev_user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch { setError('Connection failed') }
    finally { setLoading(false) }
  }

  async function handle2fa(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) return
    setLoading(true); setError('')
    try {
      const data = await api2faLogin(tempToken, code)
      if (data.error) { setError(data.error); return }
      localStorage.setItem('ev_token', data.token)
      localStorage.setItem('ev_user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch { setError('Verification failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">EmailValidator</span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'login' ? 'Welcome back' : 'Two-Factor Authentication'}
          </h1>
          <p className="text-gray-500">
            {step === 'login' ? 'Sign in to your account to continue.' : 'Enter the code from your authenticator app.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {step === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2fa} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={28} className="text-white" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Open your authenticator app and enter the 6-digit code.</p>
                <p className="text-xs text-gray-400">{email}</p>
              </div>
              <div>
                <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading || code.length < 6}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setError(''); setCode('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">← Back to login</button>
            </form>
          )}
        </div>

        {step === 'login' && (
          <p className="text-center mt-8 text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create one →</a>
          </p>
        )}
      </div>
    </div>
  )
}
