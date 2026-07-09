'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const codeExamples = {
  curl: `curl -X POST https://api.emailvalidator.dev/validate \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -d '{"email": "user@example.com"}'`,
  python: `import requests

response = requests.post(
    "https://api.emailvalidator.dev/validate",
    headers={
        "Content-Type": "application/json",
        "X-Api-Key": "YOUR_API_KEY"
    },
    json={"email": "user@example.com"}
)

data = response.json()
print(data["status"])  # "VALID"`,
  javascript: `const response = await fetch(
  "https://api.emailvalidator.dev/validate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": "YOUR_API_KEY"
    },
    body: JSON.stringify({
      email: "user@example.com"
    })
  }
);

const data = await response.json();
console.log(data.status); // "VALID"`,
}

const tabs = ['curl', 'Python', 'JavaScript']

export default function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState('curl')
  const [copied, setCopied] = useState(false)

  const code = codeExamples[activeTab as keyof typeof codeExamples]

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="api" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">API</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-4">
            Developer-first API design
          </h2>
          <p className="text-lg text-gray-500">
            One endpoint. Any language. Get results in milliseconds.
          </p>
        </div>

        <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/20">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-500 font-mono">POST /validate</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg p-0.5">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors z-10"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <pre className="p-6 text-sm text-gray-300 font-mono overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span>All plans include API access. Rate limits vary by tier.</span>
        </div>
      </div>
    </section>
  )
}
