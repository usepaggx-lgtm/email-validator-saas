'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Plus, Loader2, Wifi, WifiOff, RefreshCw, Phone, User, Calendar, ArrowRight } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  connected: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', label: 'Connected' },
  connecting: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', label: 'Connecting' },
  disconnected: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Disconnected' },
}

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/whatsapp/instances')
      .then(data => setInstances(data.instances || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl p-6 sm:p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className="text-purple-100 text-sm mt-1">Manage your WhatsApp instances and connections</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{instances.length} instance{instances.length !== 1 ? 's' : ''}</p>
        <Link
          href="/dashboard/whatsapp/connect"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-shadow"
        >
          <Plus size={16} />
          Connect Instance
        </Link>
      </div>

      {instances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={28} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No instances yet</h3>
          <p className="text-sm text-gray-500 mb-5">Connect your first WhatsApp instance to get started</p>
          <Link
            href="/dashboard/whatsapp/connect"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            <Plus size={16} />
            Connect Instance
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {instances.map(inst => {
            const status = STATUS_CONFIG[inst.status] || STATUS_CONFIG.disconnected
            return (
              <Link
                key={inst.id}
                href={`/dashboard/whatsapp/${inst.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-purple-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <MessageCircle size={22} className="text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{inst.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {inst.owner && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} />
                            {inst.owner}
                          </span>
                        )}
                        {inst.profileName && (
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {inst.profileName}
                          </span>
                        )}
                        {inst.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(inst.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
