'use client'

import Link from 'next/link'
import { PlusCircle, User, MapPin, Calendar, Stethoscope, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import type { MockPatient, MockEncounter, MockCoverage, GOPPriority } from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'
import { getDraftSubStatus, DRAFT_SUB_STATUS_STYLES } from '@/lib/gop-utils'
import { PriorityBadge } from '@/components/gop/priority-badge'
import { useGopStore } from '@/lib/gop-store'
import { getSLAStatus } from '@/lib/sla-utils'
import { SLAIndicator } from '@/components/gop/sla-indicator'

interface DoctorPatientListProps {
  patients: MockPatient[]
  encounters: MockEncounter[]
  coverages: MockCoverage[]
}

function CoveragePill({ coverage }: { coverage: MockCoverage | null }) {
  if (!coverage) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 500, padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
      }}>
        <ShieldOff style={{ width: 10, height: 10 }} />
        No Coverage
      </span>
    )
  }
  if (coverage.status !== 'active') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 500, padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--border-medium)',
      }}>
        <ShieldOff style={{ width: 10, height: 10 }} />
        Inactive
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 500, padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
    }}>
      <ShieldCheck style={{ width: 10, height: 10 }} />
      {coverage.insurer}
    </span>
  )
}

function EncounterStatusPill({ status }: { status: MockEncounter['status'] }) {
  if (status === 'in-progress') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 500, padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid var(--blue-200)',
      }}>Admitted</span>
    )
  }
  if (status === 'planned') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 500, padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A',
      }}>Planned</span>
    )
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--border-medium)',
    }}>Discharged</span>
  )
}

function formatAdmissionDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const PRIORITY_ORDER: Record<GOPPriority, number> = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 }

export function DoctorPatientList({
  patients = [],
  encounters = [],
  coverages = [],
}: DoctorPatientListProps) {
  const gopRequests = useGopStore((s) => s.requests)

  const patientsWithEncounters = patients.map((patient) => {
    const encounter = encounters.find((enc) => enc.subject.reference === `Patient/${patient.id}`)
    if (!encounter) return null
    const coverage = coverages.find((cov) => cov.beneficiary.reference === `Patient/${patient.id}`) ?? null
    const existingGOP = gopRequests.find((r) => r.patientId === patient.id && r.status === 'DRAFT')
    const hospitalId = patient.identifier.find((id) => id.system === 'hospital.local/id')?.value ?? '—'
    const slaStatus = existingGOP ? getSLAStatus(existingGOP) : null
    const isOverdue = slaStatus?.isOverdue ?? false
    return { patient, encounter, coverage, existingGOP, hospitalId, slaStatus, isOverdue }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  const statusOrder: Record<MockEncounter['status'], number> = {
    'in-progress': 0, planned: 1, finished: 2,
  }
  patientsWithEncounters.sort((a, b) => {
    const aOverdue = a.isOverdue ? 0 : a.slaStatus?.isWarning ? 1 : 2
    const bOverdue = b.isOverdue ? 0 : b.slaStatus?.isWarning ? 1 : 2
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    const aPriority = a.existingGOP?.priority ?? 'ROUTINE'
    const bPriority = b.existingGOP?.priority ?? 'ROUTINE'
    const pd = PRIORITY_ORDER[aPriority] - PRIORITY_ORDER[bPriority]
    if (pd !== 0) return pd
    return statusOrder[a.encounter.status] - statusOrder[b.encounter.status]
  })

  if (patientsWithEncounters.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '60px 20px',
        textAlign: 'center',
        fontSize: 13, color: 'var(--gray-400)',
      }}>
        No current patients found.
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
        {patientsWithEncounters.length} patient{patientsWithEncounters.length !== 1 ? 's' : ''} currently on record
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {patientsWithEncounters.map(({ patient, encounter, coverage, existingGOP, hospitalId, isOverdue }) => {
          const doctorDisplay = encounter.participant[0]?.individual.display ?? '—'
          const ward = encounter.serviceProvider.display
          const admissionDate = encounter.period.start
          const gopPriority = existingGOP?.priority ?? 'ROUTINE'
          const isEmergency = gopPriority === 'EMERGENCY'

          return (
            <div
              key={patient.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderLeft: isOverdue ? '4px solid #EF4444' : isEmergency ? '4px solid var(--priority-emergency-dot)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Card header */}
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isEmergency ? '#FEE2E2' : 'var(--blue-50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User style={{ width: 16, height: 16, color: isEmergency ? '#DC2626' : 'var(--blue-600)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', lineHeight: 1.2 }}>
                        {formatPatientName(patient)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        {calculateAge(patient.birthDate)} yrs · {patient.gender}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <EncounterStatusPill status={encounter.status} />
                    {gopPriority !== 'ROUTINE' && existingGOP && (
                      <PriorityBadge priority={gopPriority} size="sm" />
                    )}
                    {existingGOP && (
                      <SLAIndicator req={existingGOP} compact />
                    )}
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      background: 'var(--gray-100)', color: 'var(--gray-600)',
                      padding: '2px 6px', borderRadius: 4,
                    }}>{hospitalId}</span>
                    <CoveragePill coverage={coverage} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ward}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    <Calendar style={{ width: 12, height: 12, flexShrink: 0 }} />
                    <span>Admitted {formatAdmissionDate(admissionDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    <Stethoscope style={{ width: 12, height: 12, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctorDisplay}</span>
                  </div>
                  {encounter.reasonCode?.[0] && (
                    <p style={{
                      fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic',
                      borderTop: '1px solid var(--border-light)', paddingTop: 8, marginTop: 2,
                    }}>
                      {encounter.reasonCode[0].text}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', gap: 8 }}>
                  <Link href={`/patients/${patient.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{
                      width: '100%', padding: '7px 0',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
                      fontSize: 12, fontWeight: 500, color: 'var(--gray-700)', cursor: 'pointer',
                    }}
                      className="hover:bg-[#F8FAFF] transition-colors"
                    >
                      View Profile
                    </button>
                  </Link>
                  {existingGOP ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link href={`/gop/${existingGOP.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{
                          width: '100%', padding: '7px 0',
                          border: '1px solid #FDE68A',
                          borderRadius: 'var(--radius-md)', background: '#FFFBEB',
                          fontSize: 12, fontWeight: 500, color: '#92400E',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}
                          className="hover:bg-[#FEF3C7] transition-colors"
                        >
                          <Clock style={{ width: 11, height: 11 }} />
                          Open GOP
                        </button>
                      </Link>
                      {(() => {
                        const sub = getDraftSubStatus(existingGOP)
                        if (!sub) return null
                        const s = DRAFT_SUB_STATUS_STYLES[sub]
                        return (
                          <span className={`block text-center rounded-full font-medium ${s.pill}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {sub}
                          </span>
                        )
                      })()}
                    </div>
                  ) : (
                    <Link href={`/gop/new?patientId=${patient.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{
                        width: '100%', padding: '7px 0',
                        border: 'none',
                        borderRadius: 'var(--radius-md)', background: 'var(--blue-600)',
                        fontSize: 12, fontWeight: 500, color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        boxShadow: '0 1px 3px rgba(45,107,244,0.3)',
                      }}
                        className="hover:bg-[var(--blue-700)] transition-colors"
                      >
                        <PlusCircle style={{ width: 11, height: 11 }} />
                        Initiate GOP
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
