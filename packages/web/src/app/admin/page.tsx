'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Mail, Key, Activity, BarChart3, TrendingUp, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { authFetch } from '@/lib/utils'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authFetch('/api/admin/stats').then(setStats).catch(() => {}),
      authFetch('/api/admin/users').then(d => { setUsers(d.users || []); setStats((prev: any) => ({ ...prev, ...d })) }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Users', value: stats.users?.toLocaleString() || '—', icon: Users },
            { label: 'Validations', value: stats.validations?.toLocaleString() || '—', icon: Activity },
            { label: "Today", value: stats.today?.toLocaleString() || '—', icon: TrendingUp },
            { label: 'API Keys', value: stats.api_keys?.toLocaleString() || '—', icon: Key },
            { label: 'Lists', value: stats.lists?.toLocaleString() || '—', icon: BarChart3 },
            { label: 'Contacts', value: (stats.contacts || 0).toLocaleString(), icon: Mail },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                <card.icon size={16} className="text-gray-300" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {stats?.plans && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Plans</h3>
            <div className="space-y-2">
              {stats.plans.map((p: any) => {
                const max = Math.max(...stats.plans.map((x: any) => x.count))
                return (
                  <div key={p.plan} className="flex items-center gap-3 text-sm">
                    <span className="w-20 font-medium text-gray-700 capitalize">{p.plan}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${p.count / max * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-medium text-gray-600">{p.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {stats?.top_domains && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Domains</h3>
            <div className="space-y-1.5">
              {stats.top_domains.slice(0, 8).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-6 text-gray-400 font-mono">#{i + 1}</span>
                  <span className="flex-1 font-mono truncate">{d.domain}</span>
                  <span className="font-medium">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-500">Validations</th>
              <th className="px-4 py-3 font-medium text-gray-500">Admin</th>
              <th className="px-4 py-3 font-medium text-gray-500">Created</th>
            </tr></thead>
            <tbody>{users.slice(0, 20).map((u: any, i: number) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{u.email}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{u.name}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.plan === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>{u.plan}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600">{u.validations_total || 0}</td>
                <td className="px-4 py-3">{u.is_admin ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-300" />}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}
