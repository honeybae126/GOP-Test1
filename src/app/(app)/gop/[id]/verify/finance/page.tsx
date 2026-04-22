'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import {
  getPatientById, formatPatientName, calculateAge,
  getCoverageByPatientId,
  type CostLineItem,
} from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, DollarSign, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'
import { CostTable } from '@/components/gop/cost-table'

function StatusPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 8px',
      borderRadius: 'var(--radius-full)',
      background: done ? '#ECFDF5' : 'var(--gray-100)',
      color: done ? '#065F46' : 'var(--gray-500)',
      border: `1px solid ${done ? '#A7F3D0' : 'var(--border-medium)'}`,
    }}>
      {label}
    </span>
  )
}

export default function FinanceVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const setFinanceVerified = useGopStore((s) => s.setFinanceVerified)
  const updateLineItems    = useGopStore((s) => s.updateLineItems)

  const role             = session?.user?.role ?? ''
  const isFinance        = role === 'FINANCE'
  const isInsuranceStaff = role === 'INSURANCE_STAFF'
  const isITAdmin        = role === 'IT_ADMIN'
  const isStaff          = isInsuranceStaff || isITAdmin

  const patient  = req ? getPatientById(req.patientId) : null
  const coverage = req ? getCoverageByPatientId(req.patientId) : null

  const surgeonDone      = req?.surgeonVerified ?? req?.doctorVerified ?? false
  const anaesthetistDone = req?.anaesthetistVerified ?? req?.doctorVerified ?? false
  const bothDone         = surgeonDone && anaesthetistDone

  const canEditCost = isFinance && !req?.financeVerified

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  const [pendingItems, setPendingItems] = useState<CostLineItem[] | null>(null)
  const [saving, setSaving] = useState(false)

  if (!req) return null

  const performer = { name: session?.user?.name ?? role, role }

  const handleSaveCost = async () => {
    if (!pendingItems) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    updateLineItems(req.id, pendingItems, performer)
    setPendingItems(null)
    setSaving(false)
    toast.success('Cost estimate saved.')
  }

  const handleVerify = () => {
    if (!bothDone) {
      toast.error('Both doctor verifications must be complete first.')
      return
    }
    if (pendingItems) {
      updateLineItems(req.id, pendingItems, performer)
      setPendingItems(null)
    }
    setFinanceVerified(req.id, performer)
    toast.success('Finance review confirmed.')
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1">Finance Review</h1>
          <p className="text-body mt-1.5" >
            Step 3 — Cost review for {req.patientName}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/gop/${id}`}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      </div>

      {/* Progress steps */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        padding: '14px 20px',
      }}>
        {[
          { step: 1, label: 'Surgeon', done: surgeonDone },
          { step: 2, label: 'Anaesthetist', done: anaesthetistDone },
          { step: 3, label: 'Finance', done: false, active: true },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0, gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {s.done ? (
                <CheckCircle style={{ width: 20, height: 20, color: 'var(--success)' }} />
              ) : (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                  color: s.active ? '#fff' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {s.step}
                </div>
              )}
              <span style={{
                fontSize: 13, fontWeight: s.active ? 600 : 400,
                color: s.done ? 'var(--success)' : s.active ? 'var(--blue-600)' : 'var(--gray-400)',
              }}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 1, margin: '0 12px',
                background: s.done ? 'var(--success)' : 'var(--border-light)',
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Patient summary */}
        {patient && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '12px 20px',
            display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
          }}>
            {[
              { label: 'Patient', value: formatPatientName(patient) },
              { label: 'Age', value: `${calculateAge(patient.birthDate)} yrs` },
              { label: 'Insurer', value: req.insurer },
              ...(coverage ? [{ label: 'Co-pay', value: `${coverage.coPayPercent}%` }] : []),
              { label: 'Quote', value: req.quoteNumber, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--gray-400)' }}>{label}: </span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Clinical verification status */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderBottom: '1px solid var(--border-light)',
          }}>
            <Lock style={{ width: 13, height: 13, color: 'var(--gray-400)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Clinical Sections
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 500,
              padding: '2px 7px', borderRadius: 'var(--radius-full)',
              background: 'var(--gray-100)', color: 'var(--gray-500)',
            }}>Read-only</span>
          </div>
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Surgeon Verification</span>
              <StatusPill done={surgeonDone} label={surgeonDone ? 'Complete' : 'Pending'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Anaesthetist Verification</span>
              <StatusPill done={anaesthetistDone} label={anaesthetistDone ? 'Complete' : 'Pending'} />
            </div>
          </div>
        </div>

        {/* Cost estimate */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderBottom: '1px solid var(--border-light)',
          }}>
            <DollarSign style={{ width: 13, height: 13, color: 'var(--gray-400)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Cost Estimate
            </span>
            <span style={{ marginLeft: 'auto' }}>
              {req.financeVerified ? (
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>Finance Confirmed</span>
              ) : canEditCost ? (
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid var(--blue-200)' }}>Editable</span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--gray-100)', color: 'var(--gray-500)', border: '1px solid var(--border-medium)' }}>Read-only</span>
              )}
            </span>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
              Quote: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gray-700)' }}>{req.quoteNumber}</span>
              {' · '}{req.quoteDate}
              {canEditCost && ' — Edit quantities, prices, and discounts below.'}
            </p>
            {req.lineItems?.length ? (
              <>
                <CostTable
                  lineItems={pendingItems ?? req.lineItems}
                  cpi={req.cpi ?? 1}
                  pricingType={req.pricingType ?? 'NORMAL'}
                  pricingUnit={req.pricingUnit}
                  marketingPackage={req.marketingPackage}
                  employer={req.employer}
                  coPayPercent={coverage?.coPayPercent}
                  showCategorySubtotals
                  editable={canEditCost}
                  onUpdate={setPendingItems}
                />
                {canEditCost && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    {pendingItems && (
                      <Button variant="outline" size="sm" onClick={() => setPendingItems(null)}>
                        Discard changes
                      </Button>
                    )}
                    <Button size="sm" disabled={!pendingItems || saving} onClick={handleSaveCost}>
                      {saving ? 'Saving…' : 'Save cost changes'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No line items available for this request.</p>
            )}
          </div>
        </div>

        {/* Finance confirm */}
        {isFinance && !req.financeVerified && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
            borderTop: '1px solid var(--border-light)', paddingTop: 16,
          }}>
            <Button disabled={!bothDone} onClick={handleVerify} className="gap-2">
              <CheckCircle className="size-4" />
              Confirm Finance Review
            </Button>
            {!bothDone && (
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                Awaiting completion of both clinical verifications before finance sign-off.
              </p>
            )}
          </div>
        )}

        {/* All done cue */}
        {bothDone && (isFinance || isStaff) && req.financeVerified && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#065F46',
          }}>
            <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            Finance review complete. Return to the request to finalise and submit.
            <Link href={`/gop/${id}`} style={{ marginLeft: 'auto', color: 'var(--blue-600)', fontSize: 12, fontWeight: 500, textDecoration: 'underline' }}>
              Go to request →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
