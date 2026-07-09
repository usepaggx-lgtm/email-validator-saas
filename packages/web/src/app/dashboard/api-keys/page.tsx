'use client'

import { useState, useEffect } from 'react'
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import { apiGetKeys, apiCreateKey, apiDeleteKey } from '@/lib/utils'

export default function ApiKeysContent() {
  const [keys, setKeys] = useState<any[]>([])
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadKeys() }, [])

  async function loadKeys() {
    try { const d = await apiGetKeys(); setKeys(d.keys || []) }
    catch { setError('Failed to load keys') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try { const data = await apiCreateKey(newName.trim()); setKeys(prev => [data, ...prev]); setNewName(''); setShowCreate(false) }
    catch { setError('Failed to create key') }
    finally { setCreating(false) }
  }

  async function handleDelete(id: string) {
    try { await apiDeleteKey(id); setKeys(prev => prev.filter(k => k.id !== id)) }
    catch { setError('Failed to delete key') }
  }

  function copy(id: string, key: string) { navigator.clipboard.writeText(key); setCopied(id); setTimeout(() => setCopied(null), 2000) }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your API keys for programmatic access</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"><Plus size={16} /> Create Key</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 flex items-center justify-between"><span>{error}</span><button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button></div>}

      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create New API Key</h3>
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Production, Staging..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <button onClick={handleCreate} disabled={creating || !newName.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
              {creating && <Loader2 size={14} className="animate-spin" />}Create</button>
            <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">Cancel</button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Key size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-900 mb-1">No API keys yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first API key to start integrating.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">Create your first key</button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <div key={k.id} className="bg-white rounded-2xl border border-gray-200 p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{k.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Created {new Date(k.created_at).toLocaleDateString()} · Last used {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'never'}</p>
                </div>
                <button onClick={() => handleDelete(k.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <code className="flex-1 text-xs font-mono text-gray-600 truncate">{visible[k.id] ? k.key : `${k.key.slice(0, 16)}${'•'.repeat(16)}`}</code>
                <button onClick={() => setVisible({ ...visible, [k.id]: !visible[k.id] })} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                  {visible[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => copy(k.id, k.key)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                  {copied === k.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span><strong className="text-gray-600">{k.usage_count || 0}</strong> requests</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Start</h3>
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/validate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"email": "user@example.com"}'`}
        </pre>
      </div>
    </>
  )
}
