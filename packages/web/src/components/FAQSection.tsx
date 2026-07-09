'use client'

import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

const faqs = [
  {
    q: 'How does email validation work?',
    a: 'Our API checks multiple data points: email syntax format, domain DNS records, MX (mail exchange) server configuration, and compares against our database of disposable email providers. The entire process takes under 100ms and no email is ever sent to the address being validated.',
  },
  {
    q: 'How accurate is your validation?',
    a: 'Our validation achieves 99.5%+ accuracy for detecting invalid, disposable, and role-based email addresses. No service can guarantee 100% accuracy since some email servers intentionally mislead verification attempts for privacy reasons.',
  },
  {
    q: 'Do you store the emails I validate?',
    a: 'No. We take privacy seriously. Email addresses are processed in real-time and are never written to disk or logged. We are fully GDPR, CCPA, and PIPEDA compliant.',
  },
  {
    q: 'What is the difference between single and batch validation?',
    a: 'Single validation checks one email at a time via our REST API with instant results. Batch validation allows you to upload a CSV file with up to 100,000 emails. Results are processed in parallel and available for download as a CSV report.',
  },
  {
    q: 'Can I try the API before purchasing?',
    a: 'Absolutely! Our free plan includes 100 validations per month so you can thoroughly test the API. No credit card required. When you\'re ready, upgrade to a paid plan seamlessly.',
  },
  {
    q: 'What happens if I exceed my monthly limit?',
    a: 'You\'ll receive email notifications at 80% and 100% of your monthly limit. If you exceed the limit, validation requests will return an over-quota error until the next billing cycle or until you upgrade your plan.',
  },
  {
    q: 'Do you support international email addresses?',
    a: 'Yes, our validator supports international email addresses including Unicode characters, internationalized domain names (IDNs), plus addressing (+ tags), and all standard sub-addressing formats across all major email providers.',
  },
  {
    q: 'How do API keys work?',
    a: 'You can generate unlimited API keys from your dashboard. Each key has a name for identification and can be revoked individually. We recommend using separate keys for development, staging, and production environments.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-gray-500 text-lg">
            Everything you need to know about our email validation service.
          </p>
        </div>

        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:border-gray-200"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-gray-900 pr-4 text-[15px]">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? 'max-h-64' : 'max-h-0'
                }`}
              >
                <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No questions found. Try a different search term.</p>
          </div>
        )}
      </div>
    </section>
  )
}
