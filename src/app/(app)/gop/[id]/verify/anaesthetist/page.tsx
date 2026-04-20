'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPatientById, formatPatientName, calculateAge } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

function VerifyCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </span>
      {sub && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

export default function AnaesthetistVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setAnaesthetistVerified } = useGopStore()

  const role = session?.user?.role ?? ''

  useEffect(() => {
    if (!role) return
    if (role !== 'DOCTOR') { router.replace(`/gop/${id}`); return }
    if (!req) return
    if (
      req.assignedAnaesthetist !== session?.user?.name ||
      !(req.surgeonVerified ?? req.doctorVerified ?? false) ||
      req.anaesthetistVerified ||
      req.status !== 'DRAFT'
    ) {
      router.replace(`/gop/${id}`)
    }
  }, [role, req, id, router, session?.user?.name])

  const [secondaryDiag, setSecondaryDiag] = useState('')
  const [anaesthesiaType, setAnaesthesiaType] = useState('General')
  const [riskNotes, setRiskNotes] = useState('')
  const [anaesthetistName, setAnaesthetistName] = useState(session?.user?.name ?? '')
  const [regNumber, setRegNumber] = useState('')
  const [declared, setDeclared] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const patient = req ? getPatientById(req.patientId) : null
  const surgeonDone = req?.surgeonVerified ?? false
  const alreadyVerified = req?.anaesthetistVerified ?? false

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  if (role !== 'DOCTOR') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!declared) { toast.error('Please tick the declaration checkbox.'); return }
    if (!anaesthetistName.trim()) { toast.error('Anaesthetist name is required.'); return }
    if (!regNumber.trim()) { toast.error('Medical registration number is required.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? anaesthetistName, role: session?.user?.role ?? 'DOCTOR' }
    setAnaesthetistVerified(id, performer)

    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'anaesthetist', anaesthetistName, regNumber }),
    }).catch(() => {})

    toast.success('Anaesthetist verification submitted. Staff can now finalise.')
    router.push(`/gop/${id}`)
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Anaesthetist Verification</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
            Step 2 of 3 — Anaesthetic review for {req.patientName}
          </p>
        </div>
        <Link href={`/gop/${id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
            fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', cursor: 'pointer',
          }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
        </Link>
      </div>

      {/* Progress steps */}
      <VerifyCard style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        {[
          { step: 1, label: 'Surgeon', done: true, active: false },
          { step: 2, label: 'Anaesthetist', done: false, active: true },
          { step: 3, label: 'Finance', done: false, active: false },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {s.done ? (
                <CheckCircle style={{ width: 20, height: 20, color: '#1A9E4A' }} />
              ) : (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                  color: s.active ? '#fff' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{s.step}</div>
              )}
              <span style={{
                fontSize: 13, fontWeight: s.active ? 600 : 400,
                color: s.done ? '#1A9E4A' : s.active ? 'var(--blue-600)' : 'var(--gray-400)',
              }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div style={{ flex: 1, height: 1, background: s.done ? '#1A9E4A' : 'var(--border-light)', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </VerifyCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!surgeonDone && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#92400E',
          }}>
            <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
            <span>
              Surgeon verification must be completed before anaesthetist verification.{' '}
              <Link href={`/gop/${id}/verify/surgeon`} style={{ color: 'var(--blue-600)', textDecoration: 'underline', fontWeight: 500 }}>
                Go to surgeon step →
              </Link>
            </span>
          </div>
        )}

        {alreadyVerified && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#065F46',
          }}>
            <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            Anaesthetist verification is already complete. Fields are locked.
          </div>
        )}

        {/* Patient summary */}
        {patient && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)', padding: '12px 20px',
            display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
          }}>
            {[
              { label: 'Patient', value: formatPatientName(patient) },
              { label: 'Age', value: `${calculateAge(patient.birthDate)} yrs` },
              { label: 'Insurer', value: req.insurer },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--gray-400)' }}>{label}: </span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Anaesthetic fields */}
        <VerifyCard>
          <CardHead title="Anaesthetic Information" sub="Confirm secondary diagnosis and anaesthetic plan." />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="space-y-1.5">
              <Label htmlFor="sec-diag">Secondary Diagnosis (ICD-10, if applicable)</Label>
              <Input id="sec-diag" value={secondaryDiag} onChange={e => setSecondaryDiag(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="e.g. E11.9" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label>Anaesthesia Type</Label>
                <Select value={anaesthesiaType} onValueChange={setAnaesthesiaType} disabled={alreadyVerified || !surgeonDone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Anaesthesia</SelectItem>
                    <SelectItem value="Regional">Regional Anaesthesia</SelectItem>
                    <SelectItem value="Local">Local Anaesthesia</SelectItem>
                    <SelectItem value="Sedation">Sedation</SelectItem>
                    <SelectItem value="None">None Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ASA Physical Status</Label>
                <Select disabled={alreadyVerified || !surgeonDone}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">ASA I — Normal healthy patient</SelectItem>
                    <SelectItem value="II">ASA II — Mild systemic disease</SelectItem>
                    <SelectItem value="III">ASA III — Severe systemic disease</SelectItem>
                    <SelectItem value="IV">ASA IV — Life-threatening disease</SelectItem>
                    <SelectItem value="V">ASA V — Moribund patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="risk-notes">Anaesthesia Risk Notes</Label>
              <Textarea id="risk-notes" value={riskNotes} onChange={e => setRiskNotes(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="Known allergies, risk factors, special considerations…" rows={4} />
            </div>
          </div>
        </VerifyCard>

        {/* Anaesthetist details */}
        <VerifyCard>
          <CardHead title="Anaesthetist Details" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label htmlFor="ana-name">Anaesthetist Name</Label>
                <Input id="ana-name" value={anaesthetistName} onChange={e => setAnaesthetistName(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="Full name as on registration" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ana-reg">Medical Registration Number</Label>
                <Input id="ana-reg" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="e.g. KH-MED-005678" />
              </div>
            </div>
          </div>
        </VerifyCard>

        {/* Declaration */}
        {!alreadyVerified && surgeonDone && (
          <VerifyCard>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={e => setDeclared(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--blue-600)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)' }}>
                  I, <strong>{anaesthetistName || '[Anaesthetist Name]'}</strong>, confirm that the anaesthetic plan above is appropriate for the patient and that I accept responsibility for the anaesthetic component of this pre-authorisation.
                </span>
              </label>
              <Button onClick={handleSubmit} disabled={submitting || !declared} className="w-full">
                {submitting ? 'Submitting…' : 'Submit Anaesthetist Verification'}
              </Button>
            </div>
          </VerifyCard>
        )}

        {alreadyVerified && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#065F46',
          }}>
            <Lock style={{ width: 14, height: 14, flexShrink: 0 }} />
            Anaesthetist section locked. Both verifications complete — staff may now finalise.
          </div>
        )}
      </div>
    </div>
  )
}
