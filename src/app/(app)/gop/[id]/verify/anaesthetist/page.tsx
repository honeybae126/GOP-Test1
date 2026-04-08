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
import { getPatientById, formatPatientName, calculateAge } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

export default function AnaesthetistVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setAnaesthetistVerified } = useGopStore()

  const role = session?.user?.role ?? ''

  useEffect(() => {
    if (role === 'INSURANCE_STAFF') router.replace(`/gop/${id}`)
  }, [role, id, router])

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

  if (role === 'INSURANCE_STAFF') return null
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
    <div className="space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />
      <PageHeader
        title="Anaesthetist Verification"
        description={`Step 2 of 3 — Anaesthetic review for ${req.patientName}`}
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
        <div className="flex items-center gap-1.5 text-green-700">
          <CheckCircle className="size-5 text-green-500" />
          Surgeon
        </div>
        <div className="flex-1 h-px bg-green-300" />
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
          Anaesthetist
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <div className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</div>
          Finalisation
        </div>
      </div>

      {!surgeonDone && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Surgeon verification must be completed before anaesthetist verification.{' '}
            <Link href={`/gop/${id}/verify/surgeon`} className="underline font-medium">Go to surgeon step →</Link>
          </AlertDescription>
        </Alert>
      )}

      {alreadyVerified && (
        <Alert>
          <CheckCircle className="size-4 text-green-500" />
          <AlertDescription>Anaesthetist verification is already complete. Fields are locked.</AlertDescription>
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

      {/* Anaesthetic fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Anaesthetic Information</CardTitle>
          <CardDescription className="text-xs">Confirm secondary diagnosis and anaesthetic plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sec-diag">Secondary Diagnosis (ICD-10, if applicable)</Label>
            <Input id="sec-diag" value={secondaryDiag} onChange={e => setSecondaryDiag(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="e.g. E11.9" />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="risk-class">ASA Physical Status</Label>
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
        </CardContent>
      </Card>

      {/* Anaesthetist details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Anaesthetist Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ana-name">Anaesthetist Name</Label>
              <Input id="ana-name" value={anaesthetistName} onChange={e => setAnaesthetistName(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="Full name as on registration" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ana-reg">Medical Registration Number</Label>
              <Input id="ana-reg" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="e.g. KH-MED-005678" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      {!alreadyVerified && surgeonDone && (
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
                I, <strong>{anaesthetistName || '[Anaesthetist Name]'}</strong>, confirm that the anaesthetic plan above is appropriate for the patient and that I accept responsibility for the anaesthetic component of this pre-authorisation.
              </span>
            </label>
            <Button onClick={handleSubmit} disabled={submitting || !declared} className="w-full">
              {submitting ? 'Submitting…' : 'Submit Anaesthetist Verification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {alreadyVerified && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <Lock className="size-4" />
          Anaesthetist section locked. Both verifications complete — staff may now finalise.
        </div>
      )}
    </div>
  )
}
