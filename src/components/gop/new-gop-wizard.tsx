'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MockPatient, MockCoverage, MockEncounter, MockCostEstimate, GOPPriority } from '@/lib/mock-data'
import { formatPatientName, calculateAge, MOCK_QUESTIONNAIRES, MOCK_COST_ESTIMATES } from '@/lib/mock-data'
import { useGopStore } from '@/lib/gop-store'
import {
  Search, User, Shield, Stethoscope, ChevronRight,
  ChevronLeft, CheckCircle, Sparkles, FileText, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Patient' },
  { id: 2, label: 'Encounter' },
  { id: 3, label: 'Insurer Form' },
  { id: 4, label: 'Review' },
]

interface NewGOPWizardProps {
  patients: MockPatient[]
  coverages: MockCoverage[]
  encounters: MockEncounter[]
  estimates: MockCostEstimate[]
  preselectedPatientId?: string
}

export function NewGOPWizard({ patients, coverages, encounters, estimates, preselectedPatientId }: NewGOPWizardProps) {
  const [step, setStep] = useState(preselectedPatientId ? 2 : 1)
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId ?? '')
  const [selectedEncounterId, setSelectedEncounterId] = useState('')
  const [selectedFormId, setSelectedFormId] = useState('')
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<GOPPriority>('ROUTINE')
  const [createdGopId, setCreatedGopId] = useState<string | null>(null)
  const createGOPRequest = useGopStore((s) => s.createGOPRequest)
  const router = useRouter()
  const { data: session } = useSession()

  const coverageMap = useMemo(() => {
    const map: Record<string, MockCoverage> = {}

if (Array.isArray(coverages)) {
      coverages.forEach(c => {
        const pid = c.beneficiary.reference.split('/')[1]
        map[pid] = c
      });
    }
    return map;

  }, [coverages])

const selectedPatient = Array.isArray(patients) ? patients.find(p => p.id === selectedPatientId) : undefined
  const selectedCoverage = selectedPatientId ? coverageMap[selectedPatientId] : undefined
