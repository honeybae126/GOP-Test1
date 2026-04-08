'use client'

import { useParams, notFound } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useGopStore } from '@/lib/gop-store'
import { ReassignDoctorModal } from '@/components/gop/reassign-doctor-modal'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'
import { PageHeader } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getPatientById,
  getCoverageByPatientId,
  getEncounterById,
  getCostEstimateByEncounterId,
  formatPatientName,
  calculateAge,
  MOCK_PREFILL_RESPONSE,
  type AuditEntry,
} from '@/lib/mock-data'
import {
  ArrowLeft, User, Shield, Stethoscope,
  DollarSign, CheckCircle, Clock, Sparkles, Activity, FileText, Pencil, RefreshCw, UserCog, Wrench,
} from 'lucide-react'
import { GOPLivePanel } from '@/components/gop/gop-live-panel'
import { formatDistanceToNow } from 'date-fns'

const ACTION_LABELS: Record<string, string> = {
  REQUEST_CREATED: 'Request created',
  SURGEON_VERIFIED: 'Surgeon verification submitted',
  ANAESTHETIST_VERIFIED: 'Anaesthetist verification submitted',
  STAFF_FINALISED: 'Request finalised by staff',
  SUBMITTED_TO_INSURER: 'Submitted to insurer',
  FIELD_CORRECTED: 'Field corrected',
  REQUEST_REJECTED: 'Request rejected',
  REQUEST_EXPIRED: 'Request expired',
  DOCTOR_REASSIGNED: 'Doctor reassigned',
  VERIFICATION_RESET: 'Verification reset',
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  REQUEST_CREATED: FileText,
  SURGEON_VERIFIED: CheckCircle,
  ANAESTHETIST_VERIFIED: CheckCircle,
  STAFF_FINALISED: CheckCircle,
  SUBMITTED_TO_INSURER: Sparkles,
  FIELD_CORRECTED: Activity,
  REQUEST_REJECTED: Activity,
  REQUEST_EXPIRED: Clock,
  DOCTOR_REASSIGNED: UserCog,
  VERIFICATION_RESET: RefreshCw,
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  INSURANCE_STAFF: 'bg-blue-100 text-blue-800',
  DOCTOR: 'bg-green-100 text-green-800',
  SYSTEM: 'bg-gray-100 text-gray-700',
}

