'use client'

import { useSession, signOut } from 'next-auth/react'
import { useSSOConfigStore } from '@/lib/sso-config'

const REQUIRED_GROUPS = ['GOP_Insurance', 'GOP_Finance', 'GOP_Doctor', 'GOP_ITAdmin']

export default function AccessDeniedPage() {
  const { data: session } = useSession()
  const itContactEmail = useSSOConfigStore(s => s.itContactEmail)

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '30rem' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">I</div>
          <div>
            <div className="auth-logo-name">Intercare</div>
            <div className="auth-logo-sub">GOP Automation System</div>
          </div>
        </div>

        {/* Error icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: '9999px',
            background: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
          }}>
            <i className="fas fa-lock" style={{ fontSize: '1.5rem', color: 'var(--destructive)' }} />
          </div>
          <h2 className="auth-title" style={{ textAlign: 'center' }}>Access Denied</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
            You do not have permission to access this system.
          </p>
        </div>

        {session?.user?.email && (
          <div className="alert-banner alert-warning" style={{ marginBottom: '1rem' }}>
            <i className="fas fa-user-circle" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>Signed in as</div>
              <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 2 }}>{session.user.email}</div>
            </div>
          </div>
        )}

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: 'var(--spacing-md)', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Required Azure AD group membership:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {REQUIRED_GROUPS.map(g => (
              <code key={g} style={{
                fontSize: '0.75rem', background: 'var(--secondary)',
                padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                color: 'var(--foreground)', fontFamily: 'var(--font-mono)',
              }}>
                {g}
              </code>
            ))}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
        >
          <i className="fas fa-sign-out-alt" />
          Sign in with a different account
        </button>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', textAlign: 'center' }}>
          Contact IT Admin:{' '}
          <a href={`mailto:${itContactEmail}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
            {itContactEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
