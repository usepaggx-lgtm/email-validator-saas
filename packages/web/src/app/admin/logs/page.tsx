'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/utils'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/history').then(d => {
      setLogs(d.history || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Recent Activity</h1>
        <p className="text-sm text-gray-500">Latest validations across the system.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Source</th>
              <th className="px-4 py-3 font-medium text-gray-500">Time</th>
            </tr></thead>
            <tbody>{logs.map((r: any, i: number) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'VALID' ? 'bg-green-50 text-green-700' : r.status === 'DISPOSABLE' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.source || 'Dashboard'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}
