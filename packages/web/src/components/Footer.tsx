import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">EV</span>
              </div>
              <span className="font-bold text-xl text-white">EmailValidator</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enterprise-grade email validation API. Clean your email lists with 99.9% accuracy.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sm hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/#api" className="text-sm hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-gray-500">About</span></li>
              <li><span className="text-sm text-gray-500">Blog</span></li>
              <li><span className="text-sm text-gray-500">Careers</span></li>
              <li><span className="text-sm text-gray-500">Contact</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-gray-500">Privacy Policy</span></li>
              <li><span className="text-sm text-gray-500">Terms of Service</span></li>
              <li><span className="text-sm text-gray-500">GDPR Compliance</span></li>
              <li><span className="text-sm text-gray-500">SLA</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} EmailValidator. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Status: All Systems Operational</span>
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
          </div>
        </div>
      </div>
    </footer>
  )
}
