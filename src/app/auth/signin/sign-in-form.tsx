'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

const DEMO_USERS = [
  { email: 'staff@intercare.com',   password: 'gop123', name: 'Insurance Staff', role: 'Insurance Staff', color: '#EFF6FF', textColor: '#1E40AF', icon: 'fas fa-briefcase' },
  { email: 'finance@intercare.com', password: 'gop123', name: 'Finance',          role: 'Finance',         color: '#FDF4FF', textColor: '#7E22CE', icon: 'fas fa-chart-bar' },
  { email: 'doctor@intercare.com',  password: 'gop123', name: 'Doctor',           role: 'Doctor',          color: '#ECFDF5', textColor: '#065F46', icon: 'fas fa-user-md' },
  { email: 'admin@intercare.com',   password: 'gop123', name: 'IT Admin',         role: 'IT Admin',        color: '#FFF7ED', textColor: '#9A3412', icon: 'fas fa-user-shield' },
]

export function SignInForm({ ssoConfigured, demoEnabled }: { ssoConfigured: boolean; demoEnabled: boolean }) {
  const [loading, setLoading]       = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [demoOpen, setDemoOpen]     = useState(false)

  const handleMicrosoft = async () => {
    setLoading('microsoft')
    setError('')
    await signIn('microsoft-entra-id', { callbackUrl: '/' })
  }

  const handleDemoLogin = async (user: typeof DEMO_USERS[0]) => {
    setLoading(user.email)
    setError('')
    const res = await signIn('credentials', { email: user.email, password: user.password, redirect: false })
    if (res?.ok) {
      window.location.href = '/'
    } else {
      setError('Demo login failed. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="auth-card">
      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-icon">I</div>
        <div>
          <div className="auth-logo-name">Intercare</div>
          <div className="auth-logo-sub">GOP Automation System</div>
        </div>
      </div>

      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Sign in to access the GOP pre-authorisation system.</p>

      {/* Microsoft SSO button */}
      <button
        onClick={handleMicrosoft}
        disabled={!ssoConfigured || !!loading}
        className="btn btn-outline btn-full"
        style={{ marginBottom: 'var(--spacing-sm)' }}
      >
        {loading === 'microsoft' ? (
          <i className="fas fa-spinner fa-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
        )}
        {loading === 'microsoft' ? 'Signing in…' : 'Sign in with Microsoft'}
      </button>

{!ssoConfigured && (
        <p className="text-xs text-muted-foreground text-center mb-sm flex items-center justify-center gap-xs">
          <i className="fas fa-info-circle" />
          SSO not configured — use demo accounts below.
        </p>
      )}

      {demoEnabled && (
        <>
          <div className="auth-divider">or use demo account</div>

          {/* Demo toggle */}
          <button
            type="button"
            onClick={() => setDemoOpen(o => !o)}
            className="btn btn-ghost btn-full btn-ghost-dashed justify-between"
            style={{ marginBottom: demoOpen ? 'var(--spacing-md)' : 0 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-flask" />
              Demo mode only — not for production use
            </span>
            <i className={`fas fa-chevron-${demoOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }} />
          </button>

          {demoOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => handleDemoLogin(u)}
                  disabled={!!loading}
                  className="demo-card"
                >
                  {loading === u.email ? (
                    <i className="fas fa-spinner fa-spin demo-card-icon" />
                  ) : (
                    <div className="demo-card-avatar" style={{ background: u.color, color: u.textColor }}>
                      <i className={u.icon} />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <i className="fas fa-arrow-right ml-auto text-xs text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

{error && (
        <div className="alert-banner alert-error mt-sm">
          <i className="fas fa-exclamation-circle flex-shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-xl">
        Intercare Hospital · Phase 1 · Secure Access
      </p>
    </div>
  )
}
