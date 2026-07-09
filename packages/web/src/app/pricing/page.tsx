'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FAQSection from '@/components/FAQSection'
import CTASection from '@/components/CTASection'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/plans`).then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-blue-600" /></div>

  return (
    <>
      <Header />
      <section id="pricing" className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">No hidden fees, no surprise charges.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan: any) => {
              const features = (plan.features || '').split('\n').filter(Boolean)
              const isPopular = plan.slug === 'starter'
              return (
                <div key={plan.slug} className={`relative bg-white rounded-2xl border ${isPopular ? 'border-blue-200 shadow-2xl shadow-blue-500/10 scale-[1.02] lg:scale-105' : 'border-gray-100 shadow-sm'} p-8 card-hover`}>
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-1.5 rounded-full shadow-lg">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">${plan.price_monthly}</span>
                      {plan.price_monthly > 0 && <span className="text-sm text-gray-400">/month</span>}
                    </div>
                    {plan.description && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{plan.description}</p>}
                  </div>
                  <ul className="space-y-3.5 mb-10">
                    {features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                        <Check size={16} className="text-green-500 mt-0.5 shrink-0" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={plan.price_monthly > 0 ? '/dashboard/billing' : '/register'}
                    className={`block w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-all duration-300 ${
                      isPopular ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-xl hover:shadow-blue-500/25'
                      : plan.slug === 'enterprise' ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {plan.price_monthly === 0 ? 'Get Started Free' : plan.slug === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <CTASection />
      <FAQSection />
      <Footer />
    </>
  )
}
