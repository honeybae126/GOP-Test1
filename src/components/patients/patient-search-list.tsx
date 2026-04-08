'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MockPatient, MockCoverage } from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  ChevronRight,
  PlusCircle,
} from 'lucide-react'

interface PatientSearchListProps {
  patients: MockPatient[]
  coverages: MockCoverage[]
}

export function PatientSearchList({ patients, coverages }: PatientSearchListProps) {
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('all')

  const coverageMap = useMemo(() => {
    const map: Record<string, MockCoverage> = {}
    coverages.forEach(c => {
      const patientId = c.beneficiary.reference.split('/')[1]
      map[patientId] = c
    })
    return map
  }, [coverages])

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const name = formatPatientName(p).toLowerCase()
      const hospitalId = p.identifier.find(i => i.system === 'hospital.local/id')?.value ?? ''
      const national = p.identifier.find(i => i.system === 'national-id')?.value ?? ''
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        name.includes(q) ||
        hospitalId.toLowerCase().includes(q) ||
        national.toLowerCase().includes(q)
      const matchGender = genderFilter === 'all' || p.gender === genderFilter
      return matchSearch && matchGender
    })
  }, [patients, search, genderFilter])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, hospital ID, or national ID…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground self-center">
          {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Patient cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(patient => {
          const coverage = coverageMap[patient.id]
          const name = formatPatientName(patient)
          const age = calculateAge(patient.birthDate)
          const hospitalId = patient.identifier.find(i => i.system === 'hospital.local/id')?.value
          const phone = patient.telecom?.find(t => t.system === 'phone')?.value
          const email = patient.telecom?.find(t => t.system === 'email')?.value
          const address = patient.address?.[0]

          return (
            <Card key={patient.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="size-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription className="text-xs">
                        {age} yrs · {patient.gender === 'male' ? 'Male' : 'Female'} · {hospitalId}
                      </CardDescription>
                    </div>
                  </div>
                </div>

                {coverage ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Shield className="size-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">{coverage.insurer}</span>
                    <span className="text-xs text-muted-foreground">— {coverage.planName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Shield className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No active coverage</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-1.5 pt-0">
                {phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {phone}
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    {email}
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {address.line.join(', ')}, {address.city}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Link href={`/patients/${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                      <ChevronRight className="size-3 ml-1" />
                    </Button>
                  </Link>
                  {coverage && (
                    <Link href={`/gop/new?patientId=${patient.id}`}>
                      <Button size="sm">
                        <PlusCircle className="size-3 mr-1" />
                        GOP
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Search className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
