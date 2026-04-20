import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  User, Phone, Mail, MapPin, Shield, Calendar,
  Stethoscope, FileText, PlusCircle, ArrowLeft, DollarSign,
  AlertCircle,
} from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`Patient record · ${hospitalId}`}
      >
        <Link href="/patients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3 mr-1" />
            Back
          </Button>
        </Link>
        {coverage && (
          <Link href={`/gop/new?patientId=${id}`}>
            <Button size="sm">
              <PlusCircle className="size-3 mr-1" />
              New GOP Request
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — patient info */}
        <div className="space-y-4">
          {/* Demographics */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{name}</CardTitle>
                  <CardDescription>{age} years · {patient.gender === 'male' ? 'Male' : 'Female'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5" />
                <span>DOB: {new Date(patient.birthDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {patient.telecom?.find(t => t.system === 'phone') && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span>{patient.telecom.find(t => t.system === 'phone')?.value}</span>
                </div>
              )}
              {patient.telecom?.find(t => t.system === 'email') && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span>{patient.telecom.find(t => t.system === 'email')?.value}</span>
                </div>
              )}
              {patient.address?.[0] && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span>{[...(patient.address[0].line ?? []), patient.address[0].city].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground space-y-1">
                <div><span className="font-medium text-foreground">Hospital ID:</span> {hospitalId}</div>
                {nationalId && <div><span className="font-medium text-foreground">National ID:</span> {nationalId}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Coverage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <CardTitle className="text-sm">Insurance Coverage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              {coverage ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base">{coverage.insurer}</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {coverage.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{coverage.planName}</p>
                  <Separator className="my-2" />
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Policy No.</span>
                      <span className="font-mono">{coverage.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member ID</span>
                      <span className="font-mono">{coverage.membershipId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Co-Pay</span>
                      <span className="font-medium">{coverage.coPayPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span>{coverage.coverageDates?.end ? new Date(coverage.coverageDates.end).toLocaleDateString('en-GB') : coverage.period?.end ? new Date(coverage.period.end).toLocaleDateString('en-GB') : '—'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="size-4" />
                  <span className="text-sm">No active coverage on record</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="encounters">
            <TabsList>
              <TabsTrigger value="encounters">
                Encounters ({encounters.length})
              </TabsTrigger>
              <TabsTrigger value="gop">
                GOP Requests ({gopRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="encounters" className="space-y-3 mt-4">
              {encounters.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No encounters recorded</div>
              ) : encounters.map(enc => {
                const estimate = MOCK_COST_ESTIMATES.find(c => c.encounterId === enc.id)
                return (
                  <Card key={enc.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm">{enc.reasonCode?.[0]?.text ?? 'Encounter'}</CardTitle>
                          <CardDescription className="text-xs">{enc.serviceProvider.display}</CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            enc.status === 'in-progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : enc.status === 'planned'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }
                        >
                          {enc.class.display} · {enc.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <div className="flex gap-2">
                        <Stethoscope className="size-3.5 mt-0.5" />
                        <span>{enc.participant[0]?.individual.display}</span>
                      </div>
                      <div className="flex gap-2">
                        <Calendar className="size-3.5 mt-0.5" />
                        <span>
                          {new Date(enc.period.start).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                          {enc.period.end && ` → ${new Date(enc.period.end).toLocaleString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </span>
                      </div>
                      {estimate && (
                        <div className="flex gap-2">
                          <DollarSign className="size-3.5 mt-0.5" />
                          <span>Estimated: <strong className="text-foreground">${estimate.total.toLocaleString()}</strong> (from ANZER)</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="gop" className="space-y-3 mt-4">
              {gopRequests.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No GOP requests for this patient</div>
              ) : gopRequests.map(req => (
                <Link key={req.id} href={`/gop/${req.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">
                            {req.insurer} · #{req.id.split('-')[1]}
                          </CardTitle>
                          <CardDescription className="text-xs">{req.assignedSurgeon ?? 'Unassigned'}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <GOPStatusBadge status={req.status} />
                          <span className="text-sm font-medium">${req.estimatedAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Created {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