const patientEncounters = Array.isArray(encounters) ? encounters.filter(e => e.subject.reference === `Patient/${selectedPatientId}`) : [];
const selectedEncounter = Array.isArray(encounters) ? encounters.find(e => e.id === selectedEncounterId) : undefined
const selectedEstimate = Array.isArray(estimates) ? estimates.find(e => e.encounterId === selectedEncounterId) ?? null : null
  const selectedForm = (MOCK_QUESTIONNAIRES || []).find(q => q.id === selectedFormId) ?? null

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase()
    if (!Array.isArray(patients)) return [];
    return patients.filter(p =>
      !q ||
      formatPatientName(p).toLowerCase().includes(q) ||
      p.identifier.some(i => i.value.toLowerCase().includes(q))
    )
  }, [patients, search])

  if (createdGopId) {
    return (
      <Card className="max-w-lg mx-auto mt-12 text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">GOP Request Created</h2>
          <p className="text-sm text-muted-foreground">
            The request has been created with AI-assisted prefill for the physician section.
            <strong> {selectedEncounter?.participant[0]?.individual.display}</strong> will need to
            review and verify the clinical fields before submission.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link href="/gop">
              <Button variant="outline">View All Requests</Button>
            </Link>
            <Button onClick={() => router.push(`/gop/${createdGopId}`)}>
              Open Request
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                step > s.id
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step === s.id
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-muted text-muted-foreground'
              )}
            >
              {step > s.id ? <CheckCircle className="size-4" /> : s.id}
            </div>
            <div className="ml-2 mr-2">
              <p className={cn('text-xs font-medium', step >= s.id ? 'text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-2', step > s.id ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Patient selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Patient</CardTitle>
            <CardDescription>Search and select the patient for this GOP request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or hospital ID…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredPatients.map(p => {
                const cov = coverageMap[p.id]
                const isSelected = p.id === selectedPatientId
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{formatPatientName(p)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.identifier.find(i => i.system === 'hospital.local/id')?.value} · {calculateAge(p.birthDate)} yrs
                      </div>
                    </div>
                    {cov ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                        <Shield className="size-3" />
                        {cov.insurer}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">No coverage</Badge>
                    )}
                    {isSelected && <CheckCircle className="size-4 text-primary shrink-0" />}
                  </div>
                )
              })}
            </div>
            {selectedPatient && !selectedCoverage && (
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertTitle>No Active Coverage</AlertTitle>
                <AlertDescription>This patient has no active insurance coverage on record. A GOP request cannot be submitted without coverage.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Encounter */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Encounter</CardTitle>
            <CardDescription>
              Choose the clinical encounter this GOP request relates to.
              {selectedPatient && <span className="ml-1 font-medium">{formatPatientName(selectedPatient)}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patientEncounters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No encounters found for this patient.</p>
            ) : patientEncounters.map(enc => {
              const est = estimates.find(e => e.encounterId === enc.id)
              const isSelected = enc.id === selectedEncounterId
              return (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEncounterId(enc.id)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{enc.reasonCode?.[0]?.text}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{enc.serviceProvider.display}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {enc.participant[0]?.individual.display}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[10px] mb-1">
                        {enc.class.display}
                      </Badge>
                      {est && (
                        <div className="text-sm font-medium text-foreground">
                          ${est.total.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <CheckCircle className="size-3" /> Selected
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Insurer form */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Insurer Form</CardTitle>
            <CardDescription>
              {selectedCoverage
                ? `Coverage detected: ${selectedCoverage.insurer} — ${selectedCoverage.planName}`
                : 'Select the applicable insurer pre-authorisation form.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_QUESTIONNAIRES.map(q => {
              const isSelected = q.id === selectedFormId
              const isSuggested = selectedCoverage?.insurer === q.insurer
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedFormId(q.id)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{q.title}</span>
                        {isSuggested && (
                          <Badge className="text-[9px] h-4 px-1.5 bg-blue-600">Recommended</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Version {q.version} · {q.item.length} sections</div>
                    </div>
                    {isSelected && <CheckCircle className="size-4 text-primary" />}
                  </div>
                </div>
              )
            })}
            <Alert variant="info">
              <Sparkles className="size-4" />
              <AlertTitle>AI-Assisted Prefill</AlertTitle>
              <AlertDescription className="text-xs">
                After creating this request, Claude AI will automatically read the patient's FHIR records and uploaded medical reports to prefill the physician section. All AI-filled fields will be flagged for doctor review.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review & Create</CardTitle>
            <CardDescription>Confirm the details before creating the GOP request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Patient', value: selectedPatient ? formatPatientName(selectedPatient) : '—' },
              { label: 'Coverage', value: selectedCoverage ? `${selectedCoverage.insurer} — ${selectedCoverage.planName}` : '—' },
              { label: 'Encounter', value: selectedEncounter?.reasonCode?.[0]?.text ?? '—' },
              { label: 'Doctor', value: selectedEncounter?.participant[0]?.individual.display ?? '—' },
              { label: 'Estimated Cost', value: selectedEstimate ? `$${selectedEstimate.total.toLocaleString()} USD` : '—' },
              { label: 'Insurer Form', value: selectedForm?.title ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-right max-w-[60%]">{item.value}</span>
              </div>
            ))}

            <Separator />

            {/* Priority selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Request priority</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'ROUTINE' as GOPPriority, label: 'Routine', desc: 'Standard elective procedure', badgeCls: 'bg-gray-100 text-gray-700 border-gray-200' },
                  { value: 'URGENT' as GOPPriority, label: 'Urgent', desc: 'Required within 24 hours', badgeCls: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { value: 'EMERGENCY' as GOPPriority, label: 'Emergency', desc: 'Immediate — life threatening', badgeCls: 'bg-red-100 text-red-700 border-red-200' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'flex flex-col gap-1.5 rounded-lg border-2 p-3 text-left transition-colors',
                      priority === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <span className={cn('inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', opt.badgeCls)}>
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {priority === 'EMERGENCY' && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-red-600" />
                  <span>Emergency priority will place this request at the top of all queues. Ensure this classification is clinically justified.</span>
                </div>
              )}
            </div>

            <Separator />
            <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 rounded-lg p-3">
              <Sparkles className="size-4 shrink-0" />
              <span>AI will prefill the physician section using FHIR records. The assigned doctor must verify before submission.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(s => s - 1) : undefined}
          disabled={step === 1}
        >
          <ChevronLeft className="size-3 mr-1" />
          Back
        </Button>
        {step < 4 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 1 && (!selectedPatientId || !selectedCoverage)) ||
              (step === 2 && !selectedEncounterId) ||
              (step === 3 && !selectedFormId)
            }
          >
            Continue
            <ChevronRight className="size-3 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              const newId = createGOPRequest({
                patientId: selectedPatientId,
                patientName: selectedPatient ? formatPatientName(selectedPatient) : '',
                encounterId: selectedEncounterId,
                coverageId: selectedCoverage?.id ?? '',
                insurer: selectedCoverage?.insurer ?? '',
                questionnaireId: selectedFormId,
                assignedSurgeon: selectedEncounter?.participant[0]?.individual.display ?? null,
                estimatedAmount: selectedEstimate?.total ?? 0,
                createdBy: session?.user?.name ?? 'Insurance Staff',
                createdByRole: session?.user?.role ?? 'INSURANCE_STAFF',
                priority,
              })
              setCreatedGopId(newId)
            }}
            className="bg-primary"
          >
            <FileText className="size-3 mr-1" />
            Create GOP Request
          </Button>
        )}
      </div>
    </div>
  )
}
