'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { PageHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getPatientById, formatPatientName, calculateAge,
  getCoverageByPatientId, getCostEstimateByEncounterId,
} from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, DollarSign, Wrench, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

export default function FinanceVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))

  const role = session?.user?.role ?? ''
  const isStaff = role === 'INSURANCE_STAFF' || role === 'ADMIN'

  // Finance page is accessible to all authenticated roles — doctors see it read-only
  useEffect(() => {
    if (!role) return
  }, [role])

  const [approvedAmount, setApprovedAmount] = useState<string>(
    req?.approvedAmount?.toString() ?? req?.estimatedAmount?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)

  const patient  = req ? getPatientById(req.patientId) : null
  const coverage = req ? getCoverageByPatientId(req.patientId) : null
  const estimate = req ? getCostEstimateByEncounterId(req.encounterId) : null

  const surgeonDone       = req?.surgeonVerified ?? req?.doctorVerified ?? false
  const anaesthetistDone  = req?.anaesthetistVerified ?? req?.doctorVerified ?? false
  const bothDone          = surgeonDone && anaesthetistDone

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  if (!req) return null

  const handleSaveApprovedAmount = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    toast.success('Approved amount saved.')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />
      <PageHeader
        title="Finance Review"
        description={`Step 3 — Cost review for ${req.patientName}`}
      >
        <Link href={`/gop/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3 mr-1" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 ${surgeonDone ? 'text-green-700' : 'text-muted-foreground'}`}>
          {surgeonDone ? <CheckCircle className="size-5 text-green-500" /> : <div className="size-5 rounded-full bg-muted flex items-center justify-center text-xs">1</div>}
          Surgeon
        </div>
        <div className={`flex-1 h-px ${surgeonDone ? 'bg-green-300' : 'bg-border'}`} />
        <div className={`flex items-center gap-1.5 ${anaesthetistDone ? 'text-green-700' : 'text-muted-foreground'}`}>
          {anaesthetistDone ? <CheckCircle className="size-5 text-green-500" /> : <div className="size-5 rounded-full bg-muted flex items-center justify-center text-xs">2</div>}
          Anaesthetist
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
          Finance
        </div>
      </div>

      {/* Patient summary */}
      {patient && (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 flex flex-wrap gap-4 text-sm">
            <div><span className="text-muted-foreground">Patient: </span><span className="font-medium">{formatPatientName(patient)}</span></div>
            <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{calculateAge(patient.birthDate)} yrs</span></div>
            <div><span className="text-muted-foreground">Insurer: </span><Badge variant="outline" className="text-xs">{req.insurer}</Badge></div>
            {coverage && <div><span className="text-muted-foreground">Co-pay: </span><span className="font-medium">{coverage.coPayPercent}%</span></div>}
          </CardContent>
        </Card>
      )}

      {/* Clinical verification status — read-only */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Clinical Sections</CardTitle>
            <Badge variant="secondary" className="text-xs ml-auto">Read-only</Badge>
          </div>
          <CardDescription className="text-xs">Surgeon and anaesthetist verification status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-muted-foreground">Surgeon Verification</span>
            {surgeonDone
              ? <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
              : <Badge variant="secondary">Pending</Badge>}
          </div>
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-muted-foreground">Anaesthetist Verification</span>
            {anaesthetistDone
              ? <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
              : <Badge variant="secondary">Pending</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* ANZER cost estimate — read-only */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Cost Estimate (ANZER)</CardTitle>
            <Badge variant="secondary" className="text-xs ml-auto">Read-only</Badge>
          </div>
          <CardDescription className="text-xs">Source: ANZER cost estimation module.</CardDescription>
        </CardHeader>
        <CardContent>
          {estimate ? (
            <>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Unit</th>
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
                    <td colSpan={3} className="pt-2 text-right">Estimated Total</td>
                    <td className="pt-2 text-right text-base">${estimate.total.toLocaleString()}</td>
                  </tr>
                  {coverage && (
                    <tr className="text-muted-foreground">
                      <td colSpan={3} className="text-right text-xs">Patient Co-Pay ({coverage.coPayPercent}%)</td>
                      <td className="text-right text-sm">${estimate.coPayAmount.toLocaleString()}</td>
                    </tr>
                  )}
                </tfoot>
              </table>

              <Separator className="my-4" />

              {/* Approved amount — editable by staff only */}
              <div className="space-y-1.5">
                <Label htmlFor="approved-amount">Approved Amount (USD)</Label>
                {isStaff ? (
                  <div className="flex gap-2">
                    <Input
                      id="approved-amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={approvedAmount}
                      onChange={e => setApprovedAmount(e.target.value)}
                      className="max-w-[180px]"
                    />
                    <Button variant="outline" size="sm" onClick={handleSaveApprovedAmount} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-muted-foreground">
                    ${approvedAmount || '—'} <span className="text-xs">(set by Insurance Staff)</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No cost estimate available for this encounter.</p>
          )}
        </CardContent>
      </Card>

      {/* Instrument / operational components — placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" />
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

      {/* Navigation cue */}
      {bothDone && isStaff && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="size-4" />
          Both clinical verifications complete. Return to the request to finalise and submit.
          <Link href={`/gop/${id}`} className="ml-auto underline font-medium text-primary text-xs">Go to request →</Link>
        </div>
      )}
    </div>
  )
}
