'use client'

import { useState, useEffect } from 'react'
import { ToggleLeft, ToggleRight, Search, Loader2, Globe, User } from 'lucide-react'
import { authFetch } from '@/lib/utils'

const MODULE_LABELS: Record<string, string> = {
  validate: 'Validate', lists: 'Lists', finder: 'Email Finder',
  enricher: 'Email Enricher', history: 'History', api_keys: 'API Keys', billing: 'Billing',
  whatsapp: 'WhatsApp',
}

export default function AdminModulesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  function load() {
    setLoading(true)
    authFetch('/api/admin/modules').then(setData).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function toggleGlobal(module: string, current: number) {
    await authFetch('/api/admin/modules/toggle', {
      method: 'POST', body: JSON.stringify({ module, enabled: !current }),
    })
    load()
  }

  async function toggleUser(userId: string, module: string, current: number | null) {
    const newEnabled = current === 1 ? null : 1
    await authFetch('/api/admin/modules/user-toggle', {
      method: 'POST', body: JSON.stringify({ user_id: userId, module, enabled: newEnabled }),
    })
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  const modules = data?.modules || []
  const users = (data?.users || []).filter((u: any) =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.name?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Modules</h1>
          <p className="text-sm text-gray-500">Enable or disable features globally or per user.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe size={16} className="text-gray-400" /> Global Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {modules.map((m: any) => (
            <button key={m.module} onClick={() => toggleGlobal(m.module, m.enabled)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${
                m.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
              <span className={`font-medium ${m.enabled ? 'text-green-800' : 'text-gray-500'}`}>{MODULE_LABELS[m.module] || m.module}</span>
              {m.enabled ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><User size={16} className="text-gray-400" /> Per-User Overrides</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search user..."
              className="w-48 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
          </div>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-3 py-2.5 font-medium text-gray-500">User</th>
                {modules.map((m: any) => (
                  <th key={m.module} className="px-2 py-2.5 font-medium text-gray-500 text-center text-[10px] uppercase">{MODULE_LABELS[m.module]?.slice(0, 4)}</th>
                ))}
              </tr></thead>
              <tbody>{users.map((u: any) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[180px] truncate">{u.email}</td>
                  {modules.map((m: any) => {
                    const override = u.overrides?.[m.module]
                    const effective = override !== undefined ? override : m.enabled
                    const isOverridden = override !== undefined
                    return (
                      <td key={m.module} className="px-2 py-2.5 text-center">
                        <button onClick={() => toggleUser(u.id, m.module, override ?? null)}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                            effective ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                          } ${isOverridden ? 'ring-2 ring-purple-300' : ''}`}
                          title={isOverridden ? `Overridden: ${effective ? 'ON' : 'OFF'}` : `Global: ${effective ? 'ON' : 'OFF'}`}>
                          {effective ? 'ON' : 'OFF'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
