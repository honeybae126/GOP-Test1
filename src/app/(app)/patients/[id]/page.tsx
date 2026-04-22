import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import {
  getPatientById,
  getCoverageByPatientId,
  formatPatientName,
  calculateAge,
  MOCK_ENCOUNTERS,
  MOCK_GOP_REQUESTS,
  MOCK_COST_ESTIMATES,
} from '@/lib/mock-data'
import {
  Phone, Mail, MapPin, Shield, ShieldOff, Calendar,
  Stethoscope, PlusCircle, ArrowLeft, DollarSign,
} from 'lucide-react'

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

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #D8DEF0', boxShadow: '0 2px 8px rgba(45,107,244,0.06)' }}>
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ borderBottom: '1px solid #F0F2F8' }}>
      {children}
    </div>
  )
}

function KVRow({ label, value, mono, first }: { label: string; value: React.ReactNode; mono?: boolean; first?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
      style={{ borderTop: first ? undefined : '1px solid #F0F2F8' }}
    >
      <span style={{ color: '#6B7494', flexShrink: 0 }}>{label}</span>
      <span
        className="font-medium text-right"
        style={{ color: '#1A1F3C', fontFamily: mono ? 'var(--font-mono)' : undefined }}
      >
        {value}
      </span>
    </div>
  )
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (session?.user?.role === 'DOCTOR') redirect('/gop')
  if (session?.user?.role === 'FINANCE') redirect('/gop')

  const { id } = await params
  const patient = getPatientById(id)
  if (!patient) notFound()

  const coverage = getCoverageByPatientId(id)
  const encounters = MOCK_ENCOUNTERS.filter(e => e.subject.reference === `Patient/${id}`)
  const gopRequests = MOCK_GOP_REQUESTS.filter(r => r.patientId === id)
  const name = formatPatientName(patient)
  const age = calculateAge(patient.birthDate)
  const hospitalId = patient.identifier.find(i => i.system === 'hospital.local/id')?.value
  const nationalId = patient.identifier.find(i => i.system === 'national-id')?.value
  const phone = patient.telecom?.find(t => t.system === 'phone')?.value
  const email = patient.telecom?.find(t => t.system === 'email')?.value
  const address = patient.address?.[0]
  const avatar = getAvatarColor(name)

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/patients" className="text-tiny hover:underline" style={{ color: '#6B7494' }}>Patients</Link>
            <span className="text-tiny" style={{ color: '#9BA3B8' }}>/</span>
            <span className="text-tiny" style={{ color: '#1A1F3C' }}>{name}</span>
          </div>
          <h1 className="text-h1">{name}</h1>
          <p className="text-body mt-1" style={{ color: '#6B7494' }}>Patient record · {hospitalId}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/patients"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
          {coverage && (
            <Button size="sm" asChild>
              <Link href={`/gop/new?patientId=${id}`}><PlusCircle className="size-4" /> New GOP Request</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — patient info */}
        <div className="space-y-4">
          {/* Demographics */}
          <InfoCard>
            <CardHeader>
              <div
                className="size-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: avatar.bg, color: avatar.color }}
              >
                {getInitials(name)}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#1A1F3C' }}>{name}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>{age} yrs · {patient.gender === 'male' ? 'Male' : 'Female'}</div>
              </div>
            </CardHeader>
            <KVRow first label="Date of Birth" value={new Date(patient.birthDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {phone && <KVRow label="Phone" value={
              <span className="flex items-center gap-1.5"><Phone className="size-3" />{phone}</span>
            } />}
            {email && <KVRow label="Email" value={
              <span className="flex items-center gap-1.5 truncate max-w-[160px]"><Mail className="size-3" />{email}</span>
            } />}
            {address && <KVRow label="Address" value={
              <span className="flex items-center gap-1.5"><MapPin className="size-3" />{[...(address.line ?? []), address.city].filter(Boolean).join(', ')}</span>
            } />}
            <KVRow label="Hospital ID" value={hospitalId} mono />
            {nationalId && <KVRow label="National ID" value={nationalId} mono />}
          </InfoCard>

          {/* Coverage */}
          <InfoCard>
            <CardHeader>
              {coverage ? (
                <Shield className="size-3.5" style={{ color: '#16A34A' }} />
              ) : (
                <ShieldOff className="size-3.5" style={{ color: '#9BA3B8' }} />
              )}
              <span className="text-sm font-semibold" style={{ color: '#1A1F3C' }}>Insurance Coverage</span>
            </CardHeader>
            {coverage ? (
              <>
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1A1F3C' }}>{coverage.insurer}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>{coverage.planName}</div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                    {coverage.status}
                  </span>
                </div>
                <KVRow label="Policy No." value={coverage.policyNumber} mono />
                <KVRow label="Member ID" value={coverage.membershipId} mono />
                <KVRow label="Co-Pay" value={`${coverage.coPayPercent}%`} />
                <KVRow label="Valid Until" value={
                  coverage.coverageDates?.end
                    ? new Date(coverage.coverageDates.end).toLocaleDateString('en-GB')
                    : coverage.period?.end
                    ? new Date(coverage.period.end).toLocaleDateString('en-GB')
                    : '—'
                } />
              </>
            ) : (
              <div className="px-5 py-4 text-sm" style={{ color: '#9BA3B8' }}>No active coverage on record.</div>
            )}
          </InfoCard>
        </div>

        {/* Right column — tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="encounters">
            <TabsList className="mb-4">
              <TabsTrigger value="encounters">Encounters ({encounters.length})</TabsTrigger>
              <TabsTrigger value="gop">GOP Requests ({gopRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="encounters" className="space-y-3 mt-0">
              {encounters.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 rounded-2xl text-center"
                  style={{ background: '#fff', border: '1px dashed #D8DEF0' }}
                >
                  <Stethoscope className="size-6 mb-2" style={{ color: '#D8DEF0' }} />
                  <p className="text-sm font-medium" style={{ color: '#1A1F3C' }}>No encounters recorded</p>
                </div>
              ) : encounters.map(enc => {
                const estimate = MOCK_COST_ESTIMATES.find(c => c.encounterId === enc.id)
                const statusColor =
                  enc.status === 'in-progress' ? { bg: '#EEF3FF', color: '#2D6BF4' } :
                  enc.status === 'planned' ? { bg: '#FFF8ED', color: '#C47B10' } :
                  { bg: '#F0F2F8', color: '#6B7494' }
                return (
                  <InfoCard key={enc.id}>
                    <div className="px-5 py-3.5 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid #F0F2F8' }}>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#1A1F3C' }}>{enc.reasonCode?.[0]?.text ?? 'Encounter'}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>{enc.serviceProvider.display}</div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusColor.bg, color: statusColor.color }}>
                        {enc.class.display} · {enc.status}
                      </span>
                    </div>
                    <div className="px-5 py-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                        <Stethoscope className="size-3 flex-shrink-0" />
                        {enc.participant[0]?.individual.display}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                        <Calendar className="size-3 flex-shrink-0" />
                        {new Date(enc.period.start).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {enc.period.end && ` → ${new Date(enc.period.end).toLocaleString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </div>
                      {estimate && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7494' }}>
                          <DollarSign className="size-3 flex-shrink-0" />
                          Estimated: <strong style={{ color: '#1A1F3C' }}>${estimate.total.toLocaleString()}</strong>
                          <span style={{ color: '#9BA3B8' }}>(ANZER)</span>
                        </div>
                      )}
                    </div>
                  </InfoCard>
                )
              })}
            </TabsContent>

            <TabsContent value="gop" className="space-y-3 mt-0">
              {gopRequests.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 rounded-2xl text-center"
                  style={{ background: '#fff', border: '1px dashed #D8DEF0' }}
                >
                  <p className="text-sm font-medium" style={{ color: '#1A1F3C' }}>No GOP requests for this patient</p>
                </div>
              ) : gopRequests.map(req => (
                <Link key={req.id} href={`/gop/${req.id}`} className="block">
                  <div
                    className="bg-white rounded-2xl overflow-hidden transition-shadow duration-150 hover:shadow-md cursor-pointer"
                    style={{ border: '1px solid #D8DEF0', boxShadow: '0 2px 8px rgba(45,107,244,0.06)' }}
                  >
                    <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid #F0F2F8' }}>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#1A1F3C' }}>
                          {req.insurer} · <span style={{ fontFamily: 'var(--font-mono)', color: '#2D6BF4' }}>{req.quoteNumber}</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>{req.assignedSurgeon ?? 'No surgeon assigned'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <GOPStatusBadge status={req.status} />
                        <span className="text-sm font-semibold tabular-nums" style={{ color: '#1A1F3C' }}>${req.estimatedAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="px-5 py-2.5 text-xs" style={{ color: '#9BA3B8' }}>
                      Created {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
