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
import { getPatientById, formatPatientName, calculateAge, MOCK_PREFILL_RESPONSE } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, Stethoscope } from 'lucide-react'
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

function CardHead({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sub ? 4 : 0 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </span>
      </div>
      {sub && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: icon ? 20 : 0 }}>{sub}</p>}
    </div>
  )
}

export default function SurgeonVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setSurgeonVerified, logFieldCorrection } = useGopStore()

  const role = session?.user?.role ?? ''

  useEffect(() => {
    if (!role) return
    if (role !== 'DOCTOR') { router.replace(`/gop/${id}`); return }
    if (!req) return
    if (req.assignedSurgeon !== session?.user?.name || req.surgeonVerified || req.status !== 'DRAFT') {
      router.replace(`/gop/${id}`)
    }
  }, [role, req, id, router, session?.user?.name])

  const prefill = MOCK_PREFILL_RESPONSE[id ?? ''] ?? []
  const getPrefill = (key: string) => prefill.find(a => a.linkId === key)?.answer as string ?? ''

  const [diagnosisCode, setDiagnosisCode] = useState(getPrefill('primary-diagnosis') || 'J18.9')
  const [diagnosisDesc, setDiagnosisDesc] = useState(getPrefill('diagnosis-description') || 'Community-acquired pneumonia, unspecified')
  const [procedures, setProcedures] = useState(getPrefill('planned-procedure') || '')
  const [admissionType, setAdmissionType] = useState(getPrefill('admission-type') || 'Elective')
  const [los, setLos] = useState(getPrefill('length-of-stay') || '3')
  const [clinicalNotes, setClinicalNotes] = useState(getPrefill('clinical-notes') || '')
  const [surgeonName, setSurgeonName] = useState(session?.user?.name ?? '')
  const [regNumber, setRegNumber] = useState('')
  const [declared, setDeclared] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const patient = req ? getPatientById(req.patientId) : null
  const alreadyVerified = req?.surgeonVerified ?? false

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  if (role !== 'DOCTOR') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!declared) { toast.error('Please tick the declaration checkbox.'); return }
    if (!surgeonName.trim()) { toast.error('Surgeon name is required.'); return }
    if (!regNumber.trim()) { toast.error('Medical registration number is required.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? surgeonName, role: session?.user?.role ?? 'DOCTOR' }

    const prefillDiagCode  = getPrefill('primary-diagnosis') || 'J18.9'
    const prefillDiagDesc  = getPrefill('diagnosis-description') || 'Community-acquired pneumonia, unspecified'
    const prefillProcedures = getPrefill('planned-procedure') || ''
    const prefillAdmType   = getPrefill('admission-type') || 'Elective'
    const prefillLos       = getPrefill('length-of-stay') || '3'
    const prefillNotes     = getPrefill('clinical-notes') || ''

    if (diagnosisCode !== prefillDiagCode) logFieldCorrection(id, performer, 'Primary Diagnosis (ICD-10)', prefillDiagCode, diagnosisCode)
    if (diagnosisDesc !== prefillDiagDesc) logFieldCorrection(id, performer, 'Diagnosis Description', prefillDiagDesc, diagnosisDesc)
    if (procedures !== prefillProcedures && prefillProcedures) logFieldCorrection(id, performer, 'Planned Procedures', prefillProcedures, procedures)
    if (admissionType !== prefillAdmType) logFieldCorrection(id, performer, 'Admission Type', prefillAdmType, admissionType)
    if (los !== prefillLos) logFieldCorrection(id, performer, 'Length of Stay (days)', prefillLos, los)
    if (clinicalNotes !== prefillNotes && prefillNotes) logFieldCorrection(id, performer, 'Clinical Notes', prefillNotes, clinicalNotes)

    setSurgeonVerified(id, performer)

    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'surgeon', surgeonName, regNumber }),
    }).catch(() => {})

    toast.success('Surgeon verification submitted.')
    router.push(`/gop/${id}`)
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Surgeon Verification</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
            Step 1 of 3 — Clinical review for {req.patientName}
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
          { step: 1, label: 'Surgeon', active: true, done: false },
          { step: 2, label: 'Anaesthetist', active: false, done: false },
          { step: 3, label: 'Finance', active: false, done: false },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                color: s.active ? '#fff' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{s.step}</div>
              <span style={{ fontSize: 13, fontWeight: s.active ? 600 : 400, color: s.active ? 'var(--blue-600)' : 'var(--gray-400)' }}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border-light)', margin: '0 12px' }} />}
          </div>
        ))}
      </VerifyCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {alreadyVerified && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#065F46',
          }}>
            <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            Surgeon verification is already complete. Fields are locked.
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

        {/* Clinical fields */}
        <VerifyCard>
          <CardHead
            icon={<Stethoscope style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
            title="Clinical Information"
            sub="Fields pre-populated by AI prefill. Review and confirm accuracy."
          />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label htmlFor="diag-code">Primary Diagnosis (ICD-10)</Label>
                <Input id="diag-code" value={diagnosisCode} onChange={e => setDiagnosisCode(e.target.value)} disabled={alreadyVerified} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diag-desc">Diagnosis Description</Label>
                <Input id="diag-desc" value={diagnosisDesc} onChange={e => setDiagnosisDesc(e.target.value)} disabled={alreadyVerified} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="procedures">Planned Procedures / Treatments</Label>
              <Textarea id="procedures" value={procedures} onChange={e => setProcedures(e.target.value)} disabled={alreadyVerified} placeholder="Describe the planned procedures…" rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label>Admission Type</Label>
                <Select value={admissionType} onValueChange={setAdmissionType} disabled={alreadyVerified}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elective">Elective</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Day Surgery">Day Surgery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="los">Expected Length of Stay (days)</Label>
                <Input id="los" type="number" min={1} max={365} value={los} onChange={e => setLos(e.target.value)} disabled={alreadyVerified} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Clinical Notes / Justification</Label>
              <Textarea id="notes" value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} disabled={alreadyVerified} placeholder="Medical necessity and clinical justification…" rows={4} />
            </div>
          </div>
        </VerifyCard>

        {/* Surgeon details */}
        <VerifyCard>
          <CardHead title="Surgeon Details" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label htmlFor="surgeon-name">Surgeon Name</Label>
                <Input id="surgeon-name" value={surgeonName} onChange={e => setSurgeonName(e.target.value)} disabled={alreadyVerified} placeholder="Full name as on registration" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-number">Medical Registration Number</Label>
                <Input id="reg-number" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={alreadyVerified} placeholder="e.g. KH-MED-001234" />
              </div>
            </div>
          </div>
        </VerifyCard>

        {/* Declaration */}
        {!alreadyVerified && (
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
                  I, <strong>{surgeonName || '[Surgeon Name]'}</strong>, confirm that the clinical information above is accurate and complete to the best of my knowledge. I accept full responsibility for the accuracy of this clinical assessment.
                </span>
              </label>
              <Button onClick={handleSubmit} disabled={submitting || !declared} className="w-full">
                {submitting ? 'Submitting…' : 'Submit Surgeon Verification'}
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
            Surgeon section locked after verification. Proceed to Anaesthetist Verification.
          </div>
        )}
      </div>
    </div>
  )
}
