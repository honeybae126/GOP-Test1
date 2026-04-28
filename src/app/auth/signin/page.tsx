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
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Hospital branding */}
        <div className="auth-logo" style={{ justifyContent: 'center' }}>
          <div className="auth-logo-icon">I</div>
          <div style={{ textAlign: 'center' }}>
            <div className="auth-logo-name">Intercare Hospital</div>
            <div className="auth-logo-sub">GOP Automation System</div>
          </div>
        </div>

        {/* Microsoft SSO — primary button */}
        <button
          onClick={handleMicrosoftSignIn}
          disabled={loading}
          className="btn btn-outline btn-full"
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
            <div className="auth-divider">Demo access only</div>

            <form onSubmit={handleDemoSignIn} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Signing in...' : 'Sign in with demo account'}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-400 space-y-1 text-center">
              <div>staff@intercare.com · doctor@intercare.com</div>
              <div>finance@intercare.com · admin@intercare.com</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

