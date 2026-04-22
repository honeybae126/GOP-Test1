'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import type { MockPatient, MockCoverage, MockEncounter, MockCostEstimate, GOPPriority } from '@/lib/mock-data'
import { formatPatientName, calculateAge, MOCK_QUESTIONNAIRES } from '@/lib/mock-data'
import { useGopStore } from '@/lib/gop-store'
import { Search, Shield, ChevronRight, ChevronLeft, CheckCircle, Sparkles, FileText, AlertTriangle, Check } from 'lucide-react'

/* ─── Design tokens (local shortcuts) ─────────────────────────────────────── */
const C = {
  primary:     'var(--primary)',
  primarySub:  'var(--primary-subtle)',
  primaryFg:   'var(--primary-foreground)',
  success:     'var(--success)',
  successSub:  'var(--success-subtle)',
  successText: 'var(--success-text)',
  successBdr:  'var(--success-border)',
  warning:     'var(--warning)',
  warningText: 'var(--warning-text)',
  border:      'var(--border-light)',
  borderMed:   'var(--border-medium)',
  muted:       'var(--muted-foreground)',
  fg:          'var(--foreground)',
  bgCard:      'var(--bg-card)',
  bg:          'var(--background)',
  gray50:      'var(--gray-50)',
  gray100:     'var(--gray-100)',
  gray400:     'var(--gray-400)',
  gray500:     'var(--gray-500)',
  gray700:     'var(--gray-700)',
  aiColor:     'var(--ai-color)',
  aiBg:        'var(--ai-bg)',
  radSm:       'var(--radius-sm)',
  radMd:       'var(--radius-md)',
  radLg:       'var(--radius-lg)',
  radXl:       'var(--radius-xl)',
  radFull:     'var(--radius-full)',
  shadow:      'var(--shadow-card)',
  shadowHover: 'var(--shadow-card-hover)',
  transition:  'var(--transition-base)',
} as const

const STEPS = [
  { id: 1, label: 'Patient',      icon: 'fas fa-user' },
  { id: 2, label: 'Encounter',    icon: 'fas fa-stethoscope' },
  { id: 3, label: 'Insurer Form', icon: 'fas fa-file-medical' },
  { id: 4, label: 'Review',       icon: 'fas fa-check-double' },
]

interface NewGOPWizardProps {
  patients: MockPatient[]
  coverages: MockCoverage[]
  encounters: MockEncounter[]
  estimates: MockCostEstimate[]
  preselectedPatientId?: string
}

