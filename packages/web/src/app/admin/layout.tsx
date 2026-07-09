'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Shield, Users, BarChart3, Activity, ArrowLeft, LogOut, Loader2, TrendingUp, DollarSign, ToggleLeft, CreditCard, Key, Gift } from 'lucide-react'
import { getUser, clearToken } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

const adminNavItems = [
  { label: 'Overview', icon: BarChart3, href: '/admin', key: 'admin' },
  { label: 'Metrics', icon: TrendingUp, href: '/admin/metrics', key: 'admin-metrics' },
  { label: 'Finances', icon: DollarSign, href: '/admin/finances', key: 'admin-finances' },
  { label: 'Plans', icon: CreditCard, href: '/admin/plans', key: 'admin-plans' },
  { label: 'Modules', icon: ToggleLeft, href: '/admin/modules', key: 'admin-modules' },
  { label: 'Credentials', icon: Key, href: '/admin/credentials', key: 'admin-credentials' },
  { label: 'Affiliates', icon: Gift, href: '/admin/affiliates', key: 'admin-affiliates' },
  { label: 'Users', icon: Users, href: '/admin/users', key: 'admin-users' },
  { label: 'Logs', icon: Activity, href: '/admin/logs', key: 'admin-logs' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    if (!u.is_admin) { router.push('/dashboard'); return }
    setUser(u)
    setLoading(false)
  }, [])

  function logout() { clearToken(); router.push('/login') }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
  if (!user) return null

  const activeKey = pathname.split('/').pop() || 'admin'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">System management</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {adminNavItems.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeKey === item.key ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all">
            <ArrowLeft size={16} /> Dashboard
          </a>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-purple-500" />
              <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2.5 py-1 rounded-full">Admin</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
