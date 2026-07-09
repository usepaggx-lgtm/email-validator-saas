export default function TrustBar() {
  const logos = [
    { name: 'Stripe', color: 'from-blue-500 to-indigo-500' },
    { name: 'Shopify', color: 'from-green-500 to-emerald-500' },
    { name: 'Slack', color: 'from-purple-500 to-pink-500' },
    { name: 'Notion', color: 'from-gray-700 to-gray-900' },
    { name: 'Figma', color: 'from-orange-500 to-red-500' },
    { name: 'Vercel', color: 'from-gray-800 to-black' },
  ]

  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-gray-400 mb-8 tracking-wide uppercase">
          Trusted by engineering teams at
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${logo.color} flex items-center justify-center`}>
                <span className="text-white font-bold text-xs">{logo.name[0]}</span>
              </div>
              <span className="font-bold text-gray-400 text-sm">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
