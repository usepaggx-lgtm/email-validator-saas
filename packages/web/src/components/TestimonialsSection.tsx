import { Star } from 'lucide-react'

const testimonials = [
  {
    quote: "We reduced our email bounce rate from 4.2% to 0.3% in the first week. The real-time validation API saved us thousands in wasted email campaign costs.",
    author: 'Sarah Chen',
    role: 'CTO, GrowthEngine',
    avatar: 'SC',
    initials: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  {
    quote: "We integrated the API in under 30 minutes. The documentation is crystal clear and the response times are incredible — consistently under 50ms.",
    author: 'Marcus Rodriguez',
    role: 'Lead Developer, DataFlow',
    avatar: 'MR',
    initials: 'bg-gradient-to-br from-purple-500 to-pink-500',
  },
  {
    quote: "The disposable email detection alone paid for itself. We saw a 60% reduction in fake signups and spam accounts within days of activation.",
    author: 'Emily Watson',
    role: 'VP of Marketing, ScaleUp',
    avatar: 'EW',
    initials: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">
            Loved by developers and marketers alike
          </h2>
          <p className="text-lg text-gray-500">
            Join thousands of teams who trust EmailValidator for their email verification needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card rounded-2xl p-8 card-hover relative">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 leading-relaxed mb-6 text-[15px]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.initials} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
