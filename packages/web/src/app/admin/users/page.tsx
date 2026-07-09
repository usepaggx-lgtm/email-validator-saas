'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2, CheckCircle, XCircle, Search } from 'lucide-react'
import { authFetch } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    Promise.all([
      authFetch('/api/admin/users').then(d => { setUsers(d.users || []); setStats(d) }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{stats.total || users.length} total users · {stats.today_validations || 0} validations today</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-56 pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
            <tbody>{filtered.map((u: any, i: number) => (
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
