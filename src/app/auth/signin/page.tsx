'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams  = useSearchParams()
  const callbackUrl   = searchParams.get('callbackUrl') ?? '/'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === 'true'

  async function handleMicrosoftSignIn() {
    setLoading(true)
    const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === 'true'
    const destination = isDemoEnabled ? '/auth/role-select' : (callbackUrl ?? '/')
    await signIn('microsoft-entra-id', { callbackUrl: destination })
  }

  async function handleDemoSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password.')
    } else if (result?.url) {
      const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === 'true'
      window.location.href = isDemoEnabled ? '/auth/role-select' : result.url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">

        {/* Hospital branding */}
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-gray-900">Intercare Hospital</div>
          <div className="text-sm text-gray-500 mt-1">GOP Automation System</div>
        </div>

        {/* Microsoft SSO — primary button */}
        <button
          onClick={handleMicrosoftSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0078D4] hover:bg-[#106EBE] text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
            <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {loading ? 'Redirecting...' : 'Sign in with Microsoft'}
        </button>

        {/* Demo credentials — only shown when NEXT_PUBLIC_DEMO_AUTH_ENABLED=true */}
        {isDemoEnabled && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                Demo access only
              </div>
            </div>

            <form onSubmit={handleDemoSignIn} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in with demo account'}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-400 space-y-1 text-center">
              <div>staff@intercare.com · doctor@intercare.com</div>
              <div>finance@intercare.com · admin@intercare.com</div>
              <div className="text-gray-300">Password: gop123</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

