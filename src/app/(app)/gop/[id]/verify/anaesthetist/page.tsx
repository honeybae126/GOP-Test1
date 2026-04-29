'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AnaesthesiaFormData } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, AlertTriangle, DollarSign, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

function VerifyCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sub ? 4 : 0 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </span>
      </div>
      {sub && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: icon ? 20 : 0 }}>{sub}</p>}
    </div>
  )
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ fontSize: 12 }}>
        {label}
        {required && <span style={{ color: 'var(--destructive)', marginLeft: 3 }}>*</span>}
      </Label>
      {children}
    </div>
  )
}

function CheckboxRow({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled: boolean
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        style={{ width: 15, height: 15, accentColor: 'var(--blue-600)', flexShrink: 0 }}
      />
      <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{label}</span>
    </label>
  )
}

function CostInput({ label, value, onChange, disabled }: {
  label: string; value: number; onChange: (v: number) => void; disabled: boolean
}) {
  return (
    <div className="space-y-1">
      <Label style={{ fontSize: 11, color: 'var(--gray-500)' }}>{label}</Label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, color: 'var(--gray-400)', pointerEvents: 'none',
        }}>$</span>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={value === 0 ? '' : value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          style={{ paddingLeft: 22, fontSize: 13, height: 34 }}
          placeholder="0.00"
        />
      </div>
    </div>
  )
}

function SignaturePreview({ name }: { name: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border-medium)', borderRadius: 10, padding: '14px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Digital Signature Preview
      </div>
      <div style={{
        borderBottom: '2px solid var(--gray-300)', paddingBottom: 8,
        fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22, fontStyle: 'italic',
        color: 'var(--gray-700)', letterSpacing: '0.03em', minHeight: 40, display: 'flex', alignItems: 'flex-end',
      }}>
        {name || <span style={{ color: 'var(--gray-300)', fontSize: 16 }}>Signature will appear here</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
        {name ? `Dr. ${name}` : ''} — Anaesthetist
      </div>
    </div>
  )
}

const EMPTY_FORM: AnaesthesiaFormData = {
  asaClass: '', anaesthesiaType: '',
  preOpLab: false, preOpECG: false, preOpRadiology: false,
  referralCardiology: false, referralRespiratory: false, referralOther: '',
  isICU: false, icuLOS: null,
  anaesthesiologistFee: 0, anaesthesiaFee: 0, drugs: 0, consumables: 0, others: 0,
}

