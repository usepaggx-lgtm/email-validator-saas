'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
  Clock,
} from 'lucide-react'

const TABS = [
  { key: 'overview', label: 'Overview', icon: Plug },
  { key: 'chats', label: 'Chats', icon: MessageSquare },
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function WhatsAppInstancePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInstance = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/whatsapp/instance/${id}`)
      if (!res.ok) throw new Error('Failed to load instance')
      const data = await res.json()
      setInstance(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInstance()
  }, [fetchInstance])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Error loading instance</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchInstance}
            className="mt-3 text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!instance) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a
          href="/dashboard/whatsapp"
          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{instance.name}</h1>
          <p className="text-sm text-gray-500">{instance.ownerNumber}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab instance={instance} id={id} onRefresh={fetchInstance} />
      )}
      {activeTab === 'chats' && <ChatsTab id={id} />}
      {activeTab === 'contacts' && <ContactsTab id={id} />}
      {activeTab === 'settings' && <SettingsTab id={id} />}
    </div>
  )
}

function OverviewTab({
  instance,
  id,
  onRefresh,
}: {
  instance: any
  id: string
  onRefresh: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    authFetch(`/api/whatsapp/stats/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .catch(() => {})
  }, [id])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await authFetch(`/api/whatsapp/disconnect/${id}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to disconnect')
      onRefresh()
    } catch {
      alert('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await authFetch(`/api/whatsapp/instance/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      window.location.href = '/dashboard/whatsapp'
    } catch {
      alert('Failed to delete')
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
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  instance.status === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : instance.status === 'connecting'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {instance.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Owner Number</span>
              <span className="text-sm font-medium text-gray-900">
                {instance.ownerNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Profile Name</span>
              <span className="text-sm font-medium text-gray-900">
                {instance.profileName || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Connection Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {stats?.chats ?? '...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Chats</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {stats?.contacts ?? '...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Contacts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            <QrCode className="w-4 h-4" />
            View QR Code
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Plug className="w-4 h-4" />
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Are you sure?</span>
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

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/chats/${id}`)
      .then((r) => (r.ok ? r.json() : { chats: [] }))
      .then((d) => setChats(d.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const openChat = async (jid: string) => {
    setSelectedChat(jid)
    setMessagesLoading(true)
    try {
      const res = await authFetch(`/api/whatsapp/messages/${id}/${jid}?limit=20`)
      if (!res.ok) throw new Error()
      const data = await res.json()
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
      const res = await authFetch(`/api/whatsapp/message/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, to: selectedChat, text: text.trim() }),
      })
      if (!res.ok) throw new Error()
      setText('')
      const msg = { fromMe: true, text: text.trim(), timestamp: Date.now() }
      setMessages((prev) => [...prev, msg])
    } catch {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (selectedChat) {
    const chat = chats.find((c) => c.jid === selectedChat)
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setSelectedChat(null)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900">
            {chat?.name || selectedChat}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No messages yet
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.fromMe
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.fromMe ? 'text-purple-200' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp
                      ? new Date(
                          msg.timestamp * 1000
                        ).toLocaleTimeString()
                      : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : chats.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          No chats found
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {chats.map((chat) => (
            <button
              key={chat.jid}
              onClick={() => openChat(chat.jid)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {chat.name || chat.jid}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactsTab({ id }: { id: string }) {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [checkResult, setCheckResult] = useState<{ exists: boolean; jid?: string } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/contacts/${id}`)
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((d) => setContacts(d.contacts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const filtered = contacts.filter(
    (c) =>
      !search ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.number && c.number.includes(search))
  )

  const handleCheck = async () => {
    if (!checkNumber.trim()) return
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await authFetch(`/api/whatsapp/contacts/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, number: checkNumber.trim() }),
      })
      if (!res.ok) throw new Error('Check failed')
      const data = await res.json()
      setCheckResult(data)
    } catch {
      alert('Failed to check number')
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
            onChange={(e) => setCheckNumber(e.target.value)}
            placeholder="Enter phone number..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleCheck}
            disabled={checking || !checkNumber.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
        {checkResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              checkResult.exists
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {checkResult.exists
              ? `Number exists on WhatsApp (JID: ${checkResult.jid})`
              : 'Number does not exist on WhatsApp'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            {search ? 'No contacts match your search' : 'No contacts found'}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filtered.map((contact) => (
              <div
                key={contact.jid}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contact.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{contact.number}</p>
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

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/whatsapp/webhook/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setWebhookUrl(data.url || '')
          setEnabled(data.enabled ?? false)
          setEvents(data.events?.join(', ') || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await authFetch(`/api/whatsapp/webhook/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          url: webhookUrl,
          enabled,
          events: events
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error('Failed to save webhook')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Failed to save webhook settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h3 className="font-semibold text-gray-900">Webhook Configuration</h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Events (comma separated)
            </label>
            <input
              type="text"
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder="message, presence, ack"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="webhook-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="webhook-enabled" className="text-sm text-gray-700">
              Webhook enabled
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {saved && (
            <p className="text-sm text-green-600 font-medium">
              Webhook settings saved successfully
            </p>
          )}
        </div>
      )}
    </div>
  )
}