/* ─── Helper: patient initials avatar ────────────────────────────────────── */
function PatientAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const hue = Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: C.radFull, flexShrink: 0,
      background: `hsl(${hue}, 55%, 88%)`,
      color: `hsl(${hue}, 55%, 32%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, letterSpacing: '-0.02em',
      fontFamily: 'var(--font-display)',
    }}>
      {initials}
    </div>
  )
}

/* ─── Shared primitives ───────────────────────────────────────────────────── */
function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: C.radXl, boxShadow: C.shadow, overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function CardSection({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ padding: '20px 24px 0' }}>
      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: C.fg, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{label}</div>
      {sub && <div style={{ fontSize: 'var(--font-size-sm)', color: C.muted, marginTop: 3 }}>{sub}</div>}
      <div style={{ height: 1, background: C.border, marginTop: 16 }} />
    </div>
  )
}

function SectionBody({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return <div style={{ padding: noPad ? '16px 0' : 16, margin: '0 24px' }}>{children}</div>
}

/* ─── Insurer badge ───────────────────────────────────────────────────────── */
function InsurerBadge({ insurer }: { insurer: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '3px 10px',
      borderRadius: C.radFull,
      background: 'var(--primary-foreground)',
      color: C.primary,
      border: `1px solid var(--blue-200)`,
      whiteSpace: 'nowrap',
    }}>
      <Shield style={{ width: 10, height: 10 }} />
      {insurer}
    </span>
  )
}

/* ─── Main wizard ─────────────────────────────────────────────────────────── */
export function NewGOPWizard({ patients, coverages, encounters, estimates, preselectedPatientId }: NewGOPWizardProps) {
  const [step, setStep]                       = useState(preselectedPatientId ? 2 : 1)
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId ?? '')
  const [selectedEncounterId, setSelectedEncounterId] = useState('')
  const [selectedFormId, setSelectedFormId]   = useState('')
  const [search, setSearch]                   = useState('')
  const [priority, setPriority]               = useState<GOPPriority>('ROUTINE')
  const [createdGopId, setCreatedGopId]       = useState<string | null>(null)
  const createGOPRequest = useGopStore((s) => s.createGOPRequest)
  const router = useRouter()
  const { data: session } = useSession()

  const coverageMap = useMemo(() => {
    const map: Record<string, MockCoverage> = {}
    if (Array.isArray(coverages)) {
      coverages.forEach(c => {
        const pid = c.beneficiary.reference.split('/')[1]
        map[pid] = c
      })
    }
    return map
  }, [coverages])

  const selectedPatient   = Array.isArray(patients)  ? patients.find(p => p.id === selectedPatientId) : undefined
  const selectedCoverage  = selectedPatientId ? coverageMap[selectedPatientId] : undefined
  const patientEncounters = Array.isArray(encounters) ? encounters.filter(e => e.subject.reference === `Patient/${selectedPatientId}`) : []
  const selectedEncounter = Array.isArray(encounters) ? encounters.find(e => e.id === selectedEncounterId) : undefined
  const selectedEstimate  = Array.isArray(estimates)  ? (estimates.find(e => e.encounterId === selectedEncounterId) ?? null) : null
  const selectedForm      = (MOCK_QUESTIONNAIRES || []).find(q => q.id === selectedFormId) ?? null

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase()
    if (!Array.isArray(patients)) return []
    return patients.filter(p =>
      !q ||
      formatPatientName(p).toLowerCase().includes(q) ||
      p.identifier.some(i => i.value.toLowerCase().includes(q))
    )
  }, [patients, search])

  const isCoverageExpired = (cov: MockCoverage | undefined) => {
    if (!cov) return false
    if (cov.status !== 'active') return true
    const endDate = cov.period?.end ?? cov.coverageDates?.end
    return endDate ? new Date(endDate) < new Date() : false
  }
  const coverageExpired = isCoverageExpired(selectedCoverage)

  const canContinue =
    (step === 1 && !!selectedPatientId && !!selectedCoverage) ||
    (step === 2 && !!selectedEncounterId) ||
    (step === 3 && !!selectedFormId) ||
    step === 4

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (createdGopId) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          width: 72, height: 72, borderRadius: C.radFull, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 8px rgba(16,185,129,0.1)',
        }}>
          <CheckCircle style={{ width: 36, height: 36, color: C.success }} />
        </div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: C.fg, fontFamily: 'var(--font-display)', marginBottom: 10 }}>
          GOP Request Created
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>
          The request has been created with AI-assisted prefill.
          {' '}<strong style={{ color: C.fg }}>{selectedEncounter?.participant[0]?.individual.display}</strong>{' '}
          will need to review and verify clinical fields before submission.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/gop">
            <Button variant="outline">View All Requests</Button>
          </Link>
          <Button onClick={() => router.push(`/gop/${createdGopId}`)}>
            Open Request
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Stepper ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {STEPS.map((s, i) => {
          const isDone   = step > s.id
          const isActive = step === s.id
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              {/* Step node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: C.radFull,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, transition: C.transition,
                  background: isDone
                    ? 'var(--gradient-success)'
                    : isActive
                    ? 'var(--gradient-primary)'
                    : C.gray100,
                  color: isDone || isActive ? '#fff' : C.gray400,
                  boxShadow: isDone
                    ? '0 2px 8px rgba(16,185,129,0.3)'
                    : isActive
                    ? 'var(--shadow-primary-sm)'
                    : 'none',
                }}>
                  {isDone
                    ? <Check style={{ width: 16, height: 16 }} />
                    : <i className={s.icon} style={{ fontSize: 13 }} />}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500, marginTop: 6, whiteSpace: 'nowrap',
                  color: isDone ? C.success : isActive ? C.primary : C.gray400,
                  transition: C.transition,
                }}>
                  {s.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginTop: 17, marginLeft: 8, marginRight: 8,
                  background: isDone
                    ? 'var(--gradient-success)'
                    : `linear-gradient(90deg, ${isActive ? C.primary : C.border} 0%, ${C.border} 100%)`,
                  borderRadius: 99, transition: C.transition,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Patient selection ─────────────────────────────────────── */}
      {step === 1 && (
        <WizardCard>
          <CardSection
            label="Select Patient"
            sub="Search and select the patient for this GOP request."
          />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Search bar */}
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, color: C.gray400, flexShrink: 0,
              }} />
              <input
                type="text"
                placeholder="Search by name or hospital ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 44, paddingLeft: 42, paddingRight: 16,
                  border: `1.5px solid ${C.border}`, borderRadius: C.radMd,
                  background: C.bgCard, fontSize: 'var(--font-size-sm)',
                  color: C.fg, outline: 'none', fontFamily: 'inherit',
                  boxShadow: 'var(--shadow-xs)', transition: C.transition,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)' }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'var(--shadow-xs)' }}
              />
            </div>

            {/* Patient list */}
            <div style={{
              maxHeight: 320, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 6,
              paddingRight: 4,
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--muted) transparent',
            }}>
              {filteredPatients.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 'var(--font-size-sm)', color: C.muted }}>
                  No patients match your search.
                </div>
              )}
              {filteredPatients.map(p => {
                const cov         = coverageMap[p.id]
                const noCoverage  = !cov
                const isSelected  = p.id === selectedPatientId
                const hospitalId  = p.identifier.find(i => i.system === 'hospital.local/id')?.value
                const age         = calculateAge(p.birthDate)
                const name        = formatPatientName(p)

                return (
                  <div
                    key={p.id}
                    onClick={() => !noCoverage && setSelectedPatientId(p.id)}
                    title={noCoverage ? 'No active coverage — cannot create GOP request' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: C.radMd,
                      border: `1.5px solid ${isSelected ? C.primary : noCoverage ? C.border : C.border}`,
                      background: isSelected ? C.primarySub : noCoverage ? C.gray50 : C.bgCard,
                      cursor: noCoverage ? 'not-allowed' : 'pointer',
                      opacity: noCoverage ? 0.5 : 1,
                      transition: C.transition,
                    }}
                    onMouseEnter={e => {
                      if (!noCoverage && !isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background = C.gray50
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = C.borderMed
                      }
                    }}
                    onMouseLeave={e => {
                      if (!noCoverage && !isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background = C.bgCard
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = C.border
                      }
                    }}
                  >
                    {/* Avatar */}
                    <PatientAvatar name={name} size={40} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: C.fg, lineHeight: 1.3 }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{hospitalId}</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.gray400, display: 'inline-block' }} />
                        <span>{age} yrs</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.gray400, display: 'inline-block' }} />
                        <span>{p.gender}</span>
                      </div>
                    </div>

                    {/* Coverage / selected indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {cov ? (
                        <InsurerBadge insurer={cov.insurer} />
                      ) : (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: C.radFull, background: '#FEF2F2',
                          color: 'var(--destructive)', border: '1px solid #FECACA',
                        }}>
                          No coverage
                        </span>
                      )}
                      {isSelected && (
                        <div style={{
                          width: 20, height: 20, borderRadius: C.radFull,
                          background: 'var(--gradient-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: 'var(--shadow-primary-sm)',
                        }}>
                          <Check style={{ width: 11, height: 11, color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* No coverage warning */}
            {selectedPatient && !selectedCoverage && (
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertTitle>No Active Coverage — Cannot Proceed</AlertTitle>
                <AlertDescription>
                  This patient has no active insurance coverage. Please select a different patient or update coverage records first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </WizardCard>
      )}

      {/* ── Step 2: Encounter ─────────────────────────────────────────────── */}
      {step === 2 && (
        <WizardCard>
          <CardSection
            label="Select Encounter"
            sub={selectedPatient ? `Choose an encounter for ${formatPatientName(selectedPatient)}` : 'Choose the clinical encounter for this GOP request.'}
          />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {patientEncounters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 'var(--font-size-sm)', color: C.muted }}>
                <i className="fas fa-stethoscope" style={{ fontSize: 28, display: 'block', marginBottom: 12, opacity: 0.3 }} />
                No encounters found for this patient.
              </div>
            ) : patientEncounters.map(enc => {
              const est        = estimates.find(e => e.encounterId === enc.id)
              const isSelected = enc.id === selectedEncounterId
              const isEmergency = enc.class.code === 'EMER'

              return (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEncounterId(enc.id)}
                  style={{
                    padding: '16px 18px', borderRadius: C.radMd, cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                    background: isSelected ? C.primarySub : C.bgCard,
                    transition: C.transition, position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.gray50 }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.bgCard }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    {/* Left */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: C.radSm, flexShrink: 0,
                          background: isEmergency ? '#FEF2F2' : 'var(--blue-50)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="fas fa-stethoscope" style={{ fontSize: 12, color: isEmergency ? 'var(--destructive)' : C.primary }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: C.fg, lineHeight: 1.3 }}>
                            {enc.reasonCode?.[0]?.text}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                            {enc.serviceProvider.display}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted, paddingLeft: 40 }}>
                        <i className="fas fa-user-md" style={{ fontSize: 10 }} />
                        <span>{enc.participant[0]?.individual.display}</span>
                      </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: C.radFull,
                        background: isEmergency ? '#FEF2F2' : C.gray100,
                        color: isEmergency ? 'var(--destructive)' : C.gray500,
                        border: `1px solid ${isEmergency ? '#FECACA' : C.border}`,
                      }}>
                        {enc.class.display}
                      </span>
                      {est && (
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: C.fg, fontVariantNumeric: 'tabular-nums' }}>
                          ${est.total.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginTop: 10, paddingTop: 10,
                      borderTop: `1px solid ${C.border}`,
                      fontSize: 11, fontWeight: 600, color: C.primary,
                    }}>
                      <Check style={{ width: 12, height: 12 }} />
                      Selected
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </WizardCard>
      )}

      {/* ── Step 3: Insurer form ──────────────────────────────────────────── */}
      {step === 3 && (
        <WizardCard>
          <CardSection
            label="Select Insurer Form"
            sub={selectedCoverage
              ? `Coverage: ${selectedCoverage.insurer} — ${selectedCoverage.planName}`
              : 'Select the applicable pre-authorisation form.'}
          />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Expired coverage warning */}
            {coverageExpired && (
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertTitle>Coverage May Be Expired</AlertTitle>
                <AlertDescription>
                  The patient&apos;s {selectedCoverage?.insurer} coverage appears inactive or expired. The insurer may reject this request — verify coverage dates before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {/* Form options */}
            {MOCK_QUESTIONNAIRES.map(q => {
              const isSelected  = q.id === selectedFormId
              const isSuggested = selectedCoverage?.insurer === q.insurer

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedFormId(q.id)}
                  style={{
                    padding: '16px 18px', borderRadius: C.radMd, cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? C.primary : isSuggested ? 'var(--blue-200)' : C.border}`,
                    background: isSelected ? C.primarySub : isSuggested ? 'var(--blue-50)' : C.bgCard,
                    transition: C.transition,
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.gray50 }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isSuggested ? 'var(--blue-50)' : C.bgCard }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: C.radSm, flexShrink: 0,
                          background: isSelected ? C.primarySub : 'var(--blue-50)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="fas fa-file-medical" style={{ fontSize: 13, color: C.primary }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: C.fg }}>{q.title}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                            Version {q.version} · {q.item.length} sections
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isSuggested && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: C.radFull,
                          background: 'var(--gradient-primary)', color: '#fff',
                        }}>
                          Recommended
                        </span>
                      )}
                      {isSelected && (
                        <div style={{
                          width: 22, height: 22, borderRadius: C.radFull,
                          background: 'var(--gradient-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: 'var(--shadow-primary-sm)',
                        }}>
                          <Check style={{ width: 12, height: 12, color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* AI notice */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: C.radMd,
              background: C.aiBg, border: `1px solid var(--ai-border)`,
            }}>
              <Sparkles style={{ width: 16, height: 16, color: C.aiColor, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: C.aiColor, marginBottom: 3 }}>
                  AI-Assisted Prefill
                </div>
                <div style={{ fontSize: 12, color: C.aiColor, lineHeight: 1.5, opacity: 0.85 }}>
                  After creating this request, Claude AI will read the patient&apos;s FHIR records to prefill the physician section. All AI-filled fields will be flagged for doctor review.
                </div>
              </div>
            </div>
          </div>
        </WizardCard>
      )}

      {/* ── Step 4: Review ────────────────────────────────────────────────── */}
      {step === 4 && (
        <WizardCard>
          <CardSection
            label="Review & Create"
            sub="Confirm all details before creating the GOP request."
          />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Summary table */}
            <div style={{ background: C.gray50, borderRadius: C.radMd, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {[
                { label: 'Patient',        value: selectedPatient ? formatPatientName(selectedPatient) : '—', icon: 'fas fa-user' },
                { label: 'Coverage',       value: selectedCoverage ? `${selectedCoverage.insurer} — ${selectedCoverage.planName}` : '—', icon: 'fas fa-shield-alt' },
                { label: 'Encounter',      value: selectedEncounter?.reasonCode?.[0]?.text ?? '—', icon: 'fas fa-stethoscope' },
                { label: 'Doctor',         value: selectedEncounter?.participant[0]?.individual.display ?? '—', icon: 'fas fa-user-md' },
                { label: 'Estimated Cost', value: selectedEstimate ? `$${selectedEstimate.total.toLocaleString()} USD` : '—', icon: 'fas fa-dollar-sign' },
                { label: 'Insurer Form',   value: selectedForm?.title ?? '—', icon: 'fas fa-file-medical' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: C.radSm, flexShrink: 0,
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={item.icon} style={{ fontSize: 11, color: C.gray400 }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.muted, width: 110, flexShrink: 0, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: C.fg, flex: 1, textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Priority selector */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Request Priority
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {([
                  { value: 'ROUTINE'   as GOPPriority, label: 'Routine',   desc: 'Standard elective',      color: C.gray500,              borderClr: C.border,         bg: C.gray50,      badgeCls: 'badge-routine'   },
                  { value: 'URGENT'    as GOPPriority, label: 'Urgent',    desc: 'Required within 24h',    color: 'var(--priority-urgent-text)',   borderClr: '#FDE68A',        bg: '#FFFBEB',     badgeCls: 'badge-urgent'    },
                  { value: 'EMERGENCY' as GOPPriority, label: 'Emergency', desc: 'Immediate — critical',   color: 'var(--priority-emergency-text)', borderClr: '#FECACA',       bg: '#FEF2F2',     badgeCls: 'badge-emergency' },
                ] as const).map(opt => {
                  const isChosen = priority === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        padding: '14px 14px', borderRadius: C.radMd, textAlign: 'left',
                        border: `2px solid ${isChosen ? C.primary : opt.borderClr}`,
                        background: isChosen ? C.primarySub : opt.bg,
                        cursor: 'pointer', transition: C.transition,
                        boxShadow: isChosen ? 'var(--shadow-primary-sm)' : 'none',
                      }}
                    >
                      <span className={`badge ${opt.badgeCls}`} style={{ alignSelf: 'flex-start' }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{opt.desc}</span>
                    </button>
                  )
                })}
              </div>

              {priority === 'EMERGENCY' && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10,
                  padding: '12px 14px', borderRadius: C.radMd,
                  background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#991B1B',
                }}>
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                  <span>Emergency priority places this request at the top of all queues. Ensure the classification is clinically justified.</span>
                </div>
              )}
            </div>

            {/* Workflow steps */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                What Happens Next
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: 'fas fa-robot',       color: 'var(--ai-color)',  bg: 'var(--ai-bg)',    text: 'AI reads FHIR records and prefills the physician section automatically.' },
                  { icon: 'fas fa-stethoscope', color: C.success,          bg: C.successSub,      text: 'Assigned surgeon reviews and verifies clinical fields, then signs.' },
                  { icon: 'fas fa-user-md',     color: C.primary,          bg: C.primarySub,      text: 'Assigned anaesthetist verifies the anaesthetic plan and signs.' },
                  { icon: 'fas fa-dollar-sign', color: C.warning,          bg: 'var(--warning-subtle)', text: 'Finance reviews the cost estimate and confirms the figures.' },
                  { icon: 'fas fa-paper-plane', color: 'var(--accent)',     bg: '#EEF2FF',         text: 'Insurance Staff finalises and submits the GOP to the insurer.' },
                ].map((wStep, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: C.radFull,
                        background: wStep.bg, border: `1px solid ${wStep.bg}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <i className={wStep.icon} style={{ fontSize: 11, color: wStep.color }} />
                      </div>
                      {i < 4 && (
                        <div style={{ width: 1, height: 10, background: C.border, marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 6, flex: 1 }}>
                      <span style={{ fontSize: 12, color: C.gray700, lineHeight: 1.5 }}>{wStep.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI notice */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: C.radMd,
              background: C.aiBg, border: `1px solid var(--ai-border)`,
            }}>
              <Sparkles style={{ width: 14, height: 14, color: C.aiColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.aiColor, lineHeight: 1.5 }}>
                AI will prefill the physician section using FHIR records. The assigned doctor must verify before submission.
              </span>
            </div>
          </div>
        </WizardCard>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 4, gap: 12,
      }}>
        {/* Step indicator pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              width: step === s.id ? 20 : 6, height: 6,
              borderRadius: C.radFull,
              background: step > s.id ? C.success : step === s.id ? C.primary : C.border,
              transition: C.transition,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(s => s - 1) : undefined}
            disabled={step === 1}
            style={{ minWidth: 100 }}
          >
            <ChevronLeft style={{ width: 14, height: 14, marginRight: 4 }} />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canContinue}
              style={{ minWidth: 120 }}
            >
              Continue
              <ChevronRight style={{ width: 14, height: 14, marginLeft: 4 }} />
            </Button>
          ) : (
            <Button
              onClick={() => {
                const newId = createGOPRequest({
                  patientId:       selectedPatientId,
                  patientName:     selectedPatient ? formatPatientName(selectedPatient) : '',
                  encounterId:     selectedEncounterId,
                  coverageId:      selectedCoverage?.id ?? '',
                  insurer:         selectedCoverage?.insurer ?? '',
                  questionnaireId: selectedFormId,
                  assignedSurgeon: selectedEncounter?.participant[0]?.individual.display ?? null,
                  estimatedAmount: selectedEstimate?.total ?? 0,
                  createdBy:       session?.user?.name ?? 'Insurance Staff',
                  createdByRole:   session?.user?.role ?? 'INSURANCE_STAFF',
                  priority,
                })
                setCreatedGopId(newId)
              }}
              style={{ minWidth: 160 }}
            >
              <FileText style={{ width: 14, height: 14, marginRight: 6 }} />
              Create GOP Request
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
