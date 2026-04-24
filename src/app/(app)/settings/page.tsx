'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const DOCTOR_EVENTS = [
  { key: 'REQUEST_ASSIGNED',      label: 'Request assigned to you',  description: 'When Insurance Staff assigns a GOP request to you.', mandatory: true },
  { key: 'REQUEST_REASSIGNED',    label: 'Request reassigned',        description: 'When one of your assigned requests is transferred.', mandatory: false },
  { key: 'REQUEST_EXPIRING_SOON', label: 'Request expiring soon',     description: '48 hours before an assigned request expires.', mandatory: false },
]
const STAFF_EVENTS = [
  { key: 'REQUEST_CORRECTION_REQUESTED', label: 'Corrections requested', description: 'When a doctor returns a request for corrections.', mandatory: true },
  { key: 'REQUEST_VERIFIED',             label: 'Request verified',       description: 'When a doctor completes verification.', mandatory: true },
  { key: 'REQUEST_APPROVED',             label: 'Request approved',       description: 'When an insurer approves a GOP request.', mandatory: true },
  { key: 'REQUEST_REJECTED',             label: 'Request rejected',       description: 'When an insurer rejects a GOP request.', mandatory: true },
  { key: 'REQUEST_EXPIRED',              label: 'Request expired',        description: 'When a submitted request passes its expiry window.', mandatory: true },
  { key: 'REQUEST_EXPIRING_SOON',        label: 'Request expiring soon',  description: '48 hours before a request expires.', mandatory: false },
]
const ADMIN_EVENTS = [
  { key: 'REQUEST_CREATED',  label: 'New request created', description: 'When any new GOP request is created.', mandatory: false },
  { key: 'REQUEST_APPROVED', label: 'Request approved',    description: 'Any GOP approval — mandatory for compliance.', mandatory: true },
  { key: 'REQUEST_REJECTED', label: 'Request rejected',    description: 'Any GOP rejection — mandatory for compliance.', mandatory: true },
  { key: 'REQUEST_EXPIRED',  label: 'Request expired',     description: 'When any request auto-expires.', mandatory: false },
  { key: 'USER_CREATED',     label: 'New user created',    description: 'When a new user account is provisioned.', mandatory: false },
]

type Section = 'profile' | 'notifications' | 'insurers' | 'users' | 'system'

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: '2rem', height: '1rem', borderRadius: '9999px', border: '1px solid var(--border)',
        background: checked ? 'var(--primary)' : 'var(--secondary)', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background var(--transition-base)', flexShrink: 0,
        opacity: disabled ? 0.6 : 1, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 1,
        left: checked ? 'calc(100% - 15px)' : 1,
        width: 12, height: 12, borderRadius: '9999px',
        background: 'white', transition: 'left var(--transition-base)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// HIS-style label+value row
function HisRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="his-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6, paddingTop: 6 }}>
      <span className="his-label">{label}</span>
      <div className="his-value">{children}</div>
    </div>
  )
}

