'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import type {
  MockGOPRequest, MockQuestionnaire, MockPatient, MockEncounter,
  MockCostEstimate, QuestionnaireResponseAnswer,
} from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'
import {
  Sparkles, CheckCircle, XCircle, AlertTriangle, User,
  Stethoscope, DollarSign, ClipboardCheck, Pen, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useGopStore } from '@/lib/gop-store'
import { useRouter } from 'next/navigation'

// Clinical fields that doctors must review
const CLINICAL_LINK_IDS = [
  'diagnosis-primary', 'diagnosis-secondary', 'planned-procedures',
  'admit-type', 'expected-los', 'clinical-notes', 'diagnosis',
  'procedure', 'urgency', 'treatment-plan', 'icd-code',
  'physician-name', 'hospital-name',
]

interface DoctorVerificationProps {
  request: MockGOPRequest
  questionnaire: MockQuestionnaire | null
  patient: MockPatient | null
  encounter: MockEncounter | null
  estimate: MockCostEstimate | null
  prefillAnswers: QuestionnaireResponseAnswer[]
  doctorName: string
}

export function DoctorVerification({
  request, questionnaire, patient, encounter, estimate, prefillAnswers, doctorName,
}: DoctorVerificationProps) {
  const clinicalFields = prefillAnswers.filter(a =>
    CLINICAL_LINK_IDS.includes(a.linkId)
  )

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    clinicalFields.forEach(f => { init[f.linkId] = String(f.answer) })
    return init
  })

  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [corrected, setCorrected] = useState<Record<string, boolean>>({})
  const [registrationNo, setRegistrationNo] = useState('')
  const [declaration, setDeclaration] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const setDoctorVerified = useGopStore((s) => s.setDoctorVerified)
  const router = useRouter()

  const acceptedCount = Object.values(accepted).filter(Boolean).length
  const totalClinical = clinicalFields.length
  const progress = totalClinical > 0 ? Math.round((acceptedCount / totalClinical) * 100) : 0
  const allAccepted = acceptedCount === totalClinical

  const handleAccept = (linkId: string) => {
    setAccepted(prev => ({ ...prev, [linkId]: true }))
    setCorrected(prev => ({ ...prev, [linkId]: false }))
  }

  const handleCorrect = (linkId: string) => {
    setCorrected(prev => ({ ...prev, [linkId]: !prev[linkId] }))
  }

  const handleFieldChange = (linkId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [linkId]: value }))
  }

  const handleSubmit = () => {
    if (!registrationNo.trim()) {
      toast.error('Please enter your medical registration number.')
      return
    }
    if (!declaration) {
      toast.error('You must confirm the declaration before submitting.')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setDoctorVerified(request.id)
      setSubmitting(false)
      setSubmitted(true)
      toast.success('Physician verification submitted successfully.')
    }, 800)
  }

  if (submitted) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Verification Complete</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your clinical verification has been recorded. The insurance staff can now finalise and submit this GOP request.
          </p>
          <Button className="mt-2" onClick={() => router.push(`/gop/${request.id}`)}>
            Return to GOP Request
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Context banner */}
      <Alert variant="warning">
        <Sparkles className="size-4" />
        <AlertTitle>Physician Review Required</AlertTitle>
        <AlertDescription>
          The clinical section below was prefilled by Claude AI based on the patient's FHIR records and uploaded medical reports.
          You must review each field — accept if correct, or correct any inaccuracies — before signing off.
        </AlertDescription>
      </Alert>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Verification progress</span>
            <span className="font-medium">{acceptedCount} / {totalClinical} fields confirmed</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {/* Patient summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground" />
            Patient Context
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          {patient && (
            <>
              <div>
                <div className="text-muted-foreground text-xs">Patient</div>
                <div className="font-medium">{formatPatientName(patient)}</div>
                <div className="text-xs text-muted-foreground">{calculateAge(patient.birthDate)} yrs · {patient.gender}</div>
              </div>
            </>
          )}
          {encounter && (
            <div>
              <div className="text-muted-foreground text-xs">Encounter</div>
              <div className="font-medium text-sm">{encounter.reasonCode?.[0]?.text}</div>
              <div className="text-xs text-muted-foreground">{encounter.class.display} · {encounter.status}</div>
            </div>
          )}
          {estimate && (
            <div>
              <div className="text-muted-foreground text-xs">Estimated Cost</div>
              <div className="font-medium">${estimate.total.toLocaleString()} USD</div>
              <div className="text-xs text-muted-foreground">Co-Pay: ${estimate.coPayAmount.toLocaleString()}</div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground text-xs">Insurer</div>
            <div className="font-medium">{request.insurer}</div>
          </div>
        </CardContent>
      </Card>

      {/* AI-prefilled clinical fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="size-3.5 text-muted-foreground" />
            <CardTitle className="text-sm">Clinical Information — AI Prefilled</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Review each field. Accept if the AI content is accurate, or correct it if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clinicalFields.map((field) => {
            const isAccepted = accepted[field.linkId]
            const isBeingCorrected = corrected[field.linkId]
            const currentVal = fieldValues[field.linkId] ?? ''

            return (
              <div
                key={field.linkId}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  isAccepted ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50/40'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {field.linkId.replace(/-/g, ' ')}
                    </span>
                    {field.aiPrefilled && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-violet-50 text-violet-700 border-violet-200">
                        <Sparkles className="size-2.5 mr-0.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                  {isAccepted ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="size-3.5" />
                      Accepted
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="size-3.5" />
                      Pending review
                    </div>
                  )}
                </div>

                {isBeingCorrected ? (
                  <Textarea
                    value={currentVal}
                    onChange={e => handleFieldChange(field.linkId, e.target.value)}
                    className="text-sm min-h-[60px] bg-white"
                  />
                ) : (
                  <p className={cn(
                    'text-sm',
                    isAccepted ? 'text-green-900' : 'text-foreground'
                  )}>
                    {currentVal || <span className="text-muted-foreground italic">—</span>}
                  </p>
                )}

                {!isAccepted && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-400 text-green-700 hover:bg-green-50"
                      onClick={() => handleAccept(field.linkId)}
                    >
                      <CheckCircle className="size-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-400 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        handleCorrect(field.linkId)
                      }}
                    >
                      <Pen className="size-3 mr-1" />
                      {isBeingCorrected ? 'Done Editing' : 'Correct'}
                    </Button>
                    {isBeingCorrected && (
                      <Button
                        size="sm"
                        onClick={() => {
                          handleCorrect(field.linkId)
                          handleAccept(field.linkId)
                        }}
                      >
                        <CheckCircle className="size-3 mr-1" />
                        Save & Accept
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-3.5 text-muted-foreground" />
            <CardTitle className="text-sm">Physician Declaration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-no" className="text-sm">
              Medical Registration Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-no"
              placeholder="e.g. KH-MED-20103"
              value={registrationNo}
              onChange={e => setRegistrationNo(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className={cn(
            'flex items-start gap-3 p-4 rounded-lg border',
            !allAccepted ? 'opacity-50 cursor-not-allowed' : ''
          )}>
            <input
              type="checkbox"
              id="declaration"
              checked={declaration}
              onChange={e => setDeclaration(e.target.checked)}
              disabled={!allAccepted}
              className="size-4 mt-0.5 rounded border-input shrink-0"
            />
            <label htmlFor="declaration" className="text-sm leading-relaxed text-muted-foreground">
              I, <strong className="text-foreground">{doctorName || '[Physician Name]'}</strong>, confirm that the clinical information above is accurate and complete to the best of my knowledge, and that the described procedures are medically necessary for this patient.
            </label>
          </div>

          {!allAccepted && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="size-3.5" />
              Please review and accept all {totalClinical} clinical fields before signing.
            </p>
          )}

          <Separator />

          <Button
            className="w-full"
            disabled={!allAccepted || !declaration || !registrationNo.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              : <ClipboardCheck className="size-3.5 mr-1.5" />}
            {submitting ? 'Submitting…' : 'Submit Physician Verification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
