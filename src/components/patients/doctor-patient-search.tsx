'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowRight, Search, SlidersHorizontal, ShieldCheck, ShieldOff, X } from 'lucide-react'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import type { MockPatient, MockEncounter, MockCoverage, MockGOPRequest } from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'

interface DoctorPatientSearchProps {
  patients?: MockPatient[]
  encounters?: MockEncounter[]
  coverages?: MockCoverage[]
  gopRequests: MockGOPRequest[]
}

const ALL_VALUE = '__ALL__'

export function DoctorPatientSearch({
  patients = [],
  encounters = [],
  coverages = [],
  gopRequests,
}: DoctorPatientSearchProps) {
  const [nameQuery, setNameQuery] = useState('')
  const [wardFilter, setWardFilter] = useState(ALL_VALUE)
  const [physicianFilter, setPhysicianFilter] = useState(ALL_VALUE)
  const [admissionFrom, setAdmissionFrom] = useState('')
  const [admissionTo, setAdmissionTo] = useState('')

  // Derive unique wards and physicians from encounters - safe map
  const wards = useMemo(() => {
    if (!encounters) return []
    const set = new Set(encounters.map((e) => e.serviceProvider.display))
    return Array.from(set).sort()
  }, [encounters])

  const physicians = useMemo(() => {
    if (!encounters) return []
    const set = new Set(
      encounters
        .map((e) => e.participant[0]?.individual.display)
        .filter(Boolean)
    )
    return Array.from(set).sort()
  }, [encounters])

  // Join patients with encounters + coverage - safe
  const rows = useMemo(() => {
    const safePatients = patients ?? []
    const safeEncounters = encounters ?? []
    const safeCoverages = coverages ?? []
    const safeGopRequests = gopRequests ?? []
    return safePatients
      .map((patient) => {
        const encounter = safeEncounters.find(
          (e) => e.subject.reference === `Patient/${patient.id}`
        )
        const coverage = safeCoverages.find(
          (c) => c.beneficiary.reference === `Patient/${patient.id}`
        ) ?? null
        const latestGOP = safeGopRequests
          .filter((r) => r.patientId === patient.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        const hospitalId = patient.identifier.find(
          (id) => id.system === 'hospital.local/id'
        )?.value ?? '—'
        return { patient, encounter, coverage, latestGOP, hospitalId }
      })
      .filter((r) => r.encounter != null) as Array<{
        patient: MockPatient
        encounter: MockEncounter
        coverage: MockCoverage | null
        latestGOP: MockGOPRequest | undefined
        hospitalId: string
      }>
  }, [patients, encounters, coverages, gopRequests])

  // Apply filters - safe
  const filtered = useMemo(() => {
    return rows.filter(({ patient, encounter, coverage }) => {
      if (!encounter) return false
      // Name search
      if (nameQuery.trim()) {
        const full = formatPatientName(patient).toLowerCase()
        if (!full.includes(nameQuery.trim().toLowerCase())) return false
      }
      // Ward filter
      if (wardFilter !== ALL_VALUE && encounter.serviceProvider.display !== wardFilter) return false
      // Physician filter
      if (physicianFilter !== ALL_VALUE) {
        const doc = encounter.participant[0]?.individual.display
        if (doc !== physicianFilter) return false
      }
      // Admission date range
      if (admissionFrom) {
        if (new Date(encounter.period.start) < new Date(admissionFrom)) return false
      }
      if (admissionTo) {
        if (new Date(encounter.period.start) > new Date(admissionTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [rows, nameQuery, wardFilter, physicianFilter, admissionFrom, admissionTo])

  const hasFilters =
    nameQuery.trim() ||
    wardFilter !== ALL_VALUE ||
    physicianFilter !== ALL_VALUE ||
    admissionFrom ||
    admissionTo

  function clearFilters() {
    setNameQuery('')
    setWardFilter(ALL_VALUE)
    setPhysicianFilter(ALL_VALUE)
    setAdmissionFrom('')
    setAdmissionTo('')
  }

  return (
    <div className="space-y-4">
      {/* Filter panel */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs gap-1 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="size-3" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Name search */}
            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs">Patient Name</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name…"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {/* Ward filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Ward / Department</Label>
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All wards</SelectItem>
                  {(wards ?? []).map((ward) => (
                    <SelectItem key={ward} value={ward}>
                      {ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned physician */}
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned Physician</Label>
              <Select value={physicianFilter} onValueChange={setPhysicianFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All physicians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All physicians</SelectItem>
                  {(physicians ?? []).map((doc) => (
                    <SelectItem key={doc} value={doc}>
                      {doc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Admission date range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Admission Date Range</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={admissionFrom}
                  onChange={(e) => setAdmissionFrom(e.target.value)}
                  className="h-8 text-sm"
                  title="From"
                />
                <span className="text-muted-foreground text-xs shrink-0">to</span>
                <Input
                  type="date"
                  value={admissionTo}
                  onChange={(e) => setAdmissionTo(e.target.value)}
                  className="h-8 text-sm"
                  title="To"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {(filtered.length || 0)} patient{(filtered.length !== 1) ? 's' : ''} found
        {hasFilters && ' matching your filters'}
      </p>

      {/* Results table */}
      {(filtered.length || 0) === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No patients match the selected filters.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Hospital ID</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead>Physician</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Latest GOP</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ patient, encounter, coverage, latestGOP, hospitalId }) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{formatPatientName(patient)}</p>
                        <p className="text-xs text-muted-foreground">
                          {calculateAge(patient.birthDate)} yrs · {patient.gender}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {hospitalId}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{encounter.serviceProvider.display}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(encounter.period.start).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {encounter.participant[0]?.individual.display ?? '—'}
                    </TableCell>
                    <TableCell>
                      {coverage ? (
                        <Badge className="text-[10px] gap-1 bg-green-100 text-green-800 border border-green-200">
                          <ShieldCheck className="size-2.5" />
                          {coverage.insurer}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <ShieldOff className="size-2.5" />
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {latestGOP ? (
                        <GOPStatusBadge status={latestGOP.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