function AuditTimeline({ auditLog }: { auditLog: AuditEntry[] }) {
  if (auditLog.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* vertical timeline line */}
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
      {auditLog.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] ?? Activity
        return (
          <div key={entry.id} className="flex gap-4 pb-5 relative">
            <div className="size-7 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 z-10">
              <Icon className="size-3 text-muted-foreground" />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[entry.performedByRole] ?? 'bg-gray-100 text-gray-700'}`}>
                  {entry.performedBy}
                </span>
              </div>
              {entry.detail && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.detail}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(entry.performedAt), { addSuffix: true })}
                {' · '}
                {new Date(entry.performedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function GOPDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))

  if (!req) notFound()

  const patient      = getPatientById(req.patientId)
  const coverage     = getCoverageByPatientId(req.patientId)
  const encounter    = getEncounterById(req.encounterId)
  const estimate     = getCostEstimateByEncounterId(req.encounterId)
  const prefillAnswers = MOCK_PREFILL_RESPONSE[req.id] ?? []

  const role     = session?.user?.role ?? ''
  const userName = session?.user?.name ?? ''
  const isDoctor = role === 'DOCTOR'
  const isAdmin  = role === 'ADMIN'
  const isStaff  = role === 'INSURANCE_STAFF' || role === 'ADMIN'

  const aiFieldCount  = prefillAnswers.filter(a => a.aiPrefilled).length
  const verifiedCount = prefillAnswers.filter(a => a.humanVerified).length

  const [reassignOpen, setReassignOpen] = useState(false)
  const canReassign = isAdmin && (req.status === 'DRAFT' || req.status === 'SUBMITTED')
  const performer = { name: userName, role }

  const lockUser = session?.user?.email ? { email: session.user.email, name: userName } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  return (
    <div className="space-y-6">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />
      <PageHeader
        title={`GOP Request — ${req.insurer}`}
        description={`Patient: ${req.patientName} · Created ${new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      >
        <Link href="/gop">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3 mr-1" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — live status + actions */}
        <div className="space-y-4">
          <GOPLivePanel
            gopId={req.id}
            isDoctor={isDoctor}
            isStaff={isStaff}
            isAdmin={isAdmin}
            userName={userName}
            userRole={role}
            aiFieldCount={aiFieldCount}
            prefillTotal={prefillAnswers.length}
            verifiedCount={verifiedCount}
          />

          {/* Patient */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <CardTitle className="text-sm">Patient</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {patient ? (
                <>
                  <div className="font-medium">{formatPatientName(patient)}</div>
                  <div className="text-xs text-muted-foreground">
                    {calculateAge(patient.birthDate)} yrs · {patient.gender}
                  </div>
                  <Link href={`/patients/${patient.id}`} className="text-xs text-primary hover:underline">
                    View patient record →
                  </Link>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">Patient data unavailable.</div>
              )}
            </CardContent>
          </Card>

          {/* Coverage */}
          {coverage && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm">Coverage</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5">
                <div className="font-medium text-sm">{coverage.planName}</div>
                <div className="text-muted-foreground">Policy: <span className="font-mono">{coverage.policyNumber}</span></div>
                <div className="text-muted-foreground">Member: <span className="font-mono">{coverage.membershipId}</span></div>
                <div className="text-muted-foreground">Co-Pay: <strong className="text-foreground">{coverage.coPayPercent}%</strong></div>
              </CardContent>
            </Card>
          )}

          {/* Encounter */}
          {encounter && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm">Encounter</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5">
                <div className="font-medium text-sm">{encounter.reasonCode?.[0]?.text}</div>
                <div className="text-muted-foreground">{encounter.serviceProvider.display}</div>
                <div className="text-muted-foreground">{encounter.class.display} · {encounter.status}</div>
                <div className="text-muted-foreground">
                  {new Date(encounter.period.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {/* Assigned doctor row — with Reassign button for Admin */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-muted-foreground truncate">{req.assignedDoctor}</span>
                  {canReassign && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setReassignOpen(true)}
                      title="Reassign doctor"
                    >
                      <Pencil className="size-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reassign Doctor Modal */}
          {canReassign && (
            <ReassignDoctorModal
              open={reassignOpen}
              onClose={() => setReassignOpen(false)}
              gopId={req.id}
              currentDoctor={req.assignedDoctor}
              performer={performer}
            />
          )}
        </div>

        {/* Right — tabs: Details + Activity */}
        <div className="lg:col-span-2">
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <AuditTimeline auditLog={req.auditLog ?? []} />
          </TabsContent>

          <TabsContent value="details">
        <div className="space-y-4">
          {estimate && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm">Cost Estimate (from ANZER)</CardTitle>
                </div>
                <CardDescription className="text-xs">Read-only. Source: ANZER cost estimation module.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Item</th>
                      <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.items.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5">
                          <div>{item.description}</div>
                          {item.code && <div className="text-xs text-muted-foreground font-mono">{item.code}</div>}
                        </td>
                        <td className="text-right py-1.5 text-muted-foreground">{item.quantity}</td>
                        <td className="text-right py-1.5 text-muted-foreground">${item.unitPrice.toLocaleString()}</td>
                        <td className="text-right py-1.5 font-medium">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-medium">
                      <td colSpan={3} className="pt-2 text-right">Total</td>
                      <td className="pt-2 text-right text-base">${estimate.total.toLocaleString()}</td>
                    </tr>
                    <tr className="text-muted-foreground">
                      <td colSpan={3} className="text-right text-xs">Patient Co-Pay ({coverage?.coPayPercent}%)</td>
                      <td className="text-right text-sm">${estimate.coPayAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Instrument & Operational Components — placeholder */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Wrench className="size-3.5 text-muted-foreground" />
                <CardTitle className="text-sm">Instrument & Operational Components</CardTitle>
                <Badge variant="outline" className="text-xs ml-auto text-amber-700 border-amber-300 bg-amber-50">TBC</Badge>
              </div>
              <CardDescription className="text-xs">Read-only. Pending clinical confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>This section is pending clinical confirmation. Contents may change.</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground pl-3">Unit</th>
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground pl-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-1.5">Surgical instrument set</td>
                    <td className="py-1.5 text-muted-foreground">Instruments</td>
                    <td className="py-1.5 text-right text-muted-foreground">1</td>
                    <td className="py-1.5 text-muted-foreground pl-3">Set</td>
                    <td className="py-1.5 text-muted-foreground pl-3 italic text-xs">e.g. laparoscopic kit</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1.5">Anaesthesia consumables</td>
                    <td className="py-1.5 text-muted-foreground">Consumables</td>
                    <td className="py-1.5 text-right text-muted-foreground">1</td>
                    <td className="py-1.5 text-muted-foreground pl-3">Kit</td>
                    <td className="py-1.5 text-muted-foreground pl-3 italic text-xs">e.g. breathing circuit</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Operating theatre setup</td>
                    <td className="py-1.5 text-muted-foreground">Operational</td>
                    <td className="py-1.5 text-right text-muted-foreground">1</td>
                    <td className="py-1.5 text-muted-foreground pl-3">Session</td>
                    <td className="py-1.5 text-muted-foreground pl-3 italic text-xs">e.g. room prep fee</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-muted-foreground italic">
                TBC — pending Debbie confirmation. Do not use for actual billing.
              </p>
            </CardContent>
          </Card>

          {prefillAnswers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-violet-500" />
                  <CardTitle className="text-sm">Form Answers Summary</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Fields marked <span className="inline-flex items-center rounded-full border px-1 h-4 text-[9px] font-semibold bg-violet-50 text-violet-700 border-violet-200">AI</span> were prefilled by the AI service and require human verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {prefillAnswers.filter(a => a.answer !== '').map((answer) => (
                    <div key={answer.linkId} className="flex items-start gap-2 text-sm">
                      <div className="flex-1">
                        <span className="text-muted-foreground text-xs capitalize">
                          {answer.linkId.replace(/-/g, ' ')}:
                        </span>{' '}
                        <span className="font-medium">
                          {typeof answer.answer === 'boolean'
                            ? answer.answer ? 'Yes' : 'No'
                            : String(answer.answer)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {answer.aiPrefilled && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-violet-50 text-violet-700 border-violet-200">AI</Badge>
                        )}
                        {answer.humanVerified
                          ? <CheckCircle className="size-3 text-green-500" />
                          : <Clock className="size-3 text-amber-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!estimate && !prefillAnswers.length && (
            <Card>
              <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
                No cost estimate or form answers available for this request yet.
              </CardContent>
            </Card>
          )}

          {req.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{req.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
