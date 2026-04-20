'use client'

import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import {
  Building2, AlertTriangle, Stethoscope, Shield, User, Loader2, BarChart3, ChevronDown, ChevronUp,
  ClipboardList, CheckCircle, Lock,
} from 'lucide-react'

// ── Demo account definitions ──────────────────────────────────────────────────

const DEMO_USERS = [
  {
    email:    'staff@intercare.com',
    name:     'Insurance Staff',
    password: 'gop123',
    badge:    'INSURANCE_STAFF',
    badgeBg:  'var(--blue-50)', badgeColor: 'var(--blue-700)',
    iconBg:   'var(--blue-50)', iconColor:  'var(--blue-600)',
    icon:     User,
  },
  {
    email:    'finance@intercare.com',
    name:     'Finance',
    password: 'gop123',
    badge:    'FINANCE',
    badgeBg:  '#ECFDF5', badgeColor: '#065F46',
    iconBg:   '#ECFDF5', iconColor:  '#059669',
    icon:     BarChart3,
  },
  {
    email:    'doctor@intercare.com',
    name:     'Doctor',
    password: 'gop123',
    badge:    'DOCTOR',
    badgeBg:  '#EDE9FF', badgeColor: '#6D28D9',
    iconBg:   '#EDE9FF', iconColor:  '#7C3AED',
    icon:     Stethoscope,
  },
  {
    email:    'admin@intercare.com',
    name:     'IT Admin',
    password: 'gop123',
    badge:    'IT_ADMIN',
    badgeBg:  'var(--gray-100)', badgeColor: 'var(--gray-600)',
    iconBg:   'var(--gray-100)', iconColor:  'var(--gray-500)',
    icon:     Shield,
  },
]

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

export function SignInForm({ ssoConfigured }: { ssoConfigured: boolean }) {
  const [loading,     setLoading]     = useState<string | null>(null)
  const [error,       setError]       = useState('')
  const [demoOpen,    setDemoOpen]    = useState(false)
  const [filledEmail, setFilledEmail] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const handleMicrosoft = async () => {
    setLoading('microsoft')
    setError('')
    await signIn('microsoft-entra-id', { callbackUrl: '/' })
  }

  const handleCardClick = async (user: typeof DEMO_USERS[0]) => {
    setLoading(user.email)
    setError('')
    setFilledEmail(user.email)

    const res = await signIn('credentials', {
      email:    user.email,
      password: user.password,
      redirect: false,
    })

    if (res?.ok) {
      const meRes = await fetch('/api/users/me')
      const me    = meRes.ok ? await meRes.json() : null
      const roleRoutes: Record<string, string> = {
        INSURANCE_STAFF: '/',
        FINANCE:         '/finance',
        DOCTOR:          '/dashboard/doctor',
        IT_ADMIN:        '/gop',
      }
      window.location.href = roleRoutes[me?.role ?? ''] ?? '/'
    } else {
      setError('Demo login failed.')
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel — blue gradient branding */}
      <div style={{
        width: 420, flexShrink: 0,
        background: 'linear-gradient(160deg, #1A4FC4 0%, #2D6BF4 55%, #4A8AFB 100%)',
        padding: '56px 48px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Nexura Care</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>GOP Automation System</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            Streamline<br />Pre-Authorisation
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 48 }}>
            End-to-end GOP request management for<br />Intercare Hospital, powered by AI.
          </p>

          {/* Feature list */}
          {[
            { icon: ClipboardList, text: 'AI-assisted form prefill' },
            { icon: CheckCircle,   text: 'Multi-role verification workflow' },
            { icon: Lock,          text: 'Insurer submission & tracking' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon style={{ width: 15, height: 15, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 'auto' }}>
          © 2026 Intercare Hospital. All rights reserved.
        </p>
      </div>

      {/* Right panel — bg-base with login card */}
      <div style={{
        flex: 1,
        background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
            padding: '36px 36px 32px',
          }}>
            {/* Card header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>
                Welcome back
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 6 }}>
                Sign in to access the GOP system
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--status-rejected-bg)', border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                fontSize: 13, color: 'var(--status-rejected-text)', marginBottom: 16,
              }}>
                <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Microsoft SSO */}
            <div style={{ position: 'relative' }} className="group">
              <button
                onClick={ssoConfigured ? handleMicrosoft : undefined}
                disabled={!ssoConfigured || !!loading}
                style={{
                  width: '100%', padding: '11px',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  background: '#0078D4', color: '#fff',
                  fontSize: 14, fontWeight: 500, cursor: ssoConfigured && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: !ssoConfigured || loading ? 0.6 : 1,
                  transition: 'background 120ms ease',
                }}
                className={ssoConfigured && !loading ? 'hover:bg-[#106EBE]' : ''}
              >
                {loading === 'microsoft'
                  ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                  : <MicrosoftLogo />}
                Sign in with Microsoft
              </button>

              {!ssoConfigured && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginBottom: 8, width: 280,
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)', padding: '8px 12px',
                  fontSize: 11, color: '#92400E', textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  pointerEvents: 'none', zIndex: 10,
                }}
                  className="hidden group-hover:block"
                >
                  Microsoft SSO not configured.<br />
                  Contact IT Admin to set up Azure credentials.
                </div>
              )}
            </div>

            {ssoConfigured && (
              <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 8 }}>
                Use your Intercare Hospital Microsoft account
              </p>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                or use demo account
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            </div>

            {/* Demo collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setDemoOpen(o => !o)}
                style={{
                  width: '100%', padding: '9px 14px',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)', background: 'transparent',
                  fontSize: 12, fontWeight: 500, color: 'var(--gray-500)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                className="hover:bg-[#F8FAFF] transition-colors"
              >
                <span>Demo mode only — not for production use</span>
                {demoOpen
                  ? <ChevronUp  style={{ width: 14, height: 14 }} />
                  : <ChevronDown style={{ width: 14, height: 14 }} />}
              </button>

              {demoOpen && (
                <div style={{ marginTop: 12 }}>
                  {/* 2×2 demo grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {DEMO_USERS.map(u => {
                      const Icon      = u.icon
                      const isLoading = loading === u.email
                      return (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => handleCardClick(u)}
                          disabled={!!loading}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                            padding: 12, textAlign: 'left',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            background: filledEmail === u.email && loading ? 'var(--blue-50)' : 'var(--bg-card)',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading && loading !== u.email ? 0.5 : 1,
                            transition: 'all 120ms ease',
                          }}
                          className="hover:bg-[#F8FAFF] hover:border-[var(--border-medium)]"
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: u.iconBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isLoading
                              ? <Loader2 style={{ width: 13, height: 13, color: u.iconColor, animation: 'spin 1s linear infinite' }} />
                              : <Icon    style={{ width: 13, height: 13, color: u.iconColor }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)', lineHeight: 1 }}>{u.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                              {u.email.split('@')[0]}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 500, padding: '2px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: u.badgeBg, color: u.badgeColor,
                          }}>
                            {u.badge}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <form ref={formRef} style={{ display: 'none' }} aria-hidden>
                    <input name="email"    type="email"    readOnly value={filledEmail} />
                    <input name="password" type="password" readOnly value="gop123" />
                  </form>

                  <p style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'center', marginTop: 10 }}>
                    All demo accounts use password:{' '}
                    <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--gray-100)', padding: '1px 4px', borderRadius: 3 }}>
                      gop123
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
