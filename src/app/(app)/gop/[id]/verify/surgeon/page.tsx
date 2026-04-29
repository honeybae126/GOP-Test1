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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SurgicalFormData } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, Stethoscope, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
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
        {name ? `Dr. ${name}` : ''} — Surgeon
      </div>
    </div>
  )
}

const EMPTY_FORM: SurgicalFormData = {
  surgery: '', assistant: '', procedureLength: '', preferredAnaesthesia: '',
  potentialDate: '', isInpatient: false, losDays: null,
  surgeonFee: 0, assistantFee: 0, otProcedureFee: 0, nursingFeeOT: 0,
  ipdRoomCharge: 0, ipdNursing: 0, ipdDoctor: 0, ipdSpecialistConsult: 0, histopathology: 0,
}

export default function SurgeonVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setSurgeonVerified } = useGopStore()
  const role = useActiveRole()

  useEffect(() => {
    if (!role) return
    if (role !== 'DOCTOR') { router.replace(`/gop/${id}`); return }
    if (!req) return
    if (req.assignedSurgeon !== null && req.assignedSurgeon !== session?.user?.name) {
      router.replace(`/gop/${id}`)
    }
    if (req.surgeonVerified || req.status !== 'DRAFT') router.replace(`/gop/${id}`)
  }, [role, req, id, router, session?.user?.name])

  const [form, setForm]           = useState<SurgicalFormData>(req?.surgicalForm ?? EMPTY_FORM)
  const [surgeonName, setSurgeonName] = useState(session?.user?.name ?? '')
  const [regNumber, setRegNumber] = useState('')
  const [declared, setDeclared]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  const alreadyVerified = req?.surgeonVerified ?? false

  const setF = <K extends keyof SurgicalFormData>(k: K, v: SurgicalFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const surgicalTotal =
    form.surgeonFee + form.assistantFee + form.otProcedureFee + form.nursingFeeOT +
    form.ipdRoomCharge + form.ipdNursing + form.ipdDoctor + form.ipdSpecialistConsult + form.histopathology

  const isValid = form.surgery.trim() !== '' && surgeonName.trim() !== '' && regNumber.trim() !== '' && declared

  if (role !== 'DOCTOR') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!form.surgery.trim()) { toast.error('Surgery / procedure name is required.'); return }
    if (!surgeonName.trim())  { toast.error('Surgeon name is required.'); return }
    if (!regNumber.trim())    { toast.error('Medical registration number is required.'); return }
    if (!declared)            { toast.error('Please tick the declaration checkbox.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? surgeonName, role: role || 'DOCTOR' }
    setSurgeonVerified(id, performer, form, regNumber)

    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'surgeon', surgeonName, regNumber }),
    }).catch(() => {})

    toast.success('Surgical section submitted successfully.')
    router.push(`/gop/${id}`)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1">Surgical Section</h1>
          <p className="text-body mt-1.5">
            Step 1 of 2 — Fill in surgical details and proposed costs for {req.patientName}
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
          { step: 1, label: 'Surgeon',      active: true,  done: false },
          { step: 2, label: 'Anaesthetist', active: false, done: false },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                color: s.active ? '#fff' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{s.step}</div>
              <span style={{ fontSize: 13, fontWeight: s.active ? 600 : 400, color: s.active ? 'var(--blue-600)' : 'var(--gray-400)' }}>
                {s.label}
              </span>
            </div>
            {i < 1 && <div style={{ flex: 1, height: 1, background: 'var(--border-light)', margin: '0 12px' }} />}
          </div>
        ))}
      </VerifyCard>

      {alreadyVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 13, color: '#065F46',
        }}>
          <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
          Surgical section already submitted. Fields are locked.
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
            { label: 'Quote',   value: req.quoteNumber },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--gray-400)' }}>{label}: </span>
              <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Surgical Details */}
        <VerifyCard>
          <CardHead
            icon={<Stethoscope style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
            title="Surgical Details"
            sub="Fill in the planned surgical procedure information."
          />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldRow label="Surgery / Procedure" required>
                <Input
                  value={form.surgery}
                  onChange={e => setF('surgery', e.target.value)}
                  disabled={alreadyVerified}
                  placeholder="e.g. Laparoscopic Cholecystectomy"
                />
              </FieldRow>
              <FieldRow label="Assistant Surgeon">
                <Input
                  value={form.assistant}
                  onChange={e => setF('assistant', e.target.value)}
                  disabled={alreadyVerified}
                  placeholder="Name of assisting surgeon"
                />
              </FieldRow>
              <FieldRow label="Length of Procedure">
                <Input
                  value={form.procedureLength}
                  onChange={e => setF('procedureLength', e.target.value)}
                  disabled={alreadyVerified}
                  placeholder="e.g. 2 hours"
                />
              </FieldRow>
              <FieldRow label="Preferred Anaesthesia">
                <Select
                  value={form.preferredAnaesthesia}
                  onValueChange={v => setF('preferredAnaesthesia', v)}
                  disabled={alreadyVerified}
                >
                  <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Regional">Regional</SelectItem>
                    <SelectItem value="Spinal">Spinal / Epidural</SelectItem>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Sedation">Sedation</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Potential Date of Surgery">
                <Input
                  type="date"
                  value={form.potentialDate}
                  onChange={e => setF('potentialDate', e.target.value)}
                  disabled={alreadyVerified}
                />
              </FieldRow>
              <FieldRow label="Inpatient?">
                <Select
                  value={form.isInpatient ? 'yes' : 'no'}
                  onValueChange={v => setF('isInpatient', v === 'yes')}
                  disabled={alreadyVerified}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No (Day Surgery)</SelectItem>
                    <SelectItem value="yes">Yes (Inpatient)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            {form.isInpatient && (
              <FieldRow label="Length of Stay (days)">
                <Input
                  type="number"
                  min={1}
                  value={form.losDays ?? ''}
                  onChange={e => setF('losDays', parseInt(e.target.value) || null)}
                  disabled={alreadyVerified}
                  placeholder="Number of days"
                  style={{ maxWidth: 160 }}
                />
              </FieldRow>
            )}
          </div>
        </VerifyCard>

        {/* Proposed Costs — Surgical Side */}
        <VerifyCard>
          <CardHead
            icon={<DollarSign style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
            title="Proposed Costs — Surgical Side"
            sub="Enter estimated fees for the surgical team and inpatient stay. Leave blank if not applicable."
          />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <CostInput label="Surgeon Fee"            value={form.surgeonFee}            onChange={v => setF('surgeonFee', v)}            disabled={alreadyVerified} />
              <CostInput label="Assistant Fee"          value={form.assistantFee}          onChange={v => setF('assistantFee', v)}          disabled={alreadyVerified} />
              <CostInput label="OT Procedure Fee"       value={form.otProcedureFee}        onChange={v => setF('otProcedureFee', v)}        disabled={alreadyVerified} />
              <CostInput label="Nursing Fee (OT)"       value={form.nursingFeeOT}          onChange={v => setF('nursingFeeOT', v)}          disabled={alreadyVerified} />
              <CostInput label="IPD Room Charge"        value={form.ipdRoomCharge}         onChange={v => setF('ipdRoomCharge', v)}         disabled={alreadyVerified} />
              <CostInput label="IPD Nursing"            value={form.ipdNursing}            onChange={v => setF('ipdNursing', v)}            disabled={alreadyVerified} />
              <CostInput label="IPD Doctor"             value={form.ipdDoctor}             onChange={v => setF('ipdDoctor', v)}             disabled={alreadyVerified} />
              <CostInput label="IPD Specialist Consult" value={form.ipdSpecialistConsult}  onChange={v => setF('ipdSpecialistConsult', v)}  disabled={alreadyVerified} />
              <CostInput label="Histopathology"         value={form.histopathology}        onChange={v => setF('histopathology', v)}        disabled={alreadyVerified} />
            </div>

            {/* Surgical subtotal */}
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'var(--blue-50)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--blue-200)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue-700)' }}>Surgical Subtotal</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue-700)', fontFamily: 'var(--font-mono)' }}>
                ${surgicalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </VerifyCard>

        {/* Surgeon Details */}
        <VerifyCard>
          <CardHead title="Surgeon Details" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldRow label="Surgeon Name" required>
                <Input
                  value={surgeonName}
                  onChange={e => setSurgeonName(e.target.value)}
                  disabled={alreadyVerified}
                  placeholder="Full name as on registration"
                />
              </FieldRow>
              <FieldRow label="Medical Registration Number" required>
                <Input
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  disabled={alreadyVerified}
                  placeholder="e.g. KH-MED-001234"
                />
              </FieldRow>
            </div>
          </div>
        </VerifyCard>

        {/* Declaration */}
        {!alreadyVerified && (
          <VerifyCard>
            <CardHead title="Declaration" />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SignaturePreview name={surgeonName} />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={e => setDeclared(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--blue-600)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)' }}>
                  I, <strong>{surgeonName || '[Surgeon Name]'}</strong>, confirm that the surgical details and proposed costs
                  above are accurate to the best of my knowledge and I take responsibility for this surgical assessment.
                </span>
              </label>

              <Button onClick={handleSubmit} disabled={submitting || !isValid} className="w-full">
                {submitting ? 'Submitting…' : 'Submit Surgical Section'}
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
              Surgical section locked after submission. Proceed to Anaesthetist section.
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
              {showCompleted ? 'Hide' : 'Show'} submitted surgical details
            </button>

            {showCompleted && req.surgicalForm && (
              <VerifyCard>
                <CardHead
                  icon={<Stethoscope style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
                  title="Submitted Surgical Details (read-only)"
                />
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Surgery', req.surgicalForm.surgery],
                    ['Assistant', req.surgicalForm.assistant || '—'],
                    ['Procedure Length', req.surgicalForm.procedureLength || '—'],
                    ['Preferred Anaesthesia', req.surgicalForm.preferredAnaesthesia || '—'],
                    ['Potential Date', req.surgicalForm.potentialDate || '—'],
                    ['Inpatient', req.surgicalForm.isInpatient ? `Yes, ${req.surgicalForm.losDays ?? '?'} day(s)` : 'No'],
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
