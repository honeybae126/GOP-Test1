'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MockPatient, MockCoverage } from '@/lib/mock-data'
import { formatPatientName, calculateAge } from '@/lib/mock-data'
import {
  Search, Phone, Mail, MapPin, Shield, ShieldOff,
  ChevronRight, PlusCircle,
} from 'lucide-react'

interface PatientSearchListProps {
  patients: MockPatient[]
  coverages: MockCoverage[]
}

const AVATAR_COLORS = [
  { bg: '#EEF3FF', color: '#2D6BF4' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FFF0F9', color: '#BE185D' },
]

function getAvatarColor(name: string) {
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
      const matchSearch = !search || name.includes(q) || hospitalId.toLowerCase().includes(q) || national.toLowerCase().includes(q)
      const matchGender = genderFilter === 'all' || p.gender === genderFilter
      return matchSearch && matchGender
    })
  }, [patients, search, genderFilter])

  return (
    <div className="space-y-4">
      {/* Search / filter bar */}
      <div
        className="flex items-center gap-3 flex-wrap p-3 rounded-xl"
        style={{ background: '#FFFFFF', border: '1px solid #D8DEF0' }}
      >
        {/* Search input */}
        <div className="relative flex-1" style={{ minWidth: 240, maxWidth: 380 }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5"
            style={{ color: '#9BA3B8' }}
          />
          <input
            placeholder="Search by name, hospital ID, or national ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg outline-none transition-colors"
            style={{
              background: '#F5F7FF',
              border: '1px solid #D8DEF0',
              color: '#1A1F3C',
            }}
          />
        </div>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger
            className="h-9 text-sm w-36 rounded-lg"
            style={{ background: '#F5F7FF', border: '1px solid #D8DEF0' }}
          >
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs font-medium" style={{ color: '#6B7494' }}>
          {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Patient grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(patient => {
          const coverage = coverageMap[patient.id]
          const name = formatPatientName(patient)
          const age = calculateAge(patient.birthDate)
          const hospitalId = patient.identifier.find(i => i.system === 'hospital.local/id')?.value
          const phone = patient.telecom?.find(t => t.system === 'phone')?.value
          const email = patient.telecom?.find(t => t.system === 'email')?.value
          const address = patient.address?.[0]
          const avatar = getAvatarColor(name)

          return (
            <div
              key={patient.id}
              className="bg-white rounded-2xl flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
              style={{
                border: '1px solid #D8DEF0',
                boxShadow: '0 2px 8px rgba(45,107,244,0.06)',
              }}
            >
              {/* Card header */}
              <div className="p-4 flex items-start gap-3" style={{ borderBottom: '1px solid #F0F2F8' }}>
                {/* Avatar */}
                <div
                  className="size-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: avatar.bg, color: avatar.color }}
                >
                  {getInitials(name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#1A1F3C' }}>
                    {name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>
                    {age} yrs · {patient.gender === 'male' ? 'Male' : 'Female'}
                    {hospitalId && (
                      <span
                        className="ml-2 font-mono font-semibold px-1.5 py-0.5 rounded text-[10px]"
                        style={{ background: '#F0F2F8', color: '#6B7494' }}
                      >
                        {hospitalId}
                      </span>
                    )}
                  </div>

                  {/* Coverage inline */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {coverage ? (
                      <>
                        <Shield className="size-3" style={{ color: '#16A34A' }} />
                        <span className="text-xs font-medium" style={{ color: '#16A34A' }}>
                          {coverage.insurer}
                        </span>
                        <span className="text-xs" style={{ color: '#9BA3B8' }}>
                          — {coverage.planName}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="size-3" style={{ color: '#9BA3B8' }} />
                        <span className="text-xs" style={{ color: '#9BA3B8' }}>No active coverage</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="space-y-1.5">
                  {phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <Phone className="size-3 flex-shrink-0" />
                      {phone}
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <Mail className="size-3 flex-shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {address && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                      <MapPin className="size-3 flex-shrink-0" />
                      <span className="truncate">
                        {[...(address.line ?? []), address.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                  <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs rounded-lg">
                    <Link href={`/patients/${patient.id}`}>
                      View Details
                      <ChevronRight className="size-3" />
                    </Link>
                  </Button>
                  {coverage && (
                    <Button size="sm" asChild className="h-8 text-xs rounded-lg px-3">
                      <Link href={`/gop/new?patientId=${patient.id}`}>
                        <PlusCircle className="size-3" />
                        GOP
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div
            className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px dashed #D8DEF0' }}
          >
            <Search className="size-8 mb-3" style={{ color: '#D8DEF0' }} />
            <p className="text-sm font-medium" style={{ color: '#1A1F3C' }}>No patients found</p>
            <p className="text-xs mt-1" style={{ color: '#6B7494' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
