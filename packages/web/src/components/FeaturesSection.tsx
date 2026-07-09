'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Shield, Zap, Globe, BarChart3, Upload, RefreshCw,
  FileText, Cog, Users, Lock, Server, TrendingUp,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Real-Time Validation',
    description: 'Validate emails in under 100ms with our globally distributed edge network. Syntax, MX, and DNS checks in a single API call.',
    color: 'from-blue-500 to-cyan-500',
    stat: '<100ms',
    statLabel: 'avg response',
  },
  {
    icon: Globe,
    title: 'DNS & MX Verification',
    description: 'Performs deep DNS lookups to verify domain existence and mail exchange records. Catches non-existent domains before they bounce.',
    color: 'from-purple-500 to-pink-500',
    stat: '99.9%',
    statLabel: 'uptime SLA',
  },
  {
    icon: Shield,
    title: 'Disposable Email Detection',
    description: 'Comprehensive database of 5,000+ known disposable email providers. Block temporary addresses and reduce fraud at signup.',
    color: 'from-amber-500 to-orange-500',
    stat: '5,000+',
    statLabel: 'known providers',
  },
  {
    icon: BarChart3,
    title: 'Role-Based Detection',
    description: 'Automatically flag role-based accounts (admin@, support@, info@). Perfect for B2B lead scoring and list segmentation.',
    color: 'from-emerald-500 to-teal-500',
    stat: '30+',
    statLabel: 'role patterns',
  },
  {
    icon: Upload,
    title: 'Bulk CSV Processing',
    description: 'Upload CSV files with up to 100,000 emails. Drag-and-drop interface with real-time progress and downloadable reports.',
    color: 'from-red-500 to-rose-500',
    stat: '100K',
    statLabel: 'per batch',
  },
  {
    icon: FileText,
    title: 'Detailed Reports',
    description: 'Every validation comes with a comprehensive breakdown: syntax, domain, MX, disposable status, role detection, alias info, and typo suggestions.',
    color: 'from-indigo-500 to-violet-500',
    stat: '8+',
    statLabel: 'data points per email',
  },
  {
    icon: Key,
    title: 'API Key Management',
    description: 'Generate unlimited API keys with granular permissions. Monitor usage, revoke keys, and track consumption in real-time.',
    color: 'from-sky-500 to-blue-500',
    stat: 'Unlimited',
    statLabel: 'API keys',
  },
  {
    icon: Server,
    title: 'Enterprise Infrastructure',
    description: 'Built on Cloudflare Workers global network. Automatic scaling, DDoS protection, and 99.9% uptime guarantee included.',
    color: 'from-green-500 to-emerald-500',
    stat: '300+',
    statLabel: 'edge locations',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">
            Enterprise-grade email validation
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to clean your email lists and protect your sender reputation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 rounded-3xl overflow-hidden mt-12">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white p-8 card-hover relative group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                <feature.icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{feature.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-900 text-lg">{feature.stat}</span>
                <span className="text-gray-400">{feature.statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Key(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4a5 5 0 1 1-4 7.5V20l-2-2-2 2-2-2-2 2V11.5A5 5 0 0 1 9 4h6z"/><circle cx="12" cy="8" r="1"/></svg> }