function SectionDivider({ title }: { title: string }) {
  return <div className="his-section-title" style={{ marginTop: 8 }}>{title}</div>
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? ''

  const [activeSection, setActiveSection]   = useState<Section>('profile')
  const [displayName, setDisplayName]       = useState(user?.name ?? '')
  const [specialty, setSpecialty]           = useState('')
  const [department, setDepartment]         = useState('')
  const [savingProfile, setSavingProfile]   = useState(false)
  const [preferences, setPreferences]       = useState<Record<string, boolean>>({})
  const [prefLoaded, setPrefLoaded]         = useState(false)
  const [insurers, setInsurers]             = useState<{ id: string; name: string }[]>([])
  const [systemConfig, setSystemConfig]     = useState<Record<string, string>>({})

  const events = role === 'DOCTOR' ? DOCTOR_EVENTS : role === 'IT_ADMIN' ? ADMIN_EVENTS : STAFF_EVENTS

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.ok ? r.json() : [])
      .then((rules: { eventType: string; channel: string; enabled: boolean }[]) => {
        const map: Record<string, boolean> = {}
        rules.forEach(r => { map[r.eventType] = r.enabled })
        events.forEach(e => { if (!(e.key in map)) map[e.key] = true })
        setPreferences(map)
        setPrefLoaded(true)
      })
      .catch(() => setPrefLoaded(true))
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (role === 'IT_ADMIN') {
      fetch('/api/insurers').then(r => r.ok ? r.json() : []).then(setInsurers).catch(() => {})
      fetch('/api/system-config').then(r => r.ok ? r.json() : [])
        .then((rows: { key: string; value: unknown }[]) => {
          const map: Record<string, string> = {}
          rows.forEach(r => { map[r.key] = String(r.value) })
          setSystemConfig(map)
        }).catch(() => {})
    }
  }, [role])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, specialty, department }),
      })
      if (res.ok) toast.success('Profile saved.')
      else toast.error('Failed to save profile.')
    } catch { toast.error('Failed to save profile.') }
    finally { setSavingProfile(false) }
  }

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [eventKey]: enabled }))
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eventKey, channel: 'in-app', enabled }),
      })
    } catch {
      setPreferences(prev => ({ ...prev, [eventKey]: !enabled }))
      toast.error('Failed to update preference.')
    }
  }

  const navItems: { key: Section; label: string; roles?: string[] }[] = (
    [
      { key: 'profile'       as Section, label: 'Profile' },
      { key: 'notifications' as Section, label: 'Notifications' },
      { key: 'insurers'      as Section, label: 'Insurer Config',  roles: ['IT_ADMIN'] },
      { key: 'users'         as Section, label: 'User Management', roles: ['IT_ADMIN'] },
      { key: 'system'        as Section, label: 'System Defaults', roles: ['IT_ADMIN'] },
    ] as { key: Section; label: string; roles?: string[] }[]
  ).filter(n => !n.roles || n.roles.includes(role))

  return (
    <div className="his-page" style={{ height: '100%' }}>
      {/* ── Page header ── */}
      <div className="his-page-header">
        <div>
          <div className="his-page-title">Settings</div>
          <div className="his-page-sub">Account preferences and system configuration</div>
        </div>
      </div>

      {/* ── Settings layout: left nav + content ── */}
      <div className="his-settings-layout" style={{ flex: 1, overflow: 'hidden' }}>

        {/* Left nav */}
        <div className="his-settings-sidebar">
          <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', background: 'var(--primary)', color: 'white' }}>
            <div style={{ padding: '0 14px', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: 0.75 }}>
              Sections
            </div>
          </div>
          {navItems.map(n => (
            <button
              key={n.key}
              className={`his-settings-nav-item${activeSection === n.key ? ' active' : ''}`}
              onClick={() => setActiveSection(n.key)}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="his-settings-content" style={{ overflowY: 'auto' }}>

          {/* ── Profile ── */}
          {activeSection === 'profile' && (
            <div className="his-panel">
              <div className="his-section">
                <SectionDivider title="Profile Information" />
                <div className="his-form">
                  <HisRow label="Display Name">
                    <input
                      className="his-input"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      maxLength={80}
                      style={{ maxWidth: 320 }}
                    />
                  </HisRow>
                  <HisRow label="Email">
                    <span style={{ fontSize: '0.8125rem' }}>{user?.email ?? '—'}</span>
                  </HisRow>
                  <HisRow label="Role">
                    <span className="his-badge" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                      {role}
                    </span>
                  </HisRow>

                  {role === 'DOCTOR' && (
                    <>
                      <SectionDivider title="Clinical Details" />
                      <HisRow label="Specialty">
                        <input
                          className="his-input"
                          value={specialty}
                          onChange={e => setSpecialty(e.target.value)}
                          placeholder="e.g. Cardiology"
                          maxLength={80}
                          style={{ maxWidth: 320 }}
                        />
                      </HisRow>
                      <HisRow label="Department">
                        <input
                          className="his-input"
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          placeholder="e.g. Ward 3A"
                          maxLength={80}
                          style={{ maxWidth: 320 }}
                        />
                      </HisRow>
                      <HisRow label="Digital Signature">
                        <div style={{
                          padding: '6px 10px', background: 'var(--secondary)',
                          border: '1px solid var(--border)', borderRadius: 2,
                          fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: 420,
                        }}>
                          <i className="fas fa-info-circle" style={{ marginRight: 6 }} />
                          Managed by the Hospital Information System. Contact IT Admin to update.
                        </div>
                      </HisRow>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="his-btn his-btn-primary his-btn-lg"
                  >
                    <i className="fas fa-save" style={{ fontSize: '0.75rem' }} />
                    {savingProfile ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </div>

              <div className="his-section" style={{ borderTop: '1px solid var(--border)' }}>
                <SectionDivider title="System Information" />
                <div className="his-form">
                  <HisRow label="Version"><span style={{ fontSize: '0.8125rem' }}>Phase 1 — MVP</span></HisRow>
                  <HisRow label="Hospital"><span style={{ fontSize: '0.8125rem' }}>Intercare Hospital</span></HisRow>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div className="his-panel">
              <div className="his-section">
                <SectionDivider title="In-App Notification Preferences" />
                {!prefLoaded && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', padding: '8px 0' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Loading…
                  </p>
                )}
                {prefLoaded && (
                  <div className="his-table-wrapper">
                    <table className="his-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Description</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Required</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Enabled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(event => (
                          <tr key={event.key}>
                            <td style={{ fontWeight: 500 }}>{event.label}</td>
                            <td style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>{event.description}</td>
                            <td style={{ textAlign: 'center' }}>
                              {event.mandatory
                                ? <span className="his-badge" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: '0.625rem' }}>Required</span>
                                : <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <Toggle
                                checked={event.mandatory ? true : (preferences[event.key] ?? true)}
                                disabled={event.mandatory}
                                onChange={v => !event.mandatory && handleToggle(event.key, v)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Insurer Config (Admin) ── */}
          {activeSection === 'insurers' && role === 'IT_ADMIN' && (
            <div className="his-panel">
              <div className="his-section">
                <SectionDivider title="Insurer Configuration" />
                {insurers.length === 0
                  ? <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>No insurers configured yet.</p>
                  : (
                    <div className="his-table-wrapper">
                      <table className="his-table" style={{ minWidth: 0 }}>
                        <thead><tr><th>Insurer Name</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {insurers.map(ins => (
                            <tr key={ins.id}>
                              <td>{ins.name}</td>
                              <td>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Edit — Phase 2</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* ── User Management (Admin) ── */}
          {activeSection === 'users' && role === 'IT_ADMIN' && (
            <div className="his-panel">
              <div className="his-section">
                <SectionDivider title="User Management" />
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                  User provisioning is managed through Microsoft Entra (Azure AD). Roles are assigned via AAD group membership.
                  Full user management UI is planned for Phase 2.
                </p>
                <div style={{ marginTop: 10 }}>
                  <a href="/admin/users" className="his-btn his-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i className="fas fa-users" style={{ fontSize: '0.75rem' }} />
                    View Current Users
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── System Defaults (Admin) ── */}
          {activeSection === 'system' && role === 'IT_ADMIN' && (
            <div className="his-panel">
              <div className="his-section">
                <SectionDivider title="System Defaults" />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: 10 }}>
                  Read-only in Phase 1 — edit via database or system config API in Phase 2.
                </p>
                <div className="his-form">
                  <HisRow label="Request expiry">
                    <span style={{ fontSize: '0.8125rem' }}>{systemConfig['request_expiry_days'] ?? '30'} days</span>
                  </HisRow>
                  <HisRow label="PDF footer">
                    <span style={{ fontSize: '0.8125rem' }}>{systemConfig['pdf_footer_text'] ?? '—'}</span>
                  </HisRow>
                  <HisRow label="Audit retention">
                    <span style={{ fontSize: '0.8125rem' }}>{systemConfig['audit_log_retention_days'] ?? '730'} days</span>
                  </HisRow>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
