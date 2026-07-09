import { Mail, Globe, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    icon: Mail,
    title: 'Submit Your Email',
    description: 'Pass any email address to our API via cURL, SDK, or dashboard. No complex setup required.',
    color: 'from-blue-500 to-indigo-500',
    highlight: 'bg-blue-50 border-blue-100',
    number: 'bg-blue-600',
  },
  {
    icon: Globe,
    title: 'Deep Verification Engine',
    description: 'Our engine checks syntax, DNS records, MX servers, disposable patterns, and role-based accounts in under 100ms.',
    color: 'from-purple-500 to-pink-500',
    highlight: 'bg-purple-50 border-purple-100',
    number: 'bg-purple-600',
  },
  {
    icon: CheckCircle,
    title: 'Get Actionable Results',
    description: 'Receive a clear valid/invalid status with detailed breakdown. Download reports or integrate via webhooks.',
    color: 'from-emerald-500 to-teal-500',
    highlight: 'bg-emerald-50 border-emerald-100',
    number: 'bg-emerald-600',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">
            Email validation in 3 simple steps
          </h2>
          <p className="text-lg text-gray-500">
            From submission to result in milliseconds. No credit card required to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className={`rounded-2xl border p-8 ${step.highlight} card-hover h-full`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <step.icon size={26} className="text-white" />
                  </div>
                  <div className={`w-8 h-8 rounded-full ${step.number} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            Try it now — validate your first email free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
