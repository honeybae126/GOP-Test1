'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { PageHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getPatientById, formatPatientName, calculateAge, MOCK_PREFILL_RESPONSE } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

export default function SurgeonVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setSurgeonVerified, logFieldCorrection } = useGopStore()

  const role = session?.user?.role ?? ''

  useEffect(() => {
    if (role === 'INSURANCE_STAFF') router.replace(`/gop/${id}`)
  }, [role, id, router])

  const prefill = MOCK_PREFILL_RESPONSE[id ?? ''] ?? []
  const getPrefill = (key: string) => prefill.find(a => a.linkId === key)?.answer as string ?? ''

  // Form state — pre-populated from AI prefill
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

  if (role === 'INSURANCE_STAFF') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!declared) { toast.error('Please tick the declaration checkbox.'); return }
    if (!surgeonName.trim()) { toast.error('Surgeon name is required.'); return }
    if (!regNumber.trim()) { toast.error('Medical registration number is required.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? surgeonName, role: session?.user?.role ?? 'DOCTOR' }

    // Log any field corrections against the AI prefill values
    const prefillDiagCode = getPrefill('primary-diagnosis') || 'J18.9'
    const prefillDiagDesc = getPrefill('diagnosis-description') || 'Community-acquired pneumonia, unspecified'
    const prefillProcedures = getPrefill('planned-procedure') || ''
    const prefillAdmType = getPrefill('admission-type') || 'Elective'
    const prefillLos = getPrefill('length-of-stay') || '3'
    const prefillNotes = getPrefill('clinical-notes') || ''

    if (diagnosisCode !== prefillDiagCode) logFieldCorrection(id, performer, 'Primary Diagnosis (ICD-10)', prefillDiagCode, diagnosisCode)
    if (diagnosisDesc !== prefillDiagDesc) logFieldCorrection(id, performer, 'Diagnosis Description', prefillDiagDesc, diagnosisDesc)
    if (procedures !== prefillProcedures && prefillProcedures) logFieldCorrection(id, performer, 'Planned Procedures', prefillProcedures, procedures)
    if (admissionType !== prefillAdmType) logFieldCorrection(id, performer, 'Admission Type', prefillAdmType, admissionType)
    if (los !== prefillLos) logFieldCorrection(id, performer, 'Length of Stay (days)', prefillLos, los)
    if (clinicalNotes !== prefillNotes && prefillNotes) logFieldCorrection(id, performer, 'Clinical Notes', prefillNotes, clinicalNotes)

    setSurgeonVerified(id, performer)

    // Fire-and-forget API sync
    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'surgeon', surgeonName, regNumber }),
    }).catch(() => {})

    toast.success('Surgeon verification submitted.')
    router.push(`/gop/${id}`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />
      <PageHeader
        title="Surgeon Verification"
        description={`Step 1 of 3 — Clinical review for ${req.patientName}`}
      >
        <Link href={`/gop/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3 mr-1" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
          Surgeon
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <div className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</div>
          Anaesthetist
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <div className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</div>
          Finalisation
        </div>
      </div>

      {alreadyVerified && (
        <Alert>
          <CheckCircle className="size-4 text-green-500" />
          <AlertDescription>Surgeon verification is already complete. Fields are locked.</AlertDescription>
        </Alert>
      )}

      {/* Patient summary */}
      {patient && (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 flex gap-4 text-sm">
            <div><span className="text-muted-foreground">Patient: </span><span className="font-medium">{formatPatientName(patient)}</span></div>
            <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{calculateAge(patient.birthDate)} yrs</span></div>
            <div><span className="text-muted-foreground">Insurer: </span><Badge variant="outline" className="text-xs">{req.insurer}</Badge></div>
          </CardContent>
        </Card>
      )}

      {/* Clinical fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Clinical Information</CardTitle>
          </div>
          <CardDescription className="text-xs">Fields pre-populated by AI prefill. Review and confirm accuracy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      {/* Surgeon details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Surgeon Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="surgeon-name">Surgeon Name</Label>
              <Input id="surgeon-name" value={surgeonName} onChange={e => setSurgeonName(e.target.value)} disabled={alreadyVerified} placeholder="Full name as on registration" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-number">Medical Registration Number</Label>
              <Input id="reg-number" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={alreadyVerified} placeholder="e.g. KH-MED-001234" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      {!alreadyVerified && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declared}
                onChange={e => setDeclared(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span className="text-sm leading-relaxed">
                I, <strong>{surgeonName || '[Surgeon Name]'}</strong>, confirm that the clinical information above is accurate and complete to the best of my knowledge. I accept full responsibility for the accuracy of this clinical assessment.
              </span>
            </label>
            <Button onClick={handleSubmit} disabled={submitting || !declared} className="w-full">
              {submitting ? 'Submitting…' : 'Submit Surgeon Verification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {alreadyVerified && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <Lock className="size-4" />
          Surgeon section locked after verification. Proceed to Anaesthetist Verification.
        </div>
      )}
    </div>
  )
}
