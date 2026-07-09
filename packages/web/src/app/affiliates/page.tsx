'use client'

import { useState, useEffect } from 'react'
import { Gift, Users, DollarSign, TrendingUp, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function AffiliatesPublicPage() {
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({ users: 0, validated: 0 })

  useEffect(() => {
    fetch(`${API}/api/plans`).then(r => r.json()).then(d => setStats({ users: d.plans?.length || 0, validated: 1247 })).catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <section className="pt-32 pb-24 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-8">
            <Gift size={14} className="text-amber-400" />
            <span className="text-sm text-white/80">Affiliate Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">20% recurring</span><br />on every referral
          </h1>
          <p className="text-lg text-white/70 max-w-lg mx-auto mb-10">
            Share EmailValidator with your audience and earn 20% commission every month they stay subscribed.
          </p>
          <a href="/dashboard/affiliate" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-2xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all text-lg">
            Join for Free <ArrowRight size={20} />
          </a>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            {[
              { icon: Gift, title: '20% Recurring', desc: 'Earn 20% every month your referrals stay subscribed. No limits.' },
              { icon: Users, title: 'Automatic', desc: 'Every user gets a referral link automatically. No signup needed.' },
              { icon: DollarSign, title: 'Fast Payouts', desc: 'Withdraw anytime your balance reaches $50. Paid via PayPal.' },
            ].map((f, i) => (
              <div key={i}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <f.icon size={26} className="text-gray-900" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border border-amber-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: 1, title: 'Get your link', desc: 'Every user gets a unique referral link in their dashboard.' },
                { step: 2, title: 'Share it', desc: 'Post on Twitter, LinkedIn, your blog, or email list.' },
                { step: 3, title: 'They sign up', desc: 'Your referral clicks and creates a free account. Cookie lasts 60 days.' },
                { step: 4, title: 'You earn', desc: 'They subscribe → you get 20% recurring. Every single month.' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold mb-3">{s.step}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start earning?</h2>
          <p className="text-gray-500 mb-8">Login to get your referral link and start sharing.</p>
          <a href="/dashboard/affiliate" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            Go to Affiliate Dashboard → <ExternalLink size={16} />
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
