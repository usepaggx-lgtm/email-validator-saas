'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-sm border-b border-gray-200/60'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors duration-500 ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}>
              EmailValidator
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'API', 'FAQ'].map(item => (
              <a
                key={item}
                href={`/#${item.toLowerCase()}`}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  scrolled
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              Get Started Free
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
              scrolled ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
            }`}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-5 border-t border-gray-100 bg-white rounded-b-2xl shadow-xl">
            <nav className="flex flex-col gap-1 pt-4 px-2">
              {['Features', 'Pricing', 'API', 'FAQ'].map(item => (
                <a key={item} href={`/#${item.toLowerCase()}`} className="px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  {item}
                </a>
              ))}
              <hr className="my-2 border-gray-100" />
              <Link href="/login" className="px-4 py-2.5 text-sm font-medium text-blue-600 rounded-xl hover:bg-blue-50">
                Sign In
              </Link>
              <Link href="/dashboard" className="mx-2 mt-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-xl text-center">
                Get Started Free
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
