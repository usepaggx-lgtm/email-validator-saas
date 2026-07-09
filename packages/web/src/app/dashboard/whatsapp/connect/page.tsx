'use client'

import { useState } from 'react'
import { QrCode, Smartphone, Loader2, ArrowLeft, Check, Link, RefreshCw } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Step = 'create' | 'connect' | 'success'
type Method = 'qr' | 'pairing'

export default function ConnectPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('create')
  const [method, setMethod] = useState<Method>('qr')
  const [instanceName, setInstanceName] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!instanceName.trim()) { setError('Instance name is required'); return }
    setCreating(true)
    try {
      const res = await authFetch('/api/whatsapp/instance/create', { method: 'POST', body: JSON.stringify({ name: instanceName.trim() }) })
      if (res.error) { setError(res.error); return }
      setInstanceId(res.id)
      setStep('connect')
    } catch { setError('Failed to create instance') }
    finally { setCreating(false) }
  }

  const handleConnectQR = async () => {
    setError('')
    setConnecting(true)
    setQrCode('')
    try {
      const res = await authFetch('/api/whatsapp/instance/connect', { method: 'POST', body: JSON.stringify({ id: instanceId }) })
      if (res.error) { setError(res.error); return }
      setQrCode(res.qrCode)
    } catch { setError('Failed to connect') }
    finally { setConnecting(false) }
  }

  const handlePairing = async () => {
    setError('')
    if (!phoneNumber.trim()) { setError('Phone number is required'); return }
    setConnecting(true)
    setPairingCode('')
    try {
      const res = await authFetch('/api/whatsapp/instance/pairing', { method: 'POST', body: JSON.stringify({ id: instanceId, phoneNumber: phoneNumber.trim() }) })
      if (res.error) { setError(res.error); return }
      setPairingCode(res.pairingCode)
    } catch { setError('Failed to send pairing code') }
    finally { setConnecting(false) }
  }

  const connected = qrCode || pairingCode

  return (
    <>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl p-6 sm:p-8 mb-6 text-white">
        <div className="flex items-center gap-4">
          {step !== 'create' && (
            <button onClick={() => { setStep('create'); setQrCode(''); setPairingCode(''); setError('') }} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {step === 'create' ? 'Connect WhatsApp' : step === 'connect' ? 'Scan QR Code' : 'Connected!'}
            </h1>
            <p className="text-purple-100 text-sm mt-1">
              {step === 'create' ? 'Create a new WhatsApp instance' : step === 'connect' ? `Instance: ${instanceName}` : 'Your instance is ready'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {step === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Instance</h2>
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instance Name</label>
            <input
              type="text"
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              placeholder="My WhatsApp"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={creating}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
              {creating ? 'Creating...' : 'Create Instance'}
            </button>
          </form>
        </div>
      )}

      {step === 'connect' && (
        <>
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMethod('qr')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${method === 'qr' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}
            >
              <QrCode size={16} />
              QR Code
            </button>
            <button
              onClick={() => setMethod('pairing')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${method === 'pairing' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}
            >
              <Smartphone size={16} />
              Pairing Code
            </button>
          </div>

          {method === 'qr' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              {qrCode ? (
                <>
                  <img src={qrCode} alt="QR Code" className="mx-auto w-56 h-56" />
                  <p className="text-sm text-gray-500 mt-4">Scan this QR code with your WhatsApp app</p>
                  <button
                    onClick={() => { setQrCode(''); setConnecting(false) }}
                    className="mt-3 inline-flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-700"
                  >
                    <RefreshCw size={14} />
                    Refresh QR Code
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                    <QrCode size={28} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect via QR Code</h3>
                  <p className="text-sm text-gray-500 mb-5">Open WhatsApp on your phone and scan the QR code</p>
                  <button
                    onClick={handleConnectQR}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                  >
                    {connecting ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                    {connecting ? 'Generating QR Code...' : 'Generate QR Code'}
                  </button>
                </>
              )}
            </div>
          )}

          {method === 'pairing' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {pairingCode ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={28} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pairing Code</h3>
                  <p className="text-sm text-gray-500 mb-5">Enter this code in your WhatsApp app</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 inline-block">
                    <span className="text-3xl font-mono font-bold tracking-widest text-gray-900">{pairingCode}</span>
                  </div>
                  <button
                    onClick={() => { setPairingCode(''); setConnecting(false) }}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-700"
                  >
                    <RefreshCw size={14} />
                    Generate New Code
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect via Pairing Code</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="5511999999999"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Enter the phone number with country code (e.g. 5511999999999)</p>
                  <button
                    onClick={handlePairing}
                    disabled={connecting}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                  >
                    {connecting ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                    {connecting ? 'Requesting Code...' : 'Request Pairing Code'}
                  </button>
                </>
              )}
            </div>
          )}

          {connected && (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Waiting for connection</h3>
              <p className="text-sm text-gray-500 mb-4">Once you scan the QR code or enter the pairing code, the connection will be established automatically</p>
              <button
                onClick={() => router.push(`/dashboard/whatsapp/view?id=${instanceId}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Check size={16} />
                Go to Instance
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
