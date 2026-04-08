import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, User, MapPin, Calendar, Stethoscope, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import type { MockPatient, MockEncounter, MockCoverage, MockGOPRequest } from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'

interface DoctorPatientListProps {
  patients: MockPatient[]
  encounters: MockEncounter[]
  coverages: MockCoverage[]
  gopRequests: MockGOPRequest[]
}

function CoverageBadge({ coverage }: { coverage: MockCoverage | null }) {
  if (!coverage) {
    return (
      <Badge variant="destructive" className="text-[10px] gap-1">
        <ShieldOff className="size-2.5" />
        No Coverage
      </Badge>
    )
  }
  if (coverage.status !== 'active') {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <ShieldOff className="size-2.5" />
        Inactive
      </Badge>
    )
  }
  return (
    <Badge className="text-[10px] gap-1 bg-green-100 text-green-800 border border-green-200">
      <ShieldCheck className="size-2.5" />
      {coverage.insurer}
    </Badge>
  )
}

function formatAdmissionDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function EncounterStatusBadge({ status }: { status: MockEncounter['status'] }) {
  if (status === 'in-progress') {
    return <Badge className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200">Admitted</Badge>
  }
  if (status === 'planned') {
    return <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">Planned</Badge>
  }
  return <Badge variant="secondary" className="text-[10px]">Discharged</Badge>
}

export function DoctorPatientList({
  patients,
  encounters,
  coverages,
  gopRequests,
}: DoctorPatientListProps) {
  // Only show patients that have encounters
  const patientsWithEncounters = patients
    .map((patient) => {
      const encounter = encounters.find(
        (enc) => enc.subject.reference === `Patient/${patient.id}`
      )
      if (!encounter) return null
      const coverage = coverages.find(
        (cov) => cov.beneficiary.reference === `Patient/${patient.id}`
      ) ?? null
      const existingGOP = gopRequests.find(
        (r) => r.patientId === patient.id && r.status === 'DRAFT'
      )
      const hospitalId = patient.identifier.find(
        (id) => id.system === 'hospital.local/id'
      )?.value ?? '—'
      return { patient, encounter, coverage, existingGOP, hospitalId }
    })
    .filter(Boolean) as Array<{
      patient: MockPatient
      encounter: MockEncounter
      coverage: MockCoverage | null
      existingGOP: MockGOPRequest | undefined
      hospitalId: string
    }>

  // Sort: in-progress first, then planned, then finished
  const statusOrder: Record<MockEncounter['status'], number> = {
    'in-progress': 0,
    planned: 1,
    finished: 2,
  }
  patientsWithEncounters.sort(
    (a, b) => statusOrder[a.encounter.status] - statusOrder[b.encounter.status]
  )

  if (patientsWithEncounters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No current patients found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {patientsWithEncounters.length} patient{patientsWithEncounters.length !== 1 ? 's' : ''} currently on record
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patientsWithEncounters.map(({ patient, encounter, coverage, existingGOP, hospitalId }) => {
          const doctorDisplay = encounter.participant[0]?.individual.display ?? '—'
          const ward = encounter.serviceProvider.display
          const admissionDate = encounter.period.start

          return (
            <Card key={patient.id} className="flex flex-col">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {formatPatientName(patient)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {calculateAge(patient.birthDate)} yrs · {patient.gender}
                      </p>
                    </div>
                  </div>
                  <EncounterStatusBadge status={encounter.status} />
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 flex flex-col flex-1 gap-3">
                {/* Detail rows */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                      {hospitalId}
                    </span>
                    <CoverageBadge coverage={coverage} />
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{ward}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3 shrink-0" />
                    <span>Admitted {formatAdmissionDate(admissionDate)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Stethoscope className="size-3 shrink-0" />
                    <span className="truncate">{doctorDisplay}</span>
                  </div>

                  {encounter.reasonCode?.[0] && (
                    <p className="text-[11px] text-muted-foreground italic border-t pt-1.5 mt-1">
                      {encounter.reasonCode[0].text}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 flex gap-2">
                  <Link href={`/patients/${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Profile
                    </Button>
                  </Link>
                  {existingGOP ? (
                    <Link href={`/gop/${existingGOP.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                        <Clock className="size-3" />
                        Open GOP
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/gop/new?patientId=${patient.id}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs gap-1">
                        <PlusCircle className="size-3" />
                        Initiate GOP
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
