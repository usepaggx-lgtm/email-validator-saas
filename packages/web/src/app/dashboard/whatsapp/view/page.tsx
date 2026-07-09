'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { authFetch } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  Settings,
  Send,
  Trash2,
  Plug,
  QrCode,
  Search,
  ArrowLeft,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react'

const TABS = [
  { key: 'overview', label: 'Overview', icon: Plug },
  { key: 'chats', label: 'Chats', icon: MessageSquare },
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function WhatsAppInstanceViewPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [activeTab, setActiveTab] = useState('overview')
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInstance = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await authFetch(`/api/whatsapp/instance/${id}/status`)
      if (data.error) throw new Error(data.error)
      setInstance(data.status)
    } catch (e: any) {
      setError(e.message || 'Failed to load instance')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInstance()
  }, [fetchInstance])

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">No instance ID provided</p>
          <a href="/dashboard/whatsapp" className="mt-3 inline-block text-sm text-red-600 underline hover:no-underline">Go back</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 max-w-md">
          <p className="font-medium">Error loading instance</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={fetchInstance} className="mt-3 text-sm text-red-600 underline hover:no-underline">Try again</button>
        </div>
      </div>
    )
  }

  const statusDot = instance?.connected ? 'bg-green-500' : 'bg-red-500'
  const statusLabel = instance?.connected ? 'Connected' : 'Disconnected'
  const StatusIcon = instance?.connected ? Wifi : WifiOff

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/dashboard/whatsapp" className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{instance?.name || 'WhatsApp Instance'}</h1>
          <p className="text-sm text-gray-500">{instance?.owner || 'No owner number'}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shrink-0 ${instance?.connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <StatusIcon size={12} />
          {statusLabel}
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab id={id} instance={instance} onRefresh={fetchInstance} />}
      {activeTab === 'chats' && <ChatsTab id={id} />}
      {activeTab === 'contacts' && <ContactsTab id={id} />}
      {activeTab === 'settings' && <SettingsTab id={id} />}
    </div>
  )
}

