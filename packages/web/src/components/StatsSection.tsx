'use client'

import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: '500M+', label: 'Emails Validated', suffix: '' },
  { value: '10K+', label: 'Active Customers', suffix: '' },
  { value: '99.9', label: 'Accuracy Rate', suffix: '%' },
  { value: '50', label: 'Avg Response Time', suffix: 'ms' },
]

export default function StatsSection() {
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-4xl sm:text-5xl font-bold text-white mb-1 transition-all duration-1000 ${
                animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: `${i * 150}ms` }}>
                {stat.value}
                <span className="text-blue-200">{stat.suffix}</span>
              </div>
              <div className={`text-sm text-blue-200/80 transition-all duration-1000 delay-300 ${
                animated ? 'opacity-100' : 'opacity-0'
              }`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
