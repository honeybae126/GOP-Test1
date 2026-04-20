'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, User, Bell, Shield, Building2, Sliders } from 'lucide-react'
import { toast } from 'sonner'

// ── Notification event definitions per role ──────────────────────────────────

const DOCTOR_EVENTS = [
  { key: 'REQUEST_ASSIGNED',       label: 'Request assigned to you', description: 'When Insurance Staff assigns a GOP request to you.', mandatory: true },
  { key: 'REQUEST_REASSIGNED',     label: 'Request reassigned',       description: 'When one of your assigned requests is transferred.', mandatory: false },
  { key: 'REQUEST_EXPIRING_SOON',  label: 'Request expiring soon',    description: '48 hours before an assigned request expires.', mandatory: false },
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

// ── Card primitive ────────────────────────────────────────────────────────────

function SectionCard({ icon, title, sub, children }: {
  icon: React.ReactNode
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{title}</span>
        </div>
        {sub && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>{sub}</p>}
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  )
}

function KVRow({ label, value, first }: { label: string; value: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 0',
      borderTop: first ? undefined : '1px solid var(--border-light)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{value}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? ''

  const [displayName, setDisplayName]   = useState(user?.name ?? '')
  const [specialty, setSpecialty]       = useState('')
  const [department, setDepartment]     = useState('')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [preferences, setPreferences] = useState<Record<string, boolean>>({})
  const [prefLoaded, setPrefLoaded]   = useState(false)

  const [insurers, setInsurers]         = useState<{ id: string; name: string }[]>([])
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({})

  const events =
    role === 'DOCTOR'  ? DOCTOR_EVENTS :
    role === 'IT_ADMIN' ? ADMIN_EVENTS :
    STAFF_EVENTS

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
      fetch('/api/system-config').then(r => r.ok ? r.json() : []).then((rows: { key: string; value: unknown }[]) => {
        const map: Record<string, string> = {}
        rows.forEach(r => { map[r.key] = String(r.value) })
        setSystemConfig(map)
      }).catch(() => {})
    }
  }, [role])

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.includes('png')) { toast.error('Only PNG files are accepted for digital signatures.'); return }
    if (file.size > 500 * 1024) { toast.error('Signature file must be under 500 KB.'); return }
    setSignatureFile(file)
    setSignaturePreview(URL.createObjectURL(file))
  }

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
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Manage your account and system preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

        {/* Profile */}
        <SectionCard
          icon={<User style={{ width: 15, height: 15, color: 'var(--gray-400)' }} />}
          title="Profile"
          sub="Your account information."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} />
            </div>
            <KVRow first label="Email" value={user?.email ?? '—'} />
            <KVRow label="Role" value={
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--blue-50)', color: 'var(--blue-700)',
                border: '1px solid var(--blue-200)',
              }}>{role}</span>
            } />

            {role === 'DOCTOR' && (
              <>
                <div style={{ height: 1, background: 'var(--border-light)' }} />
                <div className="space-y-1.5">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Cardiology" maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Ward 3A" maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label>Digital signature</Label>
                  <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>PNG only · max 500 KB · embedded in verified GOP PDFs.</p>
                  <Input type="file" accept=".png" onChange={handleSignatureChange} className="cursor-pointer" />
                  {signaturePreview && (
                    <div style={{ marginTop: 8, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 12, background: '#fff' }}>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 6 }}>Preview</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={signaturePreview} alt="Signature preview" style={{ maxHeight: 64, objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </>
            )}

            <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm" style={{ alignSelf: 'flex-start' }}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={<Bell style={{ width: 15, height: 15, color: 'var(--gray-400)' }} />}
          title="Notifications"
          sub="Choose which events trigger in-app notifications."
        >
          {!prefLoaded && <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Loading preferences…</p>}
          {prefLoaded && events.map((event, i) => (
            <div key={event.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              padding: '12px 0',
              borderTop: i > 0 ? '1px solid var(--border-light)' : undefined,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{event.label}</span>
                  {event.mandatory && (
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--gray-100)', color: 'var(--gray-500)',
                    }}>Required</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{event.description}</p>
              </div>
              <Switch
                checked={event.mandatory ? true : (preferences[event.key] ?? true)}
                disabled={event.mandatory}
                onCheckedChange={(checked) => !event.mandatory && handleToggle(event.key, checked)}
              />
            </div>
          ))}
        </SectionCard>

        {/* Admin: Insurer Config */}
        {role === 'IT_ADMIN' && (
          <SectionCard
            icon={<Building2 style={{ width: 15, height: 15, color: 'var(--gray-400)' }} />}
            title="Insurer Configuration"
            sub="Active insurers configured in the system."
          >
            {insurers.length === 0 && <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No insurers configured yet.</p>}
            {insurers.map((ins, i) => (
              <div key={ins.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', fontSize: 13,
                borderTop: i > 0 ? '1px solid var(--border-light)' : undefined,
              }}>
                <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{ins.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--gray-100)', color: 'var(--gray-500)',
                  border: '1px solid var(--border-medium)',
                }}>Edit — Phase 2</span>
              </div>
            ))}
          </SectionCard>
        )}

        {/* Admin: System Defaults */}
        {role === 'IT_ADMIN' && (
          <SectionCard
            icon={<Sliders style={{ width: 15, height: 15, color: 'var(--gray-400)' }} />}
            title="System Defaults"
            sub="Global configuration values. Edit via database in Phase 2."
          >
            <KVRow first label="Request expiry window" value={`${systemConfig['request_expiry_days'] ?? '30'} days`} />
            <KVRow label="PDF footer text" value={systemConfig['pdf_footer_text'] ?? '—'} />
            <KVRow label="Audit log retention" value={`${systemConfig['audit_log_retention_days'] ?? '730'} days`} />
          </SectionCard>
        )}

        {/* System info */}
        <SectionCard
          icon={<Shield style={{ width: 15, height: 15, color: 'var(--gray-400)' }} />}
          title="System"
        >
          <KVRow first label="Version" value="Phase 1 — MVP" />
          <KVRow label="Hospital" value="Intercare Hospital" />
        </SectionCard>

      </div>
    </div>
  )
}