function OverviewTab({ id, instance, onRefresh }: { id: string; instance: any; onRefresh: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [stats, setStats] = useState<{ chats: number; contacts: number } | null>(null)
  const [qrError, setQrError] = useState('')

  useEffect(() => {
    authFetch(`/api/whatsapp/stats/${id}`)
      .then(data => {
        if (!data.error) setStats(data)
      })
      .catch(() => {})
  }, [id])

  const handleShowQr = async () => {
    setQrLoading(true)
    setQrError('')
    try {
      const data = await authFetch(`/api/whatsapp/instance/connect`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
      if (data.error) throw new Error(data.error)
      setQrCode(data.qrCode)
      setShowQr(true)
    } catch (e: any) {
      setQrError(e.message || 'Failed to get QR code')
    } finally {
      setQrLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const data = await authFetch(`/api/whatsapp/instance/disconnect`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
      if (data.error) throw new Error(data.error)
      onRefresh()
    } catch (e: any) {
      alert(e.message || 'Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const data = await authFetch(`/api/whatsapp/instance/${id}`, {
        method: 'DELETE',
      })
      if (data.error) throw new Error(data.error)
      window.location.href = '/dashboard/whatsapp'
    } catch (e: any) {
      alert(e.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Instance Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{instance?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${instance?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${instance?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                {instance?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Owner Number</span>
              <span className="text-sm font-medium text-gray-900">{instance?.owner || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Profile Name</span>
              <span className="text-sm font-medium text-gray-900">{instance?.profileName || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Connection Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats?.chats ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Chats</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats?.contacts ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Contacts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleShowQr}
            disabled={qrLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium disabled:opacity-50"
          >
            {qrLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
            {qrLoading ? 'Generating...' : 'Show QR Code'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Plug size={16} />
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {qrError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {qrError}
        </div>
      )}

      {showQr && qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">QR Code</h3>
              <button onClick={() => { setShowQr(false); setQrCode('') }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Scan this QR code with WhatsApp to connect</p>
            <img src={qrCode} alt="WhatsApp QR Code" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

function ChatsTab({ id }: { id: string }) {
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/chats/${id}`)
      .then(data => {
        if (data.error) throw new Error(data.error)
        setChats(data.chats || [])
      })
      .catch((e: any) => setError(e.message || 'Failed to load chats'))
      .finally(() => setLoading(false))
  }, [id])

  const openChat = async (jid: string) => {
    setSelectedChat(jid)
    setMessagesLoading(true)
    try {
      const data = await authFetch(`/api/whatsapp/messages/${id}/${jid}?limit=20`)
      if (data.error) throw new Error(data.error)
      setMessages(data.messages || [])
    } catch {
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!text.trim() || !selectedChat) return
    setSending(true)
    try {
      const data = await authFetch(`/api/whatsapp/message/text`, {
        method: 'POST',
        body: JSON.stringify({ id, to: selectedChat, text: text.trim() }),
      })
      if (data.error) throw new Error(data.error)
      setText('')
      setMessages(prev => [...prev, { key: { fromMe: true }, message: { conversation: text.trim() }, messageTimestamp: Math.floor(Date.now() / 1000) }])
    } catch {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (selectedChat) {
    const chat = chats.find(c => c.jid === selectedChat)
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-medium text-gray-900 truncate">{chat?.name || selectedChat}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
          ) : (
            messages.map((msg, i) => {
              const fromMe = msg.key?.fromMe
              const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Unsupported message]'
              const ts = msg.messageTimestamp
              return (
                <div key={i} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-2 ${fromMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{messageText}</p>
                    {ts && (
                      <p className={`text-xs mt-1 ${fromMe ? 'text-purple-200' : 'text-gray-400'}`}>
                        {new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Chats</h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : chats.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">No chats found</p>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.jid}
              onClick={() => openChat(chat.jid)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm truncate">{chat.name || chat.jid}</span>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{chat.lastMessage}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ContactsTab({ id }: { id: string }) {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [checkResult, setCheckResult] = useState<{ exists: boolean; jid?: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/contacts/${id}`)
      .then(data => {
        if (data.error) throw new Error(data.error)
        setContacts(data.contacts || [])
      })
      .catch((e: any) => setError(e.message || 'Failed to load contacts'))
      .finally(() => setLoading(false))
  }, [id])

  const filtered = contacts.filter(c =>
    !search ||
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.number && c.number.includes(search))
  )

  const handleCheck = async () => {
    if (!checkNumber.trim()) return
    setChecking(true)
    setCheckResult(null)
    try {
      const data = await authFetch(`/api/whatsapp/contacts/check`, {
        method: 'POST',
        body: JSON.stringify({ id, number: checkNumber.trim() }),
      })
      if (data.error) throw new Error(data.error)
      setCheckResult(data)
    } catch (e: any) {
      alert(e.message || 'Failed to check number')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Check Number</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkNumber}
            onChange={e => setCheckNumber(e.target.value)}
            placeholder="Enter phone number with country code..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleCheck}
            disabled={checking || !checkNumber.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : null}
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
        {checkResult && (
          <div className={`p-3 rounded-lg text-sm ${checkResult.exists ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {checkResult.exists
              ? `Number exists on WhatsApp${checkResult.jid ? ` (JID: ${checkResult.jid})` : ''}`
              : 'Number does not exist on WhatsApp'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
        ) : error ? (
          <div className="text-center py-12"><p className="text-sm text-red-600">{error}</p></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">{search ? 'No contacts match your search' : 'No contacts found'}</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filtered.map(contact => (
              <div key={contact.jid} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{contact.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{contact.number}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsTab({ id }: { id: string }) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [events, setEvents] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/webhook/${id}`)
      .then(data => {
        if (data.error) throw new Error(data.error)
        if (data.config) {
          setWebhookUrl(data.config.url || '')
          setEnabled(data.config.enabled ?? false)
          setEvents(Array.isArray(data.config.events) ? data.config.events.join(', ') : '')
        }
      })
      .catch((e: any) => setError(e.message || 'Failed to load webhook config'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const data = await authFetch(`/api/whatsapp/webhook/set`, {
        method: 'POST',
        body: JSON.stringify({
          id,
          url: webhookUrl,
          enabled,
          events: events.split(',').map(e => e.trim()).filter(Boolean),
        }),
      })
      if (data.error) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Failed to save webhook settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h3 className="font-semibold text-gray-900">Webhook Configuration</h3>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Events (comma separated)</label>
            <input
              type="text"
              value={events}
              onChange={e => setEvents(e.target.value)}
              placeholder="message, presence, ack"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </div>
            <span className="text-sm text-gray-700 font-medium">Webhook enabled</span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Webhook settings saved successfully</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
