'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, MapPin, Calendar, Stethoscope, ShieldCheck, ShieldOff, Clock, Activity } from 'lucide-react'
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

function getPatientInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const ENCOUNTER_STATUS_CONFIG = {
  'in-progress': { label: 'Admitted',   dot: '#2D6BF4', bg: '#EEF3FF', color: '#2D6BF4' },
  'planned':     { label: 'Planned',    dot: '#F59E0B', bg: '#FFFBEB', color: '#92400E' },
  'finished':    { label: 'Discharged', dot: '#9BA3B8', bg: '#F0F2F8', color: '#6B7494' },
} as const

function EncounterStatusDot({ status }: { status: MockEncounter['status'] }) {
  const cfg = ENCOUNTER_STATUS_CONFIG[status] ?? ENCOUNTER_STATUS_CONFIG['finished']
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function CoveragePill({ coverage }: { coverage: MockCoverage | null }) {
  if (!coverage) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
        <ShieldOff className="size-2.5" />
        No Coverage
      </span>
    )
  }
  if (coverage.status !== 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        <ShieldOff className="size-2.5" />
        Inactive
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
      <ShieldCheck className="size-2.5" />
      {coverage.insurer}
    </span>
  )
}

function formatAdmissionDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PRIORITY_ORDER: Record<GOPPriority, number> = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 }

const AVATAR_COLORS = [
  { bg: '#EEF3FF', color: '#2D6BF4' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FFF0F9', color: '#BE185D' },
]

function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

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

  const statusOrder: Record<MockEncounter['status'], number> = { 'in-progress': 0, planned: 1, finished: 2 }
  patientsWithEncounters.sort((a, b) => {
    const aOverdue = a.isOverdue ? 0 : a.slaStatus?.isWarning ? 1 : 2
    const bOverdue = b.isOverdue ? 0 : b.slaStatus?.isWarning ? 1 : 2
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    const pd = PRIORITY_ORDER[a.existingGOP?.priority ?? 'ROUTINE'] - PRIORITY_ORDER[b.existingGOP?.priority ?? 'ROUTINE']
    if (pd !== 0) return pd
    return statusOrder[a.encounter.status] - statusOrder[b.encounter.status]
  })

  if (patientsWithEncounters.length === 0) {
    return (
      <div
        className="rounded-2xl text-center py-16"
        style={{
          background: '#FFFFFF',
          border: '1px dashed #D8DEF0',
          color: '#6B7494',
          fontSize: 13,
        }}
      >
        No current patients found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium" style={{ color: '#6B7494' }}>
        {patientsWithEncounters.length} patient{patientsWithEncounters.length !== 1 ? 's' : ''} on record
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {patientsWithEncounters.map(({ patient, encounter, coverage, existingGOP, hospitalId, isOverdue }) => {
          const name = formatPatientName(patient)
          const age = calculateAge(patient.birthDate)
          const doctorDisplay = encounter.participant[0]?.individual.display ?? '—'
          const ward = encounter.serviceProvider.display
          const gopPriority = existingGOP?.priority ?? 'ROUTINE'
          const isEmergency = gopPriority === 'EMERGENCY'
          const avatarColor = getAvatarColor(name)
          const accentLeft = isOverdue ? '#EF4444' : isEmergency ? '#EF4444' : undefined

          return (
            <div
              key={patient.id}
              className="bg-white rounded-2xl flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
              style={{
                border: `1px solid #D8DEF0`,
                borderLeft: accentLeft ? `3px solid ${accentLeft}` : '1px solid #D8DEF0',
                boxShadow: '0 2px 8px rgba(45,107,244,0.06)',
              }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 p-4" style={{ borderBottom: '1px solid #F0F2F8' }}>
                <div className="flex items-center gap-3">
                  {/* Initials avatar */}
                  <div
                    className="size-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: avatarColor.bg, color: avatarColor.color }}
                  >
                    {getPatientInitials(name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1A1F3C', lineHeight: 1.2 }}>
                      {name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>
                      {age} yrs · {patient.gender}
                    </div>
                  </div>
                </div>

                {/* Status stack */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <EncounterStatusDot status={encounter.status} />
                  {gopPriority !== 'ROUTINE' && existingGOP && (
                    <PriorityBadge priority={gopPriority} size="sm" />
                  )}
                  {existingGOP && <SLAIndicator req={existingGOP} compact />}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex-1 flex flex-col gap-4">
                {/* Meta info */}
                <div className="space-y-2">
                  {/* Hospital ID + coverage */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: '#F0F2F8', color: '#6B7494' }}
                    >
                      {hospitalId}
                    </span>
                    <CoveragePill coverage={coverage} />
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <MapPin className="size-3 flex-shrink-0" />
                      <span className="truncate">{ward}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <Calendar className="size-3 flex-shrink-0" />
                      <span>Admitted {formatAdmissionDate(encounter.period.start)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <Stethoscope className="size-3 flex-shrink-0" />
                      <span className="truncate">{doctorDisplay}</span>
                    </div>
                    {encounter.reasonCode?.[0] && (
                      <div className="flex items-start gap-2 text-xs mt-1 pt-2" style={{ color: '#9BA3B8', borderTop: '1px solid #F0F2F8' }}>
                        <Activity className="size-3 flex-shrink-0 mt-0.5" />
                        <span className="italic">{encounter.reasonCode[0].text}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 h-8 text-xs rounded-lg"
                  >
                    <Link href={`/patients/${patient.id}`}>View Profile</Link>
                  </Button>

                  {existingGOP ? (
                    <div className="flex-1 flex flex-col gap-1">
                      <Button
                        size="sm"
                        asChild
                        className="h-8 text-xs w-full rounded-lg"
                        style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', boxShadow: 'none' }}
                      >
                        <Link href={`/gop/${existingGOP.id}`}>
                          <Clock className="size-3" /> Open GOP
                        </Link>
                      </Button>
                      {(() => {
                        const sub = getDraftSubStatus(existingGOP)
                        if (!sub) return null
                        const s = DRAFT_SUB_STATUS_STYLES[sub]
                        return (
                          <span style={{ display: 'block', textAlign: 'center', borderRadius: 9999, fontWeight: 600, fontSize: 10, padding: '2px 8px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                            {sub}
                          </span>
                        )
                      })()}
                    </div>
                  ) : (
                    <Button size="sm" asChild className="flex-1 h-8 text-xs rounded-lg">
                      <Link href={`/gop/new?patientId=${patient.id}`}>
                        <PlusCircle className="size-3" /> Initiate GOP
                      </Link>
                    </Button>
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
