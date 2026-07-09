'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Activity, BarChart3, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { authFetch } from '@/lib/utils'

export default function AdminMetricsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/admin/metrics').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
  if (!data) return null

  const { growth, financial, usage } = data
  const maxValGrowth = Math.max(...(growth.user_growth_daily || []).map((d: any) => d.count), 1)
  const maxValValidations = Math.max(...(growth.validation_growth_daily || []).map((d: any) => d.count), 1)

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Startup Metrics</h1>
      <p className="text-sm text-gray-500 mb-6">Growth, financial, and usage performance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'MRR', value: `$${financial.mrr?.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', sub: `${financial.paying_users} paying` },
          { label: 'Conversion', value: `${financial.conversion_rate || 0}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'free → paid' },
          { label: 'ARPU', value: `$${financial.arpu || '0'}`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'avg per user' },
          { label: 'Active Users', value: `${usage.active_users_30d || 0}`, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', sub: 'last 30 days' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.sub && <span className="text-xs text-gray-400">{card.sub}</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">User Growth (30d)</h3>
          {growth.user_growth_daily?.length > 0 ? (
            <div className="space-y-1">
              {growth.user_growth_daily.map((d: any) => (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-500 shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${d.count / maxValGrowth * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-gray-700">{d.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Total: <strong className="text-gray-900">{growth.total_users}</strong></span>
            <span>New this month: <strong className="text-gray-900">{growth.new_this_month}</strong></span>
            <span>Today: <strong className="text-gray-900">{growth.new_today}</strong></span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Validations (30d)</h3>
          {growth.validation_growth_daily?.length > 0 ? (
            <div className="space-y-1">
              {growth.validation_growth_daily.map((d: any) => (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-500 shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${d.count / maxValValidations * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-gray-700">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Total: <strong className="text-gray-900">{growth.total_validations?.toLocaleString()}</strong></span>
            <span>This month: <strong className="text-gray-900">{growth.validations_this_month?.toLocaleString()}</strong></span>
            <span>Today: <strong className="text-gray-900">{growth.validations_today?.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue Breakdown</h3>
          {financial.plan_distribution?.length > 0 ? (
            <div className="space-y-3">
              {financial.plan_distribution.map((p: any) => {
                const revenue = (financial.price_per_plan?.[p.plan] || 0) * p.count
                const maxRevenue = Math.max(...financial.plan_distribution.map((x: any) => (financial.price_per_plan?.[x.plan] || 0) * x.count), 1)
                return (
                  <div key={p.plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{p.plan}</span>
                      <span className="text-gray-900 font-medium">${revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1 items-center text-xs text-gray-500 mb-1">
                      <span>{p.count} users</span>
                      <span>·</span>
                      <span>${financial.price_per_plan?.[p.plan] || 0}/mo</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.plan === 'free' ? 'bg-gray-300' : p.plan === 'starter' ? 'bg-blue-500' : p.plan === 'pro' ? 'bg-purple-500' : 'bg-emerald-500'}`}
                        style={{ width: `${revenue / maxRevenue * 100}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-900">Total MRR</span>
                  <span className="text-green-600">${financial.mrr?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No revenue data</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active users (30d)</span>
                <span className="font-medium">{usage.active_users_30d}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: `${Math.min(usage.active_users_30d / Math.max(growth.total_users, 1) * 100, 100)}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{Math.round(usage.active_users_30d / Math.max(growth.total_users, 1) * 100)}% of total users</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">API Keys</p>
                <p className="text-lg font-bold text-gray-900">{usage.api_keys}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Lists</p>
                <p className="text-lg font-bold text-gray-900">{usage.lists}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Contacts</p>
                <p className="text-lg font-bold text-gray-900">{usage.contacts?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Upgrades</p>
                <p className="text-lg font-bold text-gray-900">{financial.total_upgrades}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Distribution</h3>
          {financial.plan_distribution?.length > 0 ? (
            <div className="space-y-3">
              {financial.plan_distribution.map((p: any) => {
                const maxUsers = Math.max(...financial.plan_distribution.map((x: any) => x.count), 1)
                return (
                  <div key={p.plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{p.plan}</span>
                      <span className="text-gray-900 font-medium">{p.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.plan === 'free' ? 'bg-gray-400' : p.plan === 'starter' ? 'bg-blue-500' : p.plan === 'pro' ? 'bg-purple-500' : 'bg-emerald-500'}`}
                        style={{ width: `${p.count / maxUsers * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data</p>}
        </div>
      </div>
    </>
  )
}
