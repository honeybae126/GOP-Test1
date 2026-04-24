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

function SectionCard({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="table-wrapper">
      <div className="card-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className={icon} style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
          <div>
            <div className="card-header-title">{title}</div>
            {sub && <div className="card-header-sub">{sub}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: 'var(--spacing-lg)' }}>{children}</div>
    </div>
  )
}

function KVRow({ label, value, first }: { label: string; value: React.ReactNode; first?: boolean }) {
  return (
    <div className="kv-row" style={{ borderTop: first ? 'none' : undefined }}>
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value}</span>
    </div>
  )
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: '2.5rem', height: '1.25rem', borderRadius: '9999px', border: 'none',
        background: checked ? 'var(--primary)' : 'var(--muted)', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background var(--transition-base)', flexShrink: 0, opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '0.125rem',
        left: checked ? '1.375rem' : '0.125rem',
        width: '1rem', height: '1rem', borderRadius: '9999px',
        background: 'white', transition: 'left var(--transition-base)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? ''

  const [displayName, setDisplayName]     = useState(user?.name ?? '')
  const [specialty, setSpecialty]         = useState('')
  const [department, setDepartment]       = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [preferences, setPreferences]     = useState<Record<string, boolean>>({})
  const [prefLoaded, setPrefLoaded]       = useState(false)
  const [insurers, setInsurers]           = useState<{ id: string; name: string }[]>([])
  const [systemConfig, setSystemConfig]   = useState<Record<string, string>>({})

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
  }, [role])

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

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Settings</h1>
          <p className="header-subtitle">Manage your account and system preferences.</p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', maxWidth: 700 }}>

        {/* Profile */}
        <SectionCard icon="fas fa-user" title="Profile" sub="Your account information.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Display name</label>
              <input
                className="form-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={80}
              />
            </div>
            <KVRow first label="Email" value={user?.email ?? '—'} />
            <KVRow label="Role" value={
              <span className="badge badge-submitted">{role}</span>
            } />

            {role === 'DOCTOR' && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <input className="form-input" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Cardiology" maxLength={80} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Ward 3A" maxLength={80} />
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <i className="fas fa-signature" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Digital Signature</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                    Your signature is stored in the Hospital Information System and is applied automatically when generating verified GOP PDFs.
                    If your signature is missing or needs to be updated, please contact your IT Admin.
                  </p>
                </div>
              </>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              <i className="fas fa-save" />
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon="fas fa-bell" title="Notifications" sub="Choose which events trigger in-app notifications.">
          {!prefLoaded && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)' }}>Loading preferences…</p>}
          {prefLoaded && events.map((event, i) => (
            <div
              key={event.key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                padding: '0.75rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--foreground)' }}>{event.label}</span>
                  {event.mandatory && <span className="badge badge-draft" style={{ fontSize: '0.625rem' }}>Required</span>}
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>{event.description}</p>
              </div>
              <Toggle
                checked={event.mandatory ? true : (preferences[event.key] ?? true)}
                disabled={event.mandatory}
                onChange={(v) => !event.mandatory && handleToggle(event.key, v)}
              />
            </div>
          ))}
        </SectionCard>

        {/* Admin: Insurer Config */}
        {role === 'IT_ADMIN' && (
          <SectionCard icon="fas fa-building" title="Insurer Configuration" sub="Active insurers configured in the system.">
            {insurers.length === 0
              ? <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)' }}>No insurers configured yet.</p>
              : insurers.map((ins, i) => (
                <div key={ins.id} className="kv-row" style={{ borderTop: i > 0 ? undefined : 'none' }}>
                  <span className="kv-value">{ins.name}</span>
                  <span className="badge badge-routine" style={{ fontSize: '0.625rem' }}>Edit — Phase 2</span>
                </div>
              ))
            }
          </SectionCard>
        )}

        {/* Admin: System Defaults */}
        {role === 'IT_ADMIN' && (
          <SectionCard icon="fas fa-sliders-h" title="System Defaults" sub="Global configuration values. Edit via database in Phase 2.">
            <KVRow first label="Request expiry window" value={`${systemConfig['request_expiry_days'] ?? '30'} days`} />
            <KVRow label="PDF footer text" value={systemConfig['pdf_footer_text'] ?? '—'} />
            <KVRow label="Audit log retention" value={`${systemConfig['audit_log_retention_days'] ?? '730'} days`} />
          </SectionCard>
        )}

        {/* System info */}
        <SectionCard icon="fas fa-shield-alt" title="System">
          <KVRow first label="Version" value="Phase 1 — MVP" />
          <KVRow label="Hospital" value="Intercare Hospital" />
        </SectionCard>

      </div>
    </div>
  )
}
