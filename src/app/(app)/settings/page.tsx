'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, User, Bell, Shield, Building2, Sliders } from 'lucide-react'
import { toast } from 'sonner'

// ── Notification event definitions per role ─────────────────────────────────

const DOCTOR_EVENTS = [
  { key: 'REQUEST_ASSIGNED', label: 'Request assigned to you', description: 'When Insurance Staff assigns a GOP request to you.', mandatory: true },
  { key: 'REQUEST_REASSIGNED', label: 'Request reassigned', description: 'When one of your assigned requests is transferred.', mandatory: false },
  { key: 'REQUEST_EXPIRING_SOON', label: 'Request expiring soon', description: '48 hours before an assigned request expires.', mandatory: false },
]

const STAFF_EVENTS = [
  { key: 'REQUEST_CORRECTION_REQUESTED', label: 'Corrections requested', description: 'When a doctor returns a request for corrections.', mandatory: true },
  { key: 'REQUEST_VERIFIED', label: 'Request verified', description: 'When a doctor completes verification.', mandatory: true },
  { key: 'REQUEST_APPROVED', label: 'Request approved', description: 'When an insurer approves a GOP request.', mandatory: true },
  { key: 'REQUEST_REJECTED', label: 'Request rejected', description: 'When an insurer rejects a GOP request.', mandatory: true },
  { key: 'REQUEST_EXPIRED', label: 'Request expired', description: 'When a submitted request passes its expiry window.', mandatory: true },
  { key: 'REQUEST_EXPIRING_SOON', label: 'Request expiring soon', description: '48 hours before a request expires.', mandatory: false },
]

const ADMIN_EVENTS = [
  { key: 'REQUEST_CREATED', label: 'New request created', description: 'When any new GOP request is created.', mandatory: false },
  { key: 'REQUEST_APPROVED', label: 'Request approved', description: 'Any GOP approval — mandatory for compliance.', mandatory: true },
  { key: 'REQUEST_REJECTED', label: 'Request rejected', description: 'Any GOP rejection — mandatory for compliance.', mandatory: true },
  { key: 'REQUEST_EXPIRED', label: 'Request expired', description: 'When any request auto-expires.', mandatory: false },
  { key: 'USER_CREATED', label: 'New user created', description: 'When a new user account is provisioned.', mandatory: false },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? ''

  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [specialty, setSpecialty] = useState('')
  const [department, setDepartment] = useState('')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [preferences, setPreferences] = useState<Record<string, boolean>>({})
  const [prefLoaded, setPrefLoaded] = useState(false)

  const [insurers, setInsurers] = useState<{ id: string; name: string; contactEmail?: string | null }[]>([])
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({})

  // Determine which events to show
  const events =
    role === 'DOCTOR' ? DOCTOR_EVENTS :
    role === 'ADMIN' ? ADMIN_EVENTS :
    STAFF_EVENTS

  // Load notification preferences
  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.ok ? r.json() : [])
      .then((rules: { eventType: string; channel: string; enabled: boolean }[]) => {
        const map: Record<string, boolean> = {}
        rules.forEach(r => { map[r.eventType] = r.enabled })
        // Default opt-in events to true if not in DB yet
        events.forEach(e => {
          if (!(e.key in map)) map[e.key] = true
        })
        setPreferences(map)
        setPrefLoaded(true)
      })
      .catch(() => setPrefLoaded(true))
  }, [role])

  // Load admin data
  useEffect(() => {
    if (role === 'ADMIN') {
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
    if (!file.type.includes('png')) {
      toast.error('Only PNG files are accepted for digital signatures.')
      return
    }
    if (file.size > 500 * 1024) {
      toast.error('Signature file must be under 500 KB.')
      return
    }
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
    } catch {
      toast.error('Failed to save profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    // Optimistic update
    setPreferences(prev => ({ ...prev, [eventKey]: enabled }))
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eventKey, channel: 'in-app', enabled }),
      })
    } catch {
      // Revert on failure
      setPreferences(prev => ({ ...prev, [eventKey]: !enabled }))
      toast.error('Failed to update preference.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and system preferences.</p>
      </div>

      <Separator />

      <div className="grid gap-6 max-w-2xl">

        {/* ── Profile ──────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Profile</CardTitle>
            </div>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline">{role}</Badge>
            </div>

            {/* Doctor-only profile fields */}
            {role === 'DOCTOR' && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    placeholder="e.g. Cardiology"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Ward 3A"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Digital signature</Label>
                  <p className="text-xs text-muted-foreground">
                    PNG only · max 500 KB · embedded in verified GOP PDFs.
                  </p>
                  <Input
                    type="file"
                    accept=".png"
                    onChange={handleSignatureChange}
                    className="cursor-pointer"
                  />
                  {signaturePreview && (
                    <div className="mt-2 border rounded-md p-3 bg-white">
                      <p className="text-xs text-muted-foreground mb-1">Preview</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={signaturePreview} alt="Signature preview" className="max-h-16 object-contain" />
                    </div>
                  )}
                </div>
              </>
            )}

            <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>

        {/* ── Notifications ────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Choose which events trigger in-app notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!prefLoaded && <p className="text-sm text-muted-foreground">Loading preferences…</p>}
            {prefLoaded && events.map((event, i) => (
              <div key={event.key}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{event.label}</p>
                      {event.mandatory && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  </div>
                  <Switch
                    checked={event.mandatory ? true : (preferences[event.key] ?? true)}
                    disabled={event.mandatory}
                    onCheckedChange={(checked) => !event.mandatory && handleToggle(event.key, checked)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Admin: Insurer Config ────────────────────────────── */}
        {role === 'ADMIN' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Insurer Configuration</CardTitle>
              </div>
              <CardDescription>Active insurers configured in the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {insurers.length === 0 && (
                <p className="text-sm text-muted-foreground">No insurers configured yet.</p>
              )}
              {insurers.map(ins => (
                <div key={ins.id} className="flex items-center justify-between text-sm py-1">
                  <span className="font-medium">{ins.name}</span>
                  <Badge variant="outline" className="text-xs">Edit — Phase 2</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Admin: System Defaults ───────────────────────────── */}
        {role === 'ADMIN' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">System Defaults</CardTitle>
              </div>
              <CardDescription>Global configuration values. Edit via database in Phase 2.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Request expiry window</span>
                <span className="font-medium">{systemConfig['request_expiry_days'] ?? '30'} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">PDF footer text</span>
                <span className="font-medium text-right max-w-48 truncate">
                  {systemConfig['pdf_footer_text'] ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audit log retention</span>
                <span className="font-medium">{systemConfig['audit_log_retention_days'] ?? '730'} days</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── System info ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">System</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">Phase 1 — MVP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hospital</span>
              <span className="font-medium">Intercare Hospital</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
