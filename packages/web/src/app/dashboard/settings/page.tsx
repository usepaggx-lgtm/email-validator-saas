'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Check, Loader2, X, Copy, Smartphone } from 'lucide-react'
import { getUser, api2faStatus, api2faSetup, api2faVerify, api2faDisable } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
    api2faStatus().then(d => setEnabled(d.enabled)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setProcessing(true); setError('')
    try {
      const d = await api2faSetup(password)
      if (d.error) { setError(d.error); return }
      setSecret(d.secret)
      setUri(d.uri)
      setStep('verify')
    } catch { setError('Failed to setup 2FA') }
    finally { setProcessing(false) }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) return
    setProcessing(true); setError('')
    try {
      const d = await api2faVerify(code, secret)
      if (d.error) { setError(d.error); return }
      setEnabled(true)
      setStep('idle')
      setMsg('2FA enabled successfully!')
      setPassword(''); setCode(''); setSecret(''); setUri('')
    } catch { setError('Invalid code') }
    finally { setProcessing(false) }
  }

  async function handleDisable() {
    if (!code || !password) { setError('Enter code and password to disable'); return }
    setProcessing(true); setError('')
    try {
      const d = await api2faDisable(code, password)
      if (d.error) { setError(d.error); return }
      setEnabled(false)
      setMsg('2FA disabled')
      setCode(''); setPassword('')
    } catch { setError('Failed to disable') }
    finally { setProcessing(false) }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
  if (!user) return null

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-gray-400" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Security Settings</h1>
          <p className="text-sm text-gray-500">Manage your account security and 2FA.</p>
        </div>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 text-sm text-green-700 flex items-center gap-2"><Check size={16} />{msg}</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-gray-400" />
            <div>
              <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
            </div>
          </div>
          {enabled && (
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Enabled</span>
          )}
        </div>

        {!enabled && step === 'idle' && (
          <form onSubmit={handleSetup} className="space-y-4 max-w-sm">
            <p className="text-sm text-gray-600">Enter your password to start setting up 2FA.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button type="submit" disabled={processing || !password}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
              {processing ? 'Verifying...' : 'Setup 2FA'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Scan with Google Authenticator</p>
              <p className="text-xs text-gray-500 mb-3">Or enter this secret key manually:</p>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <code className="flex-1 text-xs font-mono text-gray-700 break-all">{secret}</code>
                <button onClick={copySecret} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Authentication code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              <div className="flex gap-3 mt-3">
                <button onClick={handleVerify} disabled={processing || code.length < 6}
                  className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all text-sm disabled:opacity-50">
                  {processing ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button onClick={() => setStep('idle')} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {enabled && (
          <div className="space-y-4 max-w-sm">
            <p className="text-sm text-gray-600">2FA is currently active. To disable, enter your password and a code from your authenticator app.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button onClick={handleDisable} disabled={processing || !code || !password}
              className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all text-sm disabled:opacity-50">
              {processing ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">How it works</h2>
        <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
          <li>Install Google Authenticator (or any TOTP app) on your phone.</li>
          <li>Click "Setup 2FA" and enter your password.</li>
          <li>Scan the QR code or enter the secret key manually.</li>
          <li>Enter the 6-digit code from the app to verify.</li>
          <li>After login, you&apos;ll be asked for a code from the app.</li>
        </ol>
      </div>
    </>
  )
}
