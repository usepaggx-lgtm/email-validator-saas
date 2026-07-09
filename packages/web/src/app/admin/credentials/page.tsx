'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Loader2, Trash2, Eye, EyeOff } from 'lucide-react'
import { authFetch } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function AdminCredentialsPage() {
  const [credentials, setCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ key: '', value: '' })
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    authFetch('/api/admin/credentials').then(d => setCredentials(d.credentials || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.key || !form.value) return
    setSaving(true)
    await authFetch('/api/admin/credentials', { method: 'POST', body: JSON.stringify(form) })
    setSaving(false); setShowModal(false); setForm({ key: '', value: '' }); load()
  }

  async function handleDelete(key: string) {
    if (!confirm(`Remove "${key}"?`)) return
    await authFetch(`/api/admin/credentials/${key}`, { method: 'DELETE' })
    load()
  }

  const LABELS: Record<string, string> = {
    stripe_secret_key: 'Stripe Secret Key',
    stripe_publishable_key: 'Stripe Publishable Key',
    stripe_webhook_secret: 'Stripe Webhook Secret',
    smtp_verifier: 'SMTP Verifier URL',
    crawler_url: 'Crawler URL',
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Credentials</h1>
          <p className="text-sm text-gray-500">Manage API keys and service credentials.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
          <Plus size={16} /> Add Credential
        </button>
      </div>

      <div className="space-y-3">
        {credentials.map((c: any) => (
          <div key={c.key} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-gray-400" />
                <span className="font-medium text-gray-900">{LABELS[c.key] || c.key}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setVisible({ ...visible, [c.key]: !visible[c.key] })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  {visible[c.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => handleDelete(c.key)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-2.5">
              <code className="text-xs font-mono text-gray-600">
                {c.exists ? (visible[c.key] ? '••••••••' : c.value) : 'Not configured'}
              </code>
            </div>
            {c.key === 'stripe_publishable_key' && c.exists && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Stripe configured</p>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Credential">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
            <select value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20">
              <option value="">Select...</option>
              <option value="stripe_secret_key">Stripe Secret Key</option>
              <option value="stripe_publishable_key">Stripe Publishable Key</option>
              <option value="stripe_webhook_secret">Stripe Webhook Secret</option>
              <option value="smtp_verifier">SMTP Verifier URL</option>
              <option value="crawler_url">Crawler URL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <textarea value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="sk_test_..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !form.key || !form.value} className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
