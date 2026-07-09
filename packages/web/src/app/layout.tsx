import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EmailValidator - Enterprise Email Verification & Validation API',
  description:
    'Validate email addresses in real-time. Check syntax, MX records, disposable emails, and more. Trusted by thousands of businesses worldwide.',
  openGraph: {
    title: 'EmailValidator - Email Verification API',
    description: 'Enterprise-grade email validation. Clean your email lists with 99.9% accuracy.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
