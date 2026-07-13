'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Mail, Activity, Key, CreditCard, BarChart3, LogOut, Sparkles, Loader2, List, Bell, User, Settings, Camera, Search, UserPlus, Shield, Gift, MessageCircle, Database, Coins } from 'lucide-react'
import { getUser, clearToken, authFetch } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [navItems, setNavItems] = useState([
    { label: 'Dashboard', icon: BarChart3, href: '/dashboard', key: 'dashboard' },
    { label: 'Validate', icon: Mail, href: '/dashboard/validate', key: 'validate' },
    { label: 'Lists', icon: List, href: '/dashboard/lists', key: 'lists' },
    { label: 'Email Finder', icon: Search, href: '/dashboard/finder', key: 'finder' },
    { label: 'Email Enricher', icon: UserPlus, href: '/dashboard/enricher', key: 'enricher' },
    { label: 'Consultas', icon: Database, href: '/dashboard/consultas', key: 'consultas' },
    { label: 'WhatsApp', icon: MessageCircle, href: '/dashboard/whatsapp', key: 'whatsapp' },
    { label: 'Affiliates', icon: Gift, href: '/dashboard/affiliate', key: 'affiliate' },
    { label: 'History', icon: Activity, href: '/dashboard/history', key: 'history' },
    { label: 'API Keys', icon: Key, href: '/dashboard/api-keys', key: 'api-keys' },
    { label: 'Billing', icon: CreditCard, href: '/dashboard/billing', key: 'billing' },
    { label: 'Créditos', icon: Coins, href: '/dashboard/credits', key: 'credits' },
  ])
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
    if (u.id) setAvatarUrl(`${API}/api/auth/avatar/${u.id}?_t=${Date.now()}`)
    authFetch('/api/modules').then(data => {
      if (data.modules) {
        setNavItems(prev => prev.filter(item => item.key === 'dashboard' || data.modules[item.key] !== false))
      }
    }).catch(() => {})
    setLoading(false)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function logout() { clearToken(); router.push('/login') }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-blue-600" />
    </div>
  )
  if (!user) return null

  const activeKey = pathname.split('/').pop() || 'dashboard'

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">EmailValidator</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeKey === item.key ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <div className="relative" ref={avatarRef}>
                <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarUrl('')} />
                    ) : (
                      user.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-1.5 z-50">
                    <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => { setAvatarMenuOpen(false); router.push('/dashboard/profile') }}>
                      <User size={16} className="text-gray-400" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => { setAvatarMenuOpen(false); router.push('/dashboard/settings') }}>
                      <Settings size={16} className="text-gray-400" /> Settings
                    </button>
                    {user?.is_admin && (
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                        onClick={() => { setAvatarMenuOpen(false); router.push('/admin') }}>
                        <Shield size={16} className="text-purple-500" /> Admin Panel
                      </button>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
