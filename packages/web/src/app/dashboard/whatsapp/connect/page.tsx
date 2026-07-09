'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Smartphone, Loader2, ArrowLeft, Check, Link, RefreshCw } from 'lucide-react'
import { authFetch } from '@/lib/utils'

type Step = 'create' | 'connect' | 'success'
type Tab = 'qr' | 'pairing'

export default function WhatsAppConnectPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('create')
  const [tab, setTab] = useState<Tab>('qr')
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  useEffect(() => () => clearPoll(), [clearPoll])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true); setError('')
    try {
      const data = await authFetch('/api/whatsapp/instance/create', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      if (data.error) { setError(data.error); return }
      setInstanceId(data.id)
      setStep('connect')
    } catch { setError('Failed to create instance') }
    finally { setLoading(false) }
  }

  async function handleConnectQR() {
    if (!instanceId || loading) return
    setLoading(true); setError(''); setQrCode(null)
    try {
      const data = await authFetch('/api/whatsapp/instance/connect', {
        method: 'POST',
        body: JSON.stringify({ id: instanceId }),
      })
      if (data.error) { setError(data.error); return }
      if (data.qr) setQrCode(data.qr)
      pollRef.current = setInterval(async () => {
        try {
          const statusData = await authFetch(`/api/whatsapp/instance/${instanceId}/status`)
          if (statusData.status === 'connected') {
            clearPoll()
            setStep('success')
          }
        } catch {}
      }, 3000)
    } catch { setError('Failed to connect') }
    finally { setLoading(false) }
  }

  async function handlePairing() {
    if (!instanceId || !phoneNumber.trim() || loading) return
    setLoading(true); setError(''); setPairingCode(null)
    try {
      const data = await authFetch('/api/whatsapp/instance/pairing', {
        method: 'POST',
        body: JSON.stringify({ id: instanceId, phoneNumber: phoneNumber.trim() }),
      })
      if (data.error) { setError(data.error); return }
      setPairingCode(data.code || data.pairingCode)
    } catch { setError('Failed to get pairing code') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl p-6 mb-6 text-white">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-3 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold">Connect WhatsApp</h1>
        <p className="text-sm text-white/80 mt-1">Link your WhatsApp instance to send messages</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Create Instance</h2>
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instance Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My WhatsApp Instance"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 mb-4"
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
              {loading ? 'Creating...' : 'Create Instance'}
            </button>
          </form>
        </div>
      )}

      {step === 'connect' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setTab('qr')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === 'qr' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <QrCode size={16} /> QR Code
              </button>
              <button
                onClick={() => setTab('pairing')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === 'pairing' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone size={16} /> Pairing Code
              </button>
            </div>

            {tab === 'qr' && (
              <div className="p-6 text-center">
                {!qrCode ? (
                  <div className="py-8">
                    <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">Click the button below to generate a QR code, then scan it with your WhatsApp app.</p>
                    <button
                      onClick={handleConnectQR}
                      disabled={loading}
                      className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                      {loading ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Scan this QR code with your WhatsApp app</p>
                    <img src={qrCode} alt="WhatsApp QR Code" className="mx-auto rounded-xl border border-gray-200 max-w-[280px]" />
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
                      <Loader2 size={14} className="animate-spin" />
                      Waiting for scan...
                    </div>
                    <button
                      onClick={() => { clearPoll(); handleConnectQR() }}
                      className="mt-3 text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} /> Refresh QR
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'pairing' && (
              <div className="p-6">
                {!pairingCode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="5511999999999"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 mb-1"
                    />
                    <p className="text-xs text-gray-400 mb-4">Include country code without + or spaces</p>
                    <button
                      onClick={handlePairing}
                      disabled={loading || !phoneNumber.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                      {loading ? 'Connecting...' : 'Get Pairing Code'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">Enter this code in your WhatsApp app</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
                      <span className="text-3xl font-mono font-bold tracking-widest text-gray-900 select-all">{pairingCode}</span>
                    </div>
                    <p className="text-xs text-gray-400">Open WhatsApp &gt; Linked Devices &gt; Link a Device &gt; Pair with code</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
                      <Loader2 size={14} className="animate-spin" />
                      Waiting for pairing...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400">
              Instance ID: <span className="font-mono text-gray-600">{instanceId}</span>
            </p>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connected!</h2>
          <p className="text-sm text-gray-600 mb-6">Your WhatsApp instance is now active and ready to use.</p>
          <button
            onClick={() => router.push(`/dashboard/whatsapp/${instanceId}`)}
            className="py-2.5 px-8 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg inline-flex items-center gap-2"
          >
            Go to Instance
          </button>
        </div>
      )}
    </div>
  )
}