export default function AnaesthetistVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setAnaesthetistVerified } = useGopStore()
  const role = useActiveRole()

  useEffect(() => {
    if (!role) return
    if (role !== 'DOCTOR') { router.replace(`/gop/${id}`); return }
    if (!req) return
    if (req.assignedAnaesthetist !== null && req.assignedAnaesthetist !== session?.user?.name) {
      router.replace(`/gop/${id}`)
    }
    if (req.anaesthetistVerified || req.status !== 'DRAFT') router.replace(`/gop/${id}`)
  }, [role, req, id, router, session?.user?.name])

  const [form, setForm]                 = useState<AnaesthesiaFormData>(req?.anaesthesiaForm ?? EMPTY_FORM)
  const [anaName, setAnaName]           = useState(session?.user?.name ?? '')
  const [regNumber, setRegNumber]       = useState('')
  const [declared, setDeclared]         = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  const surgeonDone     = req?.surgeonVerified ?? false
  const alreadyVerified = req?.anaesthetistVerified ?? false

  const setF = <K extends keyof AnaesthesiaFormData>(k: K, v: AnaesthesiaFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const anaTotal = form.anaesthesiologistFee + form.anaesthesiaFee + form.drugs + form.consumables + form.others
  const isValid  = anaName.trim() !== '' && regNumber.trim() !== '' && declared && surgeonDone

  if (role !== 'DOCTOR') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!surgeonDone)        { toast.error('Surgeon section must be completed first.'); return }
    if (!anaName.trim())     { toast.error('Anaesthetist name is required.'); return }
    if (!regNumber.trim())   { toast.error('Medical registration number is required.'); return }
    if (!declared)           { toast.error('Please tick the declaration checkbox.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? anaName, role: role || 'DOCTOR' }
    setAnaesthetistVerified(id, performer, form, regNumber)

    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'anaesthetist', anaName, regNumber }),
    }).catch(() => {})

    toast.success('Anaesthesia section submitted. Staff can now finalise.')
    router.push(`/gop/${id}`)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1">Anaesthesia Section</h1>
          <p className="text-body mt-1.5">
            Step 2 of 2 — Fill in anaesthesia details and proposed costs for {req.patientName}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/gop/${id}`}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      </div>

      {/* Workflow progress */}
      <VerifyCard style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
        {[
          { step: 1, label: 'Surgeon',      done: true,  active: false },
          { step: 2, label: 'Anaesthetist', done: false, active: true },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {s.done
                ? <CheckCircle style={{ width: 20, height: 20, color: 'var(--success)' }} />
                : (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                    color: s.active ? '#fff' : 'var(--gray-400)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{s.step}</div>
                )
              }
              <span style={{
                fontSize: 13, fontWeight: s.active ? 600 : 400,
                color: s.done ? 'var(--success)' : s.active ? 'var(--blue-600)' : 'var(--gray-400)',
              }}>{s.label}</span>
            </div>
            {i < 1 && (
              <div style={{ flex: 1, height: 1, background: s.done ? 'var(--success)' : 'var(--border-light)', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </VerifyCard>

      {/* Surgeon not done yet */}
      {!surgeonDone && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 13, color: '#92400E',
        }}>
          <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
          <span>
            The surgeon section must be completed first.{' '}
            <Link href={`/gop/${id}/verify/surgeon`} style={{ color: 'var(--blue-600)', textDecoration: 'underline', fontWeight: 500 }}>
              Go to surgeon step →
            </Link>
          </span>
        </div>
      )}

      {alreadyVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 13, color: '#065F46',
        }}>
          <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
          Anaesthesia section already submitted. Fields are locked.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Patient summary */}
        <div style={{
          background: 'var(--bg-card)', border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-xl)', padding: '12px 20px',
          display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
        }}>
          {[
            { label: 'Patient', value: req.patientName },
            { label: 'Insurer', value: req.insurer },
            { label: 'Surgery', value: req.surgicalForm?.surgery || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--gray-400)' }}>{label}: </span>
              <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Anaesthesia Details */}
        <VerifyCard>
          <CardHead
            icon={<Activity style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
            title="Anaesthesia Details"
            sub="Fill in the anaesthetic plan and clinical assessment."
          />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldRow label="ASA Class">
                <Select
                  value={form.asaClass}
                  onValueChange={v => setF('asaClass', v)}
                  disabled={alreadyVerified || !surgeonDone}
                >
                  <SelectTrigger><SelectValue placeholder="Select ASA class…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">ASA I — Normal healthy patient</SelectItem>
                    <SelectItem value="II">ASA II — Mild systemic disease</SelectItem>
                    <SelectItem value="III">ASA III — Severe systemic disease</SelectItem>
                    <SelectItem value="IV">ASA IV — Life-threatening disease</SelectItem>
                    <SelectItem value="V">ASA V — Moribund patient</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Type of Anaesthesia">
                <Select
                  value={form.anaesthesiaType}
                  onValueChange={v => setF('anaesthesiaType', v)}
                  disabled={alreadyVerified || !surgeonDone}
                >
                  <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Regional">Regional</SelectItem>
                    <SelectItem value="Spinal">Spinal / Epidural</SelectItem>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Sedation">Sedation / MAC</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            {/* Pre-op investigations */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Pre-op Investigations Required
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CheckboxRow label="Lab Investigations"  checked={form.preOpLab}       onChange={v => setF('preOpLab', v)}       disabled={alreadyVerified || !surgeonDone} />
                <CheckboxRow label="ECG"                 checked={form.preOpECG}       onChange={v => setF('preOpECG', v)}       disabled={alreadyVerified || !surgeonDone} />
                <CheckboxRow label="Radiology"           checked={form.preOpRadiology} onChange={v => setF('preOpRadiology', v)} disabled={alreadyVerified || !surgeonDone} />
              </div>
            </div>

            {/* Specialist referrals */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Referral to Specialist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CheckboxRow label="Cardiology"    checked={form.referralCardiology}   onChange={v => setF('referralCardiology', v)}   disabled={alreadyVerified || !surgeonDone} />
                <CheckboxRow label="Respiratory"   checked={form.referralRespiratory}  onChange={v => setF('referralRespiratory', v)}  disabled={alreadyVerified || !surgeonDone} />
                <div className="space-y-1">
                  <CheckboxRow label="Other (specify below)" checked={!!form.referralOther} onChange={v => !v && setF('referralOther', '')} disabled={alreadyVerified || !surgeonDone} />
                  {(form.referralOther !== '' || !alreadyVerified) && (
                    <Input
                      value={form.referralOther}
                      onChange={e => setF('referralOther', e.target.value)}
                      disabled={alreadyVerified || !surgeonDone}
                      placeholder="Specify specialist…"
                      style={{ marginLeft: 25, width: 'calc(100% - 25px)', fontSize: 13, height: 34 }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ICU */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldRow label="ICU / High Care Required?">
                <Select
                  value={form.isICU ? 'yes' : 'no'}
                  onValueChange={v => setF('isICU', v === 'yes')}
                  disabled={alreadyVerified || !surgeonDone}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              {form.isICU && (
                <FieldRow label="ICU LOS (days)">
                  <Input
                    type="number"
                    min={1}
                    value={form.icuLOS ?? ''}
                    onChange={e => setF('icuLOS', parseInt(e.target.value) || null)}
                    disabled={alreadyVerified || !surgeonDone}
                    placeholder="Days"
                  />
                </FieldRow>
              )}
            </div>
          </div>
        </VerifyCard>

        {/* Proposed Costs — Anaesthesia Side */}
        <VerifyCard>
          <CardHead
            icon={<DollarSign style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
            title="Proposed Costs — Anaesthesia Side"
            sub="Enter estimated fees for anaesthetic services. Leave blank if not applicable."
          />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <CostInput label="Anaesthesiologist Fee" value={form.anaesthesiologistFee} onChange={v => setF('anaesthesiologistFee', v)} disabled={alreadyVerified || !surgeonDone} />
              <CostInput label="Anaesthesia Fee"       value={form.anaesthesiaFee}       onChange={v => setF('anaesthesiaFee', v)}       disabled={alreadyVerified || !surgeonDone} />
              <CostInput label="Drugs"                 value={form.drugs}                onChange={v => setF('drugs', v)}                disabled={alreadyVerified || !surgeonDone} />
              <CostInput label="Consumables"           value={form.consumables}          onChange={v => setF('consumables', v)}          disabled={alreadyVerified || !surgeonDone} />
              <CostInput label="Others"                value={form.others}               onChange={v => setF('others', v)}               disabled={alreadyVerified || !surgeonDone} />
            </div>

            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'var(--blue-50)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--blue-200)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue-700)' }}>Anaesthesia Subtotal</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue-700)', fontFamily: 'var(--font-mono)' }}>
                ${anaTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Combined total (surgical + anaesthesia) */}
            {req.surgicalForm && (
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: '#ECFDF5', borderRadius: 'var(--radius-md)',
                border: '1px solid #A7F3D0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Combined Estimate (Surgical + Anaesthesia)</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#065F46', fontFamily: 'var(--font-mono)' }}>
                  ${(
                    (req.surgicalForm.surgeonFee + req.surgicalForm.assistantFee + req.surgicalForm.otProcedureFee +
                     req.surgicalForm.nursingFeeOT + req.surgicalForm.ipdRoomCharge + req.surgicalForm.ipdNursing +
                     req.surgicalForm.ipdDoctor + req.surgicalForm.ipdSpecialistConsult + req.surgicalForm.histopathology) +
                    anaTotal
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </VerifyCard>

        {/* Anaesthetist Details */}
        <VerifyCard>
          <CardHead title="Anaesthetist Details" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow label="Anaesthetist Name" required>
                <Input
                  value={anaName}
                  onChange={e => setAnaName(e.target.value)}
                  disabled={alreadyVerified || !surgeonDone}
                  placeholder="Full name as on registration"
                />
              </FieldRow>
              <FieldRow label="Medical Registration Number" required>
                <Input
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  disabled={alreadyVerified || !surgeonDone}
                  placeholder="e.g. KH-MED-005678"
                />
              </FieldRow>
            </div>
          </div>
        </VerifyCard>

        {/* Declaration */}
        {!alreadyVerified && surgeonDone && (
          <VerifyCard>
            <CardHead title="Declaration" />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SignaturePreview name={anaName} />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={e => setDeclared(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--blue-600)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)' }}>
                  I, <strong>{anaName || '[Anaesthetist Name]'}</strong>, confirm that the anaesthetic plan and proposed
                  costs above are appropriate for the patient and accurate to the best of my knowledge.
                </span>
              </label>

              <Button onClick={handleSubmit} disabled={submitting || !isValid} className="w-full">
                {submitting ? 'Submitting…' : 'Submit Anaesthesia Section'}
              </Button>
            </div>
          </VerifyCard>
        )}

        {/* Already submitted view */}
        {alreadyVerified && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              fontSize: 13, color: '#065F46',
            }}>
              <Lock style={{ width: 14, height: 14, flexShrink: 0 }} />
              Both sections complete — staff may now finalise and submit to insurer.
            </div>

            <button
              onClick={() => setShowCompleted(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500, color: 'var(--blue-600)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {showCompleted ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
              {showCompleted ? 'Hide' : 'Show'} submitted anaesthesia details
            </button>

            {showCompleted && req.anaesthesiaForm && (
              <VerifyCard>
                <CardHead
                  icon={<Activity style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
                  title="Submitted Anaesthesia Details (read-only)"
                />
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['ASA Class', req.anaesthesiaForm.asaClass || '—'],
                    ['Anaesthesia Type', req.anaesthesiaForm.anaesthesiaType || '—'],
                    ['ICU / High Care', req.anaesthesiaForm.isICU ? `Yes, ${req.anaesthesiaForm.icuLOS ?? '?'} day(s)` : 'No'],
                    ['Referrals', [
                      req.anaesthesiaForm.referralCardiology && 'Cardiology',
                      req.anaesthesiaForm.referralRespiratory && 'Respiratory',
                      req.anaesthesiaForm.referralOther,
                    ].filter(Boolean).join(', ') || 'None'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ fontSize: 13 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: 'var(--gray-700)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </VerifyCard>
            )}
          </>
        )}
      </div>
    </div>
  )
}
