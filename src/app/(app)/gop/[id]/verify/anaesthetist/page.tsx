'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPatientById, formatPatientName, calculateAge } from '@/lib/mock-data'
import { ArrowLeft, CheckCircle, Lock, AlertTriangle, Check, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'

type FieldStatus = 'pending' | 'accepted' | 'correcting' | 'corrected'

interface FieldState {
  key: string
  label: string
  aiValue: string
  userValue: string
  status: FieldStatus
  multiline?: boolean
  isSelect?: boolean
  selectOptions?: { value: string; label: string }[]
}

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

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </span>
      {sub && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

function FieldReviewRow({
  field,
  onAccept,
  onStartCorrect,
  onConfirmCorrect,
  draftValue,
  onDraftChange,
  disabled,
}: {
  field: FieldState
  onAccept: () => void
  onStartCorrect: () => void
  onConfirmCorrect: () => void
  draftValue: string
  onDraftChange: (v: string) => void
  disabled: boolean
}) {
  const statusBg =
    field.status === 'accepted' ? '#ECFDF5' :
    field.status === 'corrected' ? '#FFFBEB' : 'var(--gray-50, #F9FAFB)'

  const statusBorder =
    field.status === 'accepted' ? '#A7F3D0' :
    field.status === 'corrected' ? '#FDE68A' : 'var(--border-light)'

  const statusColor =
    field.status === 'accepted' ? '#065F46' :
    field.status === 'corrected' ? '#92400E' : 'var(--gray-500)'

  return (
    <div style={{
      border: `1px solid ${statusBorder}`,
      borderRadius: 10,
      background: statusBg,
      padding: '12px 14px',
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {field.label}
        </span>
        {field.status === 'accepted' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: statusColor }}>
            <Check style={{ width: 12, height: 12 }} /> Accepted
          </span>
        )}
        {field.status === 'corrected' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: statusColor }}>
            <Pencil style={{ width: 11, height: 11 }} /> Corrected
          </span>
        )}
      </div>

      <div style={{
        fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5,
        background: 'white', borderRadius: 6, padding: '8px 10px',
        border: '1px solid var(--border-light)',
        fontStyle: field.aiValue ? 'normal' : 'italic',
      }}>
        {field.aiValue || <span style={{ color: 'var(--gray-400)' }}>No AI prefill value — enter value if applicable</span>}
      </div>

      {field.status === 'corrected' && !disabled && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ flexShrink: 0, fontWeight: 600 }}>Corrected to:</span>
          <span style={{ lineHeight: 1.5 }}>{field.userValue}</span>
        </div>
      )}

      {field.status === 'correcting' && !disabled && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500 }}>Enter corrected value:</div>
          {field.multiline ? (
            <Textarea
              value={draftValue}
              onChange={e => onDraftChange(e.target.value)}
              rows={3}
              style={{ fontSize: 13 }}
              placeholder={`Corrected ${field.label.toLowerCase()}…`}
            />
          ) : field.isSelect ? (
            <Select value={draftValue} onValueChange={onDraftChange}>
              <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {field.selectOptions?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={draftValue}
              onChange={e => onDraftChange(e.target.value)}
              style={{ fontSize: 13 }}
              placeholder={`Corrected ${field.label.toLowerCase()}…`}
            />
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={onConfirmCorrect} disabled={!draftValue.trim()} style={{ fontSize: 12, height: 28, paddingLeft: 12, paddingRight: 12 }}>
              Confirm Correction
            </Button>
            <Button size="sm" variant="ghost" onClick={onAccept} style={{ fontSize: 12, height: 28 }}>
              Accept instead
            </Button>
          </div>
        </div>
      )}

      {field.status === 'pending' && !disabled && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={onAccept}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: '1.5px solid #A7F3D0',
              background: '#ECFDF5', color: '#065F46',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Check style={{ width: 12, height: 12 }} /> Accept
          </button>
          <button
            onClick={onStartCorrect}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: '1.5px solid #FDE68A',
              background: '#FFFBEB', color: '#92400E',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Pencil style={{ width: 11, height: 11 }} /> Correct
          </button>
        </div>
      )}
    </div>
  )
}

function SignaturePreview({ name }: { name: string }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-medium)',
      borderRadius: 10, padding: '14px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Digital Signature Preview
      </div>
      <div style={{
        borderBottom: '2px solid var(--gray-300)',
        paddingBottom: 8,
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 22,
        fontStyle: 'italic',
        color: 'var(--gray-700)',
        letterSpacing: '0.03em',
        minHeight: 40,
        display: 'flex', alignItems: 'flex-end',
      }}>
        {name || <span style={{ color: 'var(--gray-300)', fontSize: 16 }}>Signature will appear here</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
        {name ? `Dr. ${name}` : ''} — Anaesthetist
      </div>
    </div>
  )
}

export default function AnaesthetistVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const { setAnaesthetistVerified } = useGopStore()

  const role = session?.user?.role ?? ''

  useEffect(() => {
    if (!role) return
    if (role !== 'DOCTOR') { router.replace(`/gop/${id}`); return }
    if (!req) return
    if (
      req.assignedAnaesthetist !== session?.user?.name ||
      !(req.surgeonVerified ?? req.doctorVerified ?? false) ||
      req.anaesthetistVerified ||
      req.status !== 'DRAFT'
    ) {
      router.replace(`/gop/${id}`)
    }
  }, [role, req, id, router, session?.user?.name])

  const FIELDS_INIT: FieldState[] = [
    { key: 'secondary-diagnosis',  label: 'Secondary Diagnosis (ICD-10)',           aiValue: '',              userValue: '', status: 'pending' },
    { key: 'anaesthesia-type',     label: 'Anaesthesia Type',                        aiValue: 'General',       userValue: '', status: 'pending', isSelect: true,
      selectOptions: [
        { value: 'General',   label: 'General Anaesthesia' },
        { value: 'Regional',  label: 'Regional Anaesthesia' },
        { value: 'Local',     label: 'Local Anaesthesia' },
        { value: 'Sedation',  label: 'Sedation' },
        { value: 'None',      label: 'None Required' },
      ],
    },
    { key: 'asa-status',           label: 'ASA Physical Status',                     aiValue: '',              userValue: '', status: 'pending', isSelect: true,
      selectOptions: [
        { value: 'I',   label: 'ASA I — Normal healthy patient' },
        { value: 'II',  label: 'ASA II — Mild systemic disease' },
        { value: 'III', label: 'ASA III — Severe systemic disease' },
        { value: 'IV',  label: 'ASA IV — Life-threatening disease' },
        { value: 'V',   label: 'ASA V — Moribund patient' },
      ],
    },
    { key: 'risk-notes',           label: 'Anaesthesia Risk Notes',                  aiValue: '',              userValue: '', status: 'pending', multiline: true },
    { key: 'anaesthetic-agents',   label: 'Planned Anaesthetic Agents / Technique',  aiValue: '',              userValue: '', status: 'pending', multiline: true },
    { key: 'postop-care',          label: 'Post-operative Care Plan',                aiValue: '',              userValue: '', status: 'pending', multiline: true },
  ]

  const [fields, setFields]             = useState<FieldState[]>(FIELDS_INIT)
  const [drafts, setDrafts]             = useState<Record<string, string>>({})
  const [anaesthetistName, setAnaesthetistName] = useState(session?.user?.name ?? '')
  const [regNumber, setRegNumber]       = useState('')
  const [declared, setDeclared]         = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const patient        = req ? getPatientById(req.patientId) : null
  const surgeonDone    = req?.surgeonVerified ?? false
  const alreadyVerified = req?.anaesthetistVerified ?? false

  const lockUser = session?.user?.email ? { email: session.user.email, name: session.user.name ?? '' } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  const reviewedCount = fields.filter(f => f.status === 'accepted' || f.status === 'corrected').length
  const allReviewed   = reviewedCount === fields.length
  const progressPct   = fields.length === 0 ? 0 : Math.round((reviewedCount / fields.length) * 100)

  const patchField = useCallback((key: string, patch: Partial<FieldState>) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, ...patch } : f))
  }, [])

  const handleAccept       = (key: string) => patchField(key, { status: 'accepted', userValue: '' })
  const handleStartCorrect = (key: string, field: FieldState) => {
    setDrafts(d => ({ ...d, [key]: field.aiValue }))
    patchField(key, { status: 'correcting' })
  }
  const handleConfirmCorrect = (key: string) => {
    const val = drafts[key] ?? ''
    if (!val.trim()) return
    patchField(key, { status: 'corrected', userValue: val })
  }

  if (role !== 'DOCTOR') return null
  if (!req) return null

  const handleSubmit = async () => {
    if (!declared) { toast.error('Please tick the declaration checkbox.'); return }
    if (!anaesthetistName.trim()) { toast.error('Anaesthetist name is required.'); return }
    if (!regNumber.trim()) { toast.error('Medical registration number is required.'); return }
    if (!allReviewed) { toast.error('Please review all anaesthetic fields before submitting.'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const performer = { name: session?.user?.name ?? anaesthetistName, role: session?.user?.role ?? 'DOCTOR' }
    setAnaesthetistVerified(id, performer, regNumber)

    fetch(`/api/gop/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationRole: 'anaesthetist', anaesthetistName, regNumber }),
    }).catch(() => {})

    toast.success('Anaesthetist verification submitted. Staff can now finalise.')
    router.push(`/gop/${id}`)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1">Anaesthetist Verification</h1>
          <p className="text-body mt-1.5" >
            Step 2 of 3 — Anaesthetic review for {req.patientName}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/gop/${id}`}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      </div>

      {/* Workflow progress bar */}
      <VerifyCard style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
        {[
          { step: 1, label: 'Surgeon',     done: true,  active: false },
          { step: 2, label: 'Anaesthetist', done: false, active: true },
          { step: 3, label: 'Finance',      done: false, active: false },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {s.done ? (
                <CheckCircle style={{ width: 20, height: 20, color: 'var(--success)' }} />
              ) : (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: s.active ? 'var(--blue-600)' : 'var(--gray-100)',
                  color: s.active ? '#fff' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{s.step}</div>
              )}
              <span style={{
                fontSize: 13, fontWeight: s.active ? 600 : 400,
                color: s.done ? 'var(--success)' : s.active ? 'var(--blue-600)' : 'var(--gray-400)',
              }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div style={{ flex: 1, height: 1, background: s.done ? 'var(--success)' : 'var(--border-light)', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </VerifyCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!surgeonDone && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            fontSize: 13, color: '#92400E',
          }}>
            <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
            <span>
              Surgeon verification must be completed before anaesthetist verification.{' '}
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
            Anaesthetist verification is already complete. Fields are locked.
          </div>
        )}

        {/* Patient summary */}
        {patient && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)', padding: '12px 20px',
            display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
          }}>
            {[
              { label: 'Patient', value: formatPatientName(patient) },
              { label: 'Age',     value: `${calculateAge(patient.birthDate)} yrs` },
              { label: 'Insurer', value: req.insurer },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--gray-400)' }}>{label}: </span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Anaesthetic Information — Accept/Correct fields */}
        <VerifyCard>
          <CardHead
            title="Anaesthetic Information"
            sub="Review each field and Accept or Correct as needed before declaring."
          />

          {/* Field review progress */}
          {!alreadyVerified && surgeonDone && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--gray-50, #F9FAFB)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)' }}>
                  {reviewedCount} of {fields.length} fields reviewed
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: allReviewed ? '#065F46' : 'var(--gray-500)' }}>
                  {progressPct}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: allReviewed ? '#10B981' : 'var(--blue-600)',
                  width: `${progressPct}%`,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
              </div>
            </div>
          )}

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fields.map(field => (
              <FieldReviewRow
                key={field.key}
                field={field}
                onAccept={() => handleAccept(field.key)}
                onStartCorrect={() => handleStartCorrect(field.key, field)}
                onConfirmCorrect={() => handleConfirmCorrect(field.key)}
                draftValue={drafts[field.key] ?? field.aiValue}
                onDraftChange={v => setDrafts(d => ({ ...d, [field.key]: v }))}
                disabled={alreadyVerified || !surgeonDone}
              />
            ))}
          </div>
        </VerifyCard>

        {/* Anaesthetist details */}
        <VerifyCard>
          <CardHead title="Anaesthetist Details" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="space-y-1.5">
                <Label htmlFor="ana-name">Anaesthetist Name</Label>
                <Input id="ana-name" value={anaesthetistName} onChange={e => setAnaesthetistName(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="Full name as on registration" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ana-reg">Medical Registration Number</Label>
                <Input id="ana-reg" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={alreadyVerified || !surgeonDone} placeholder="e.g. KH-MED-005678" />
              </div>
            </div>
          </div>
        </VerifyCard>

        {/* Declaration — locked until all fields reviewed */}
        {!alreadyVerified && surgeonDone && (
          <VerifyCard>
            <CardHead
              title="Declaration"
              sub={allReviewed ? 'All fields reviewed — you may now declare and submit.' : `Review all ${fields.length} fields above to unlock this section.`}
            />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SignaturePreview name={anaesthetistName} />

              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: allReviewed ? 'pointer' : 'not-allowed',
                opacity: allReviewed ? 1 : 0.5,
              }}>
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={e => allReviewed && setDeclared(e.target.checked)}
                  disabled={!allReviewed}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--blue-600)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)' }}>
                  I, <strong>{anaesthetistName || '[Anaesthetist Name]'}</strong>, confirm that the anaesthetic plan above is appropriate for the patient and that I accept responsibility for the anaesthetic component of this pre-authorisation.
                </span>
              </label>

              {!allReviewed && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--gray-50, #F9FAFB)', border: '1px solid var(--border-light)',
                  fontSize: 12, color: 'var(--gray-500)',
                }}>
                  <Lock style={{ width: 13, height: 13, flexShrink: 0 }} />
                  Declaration locked — {fields.length - reviewedCount} field{fields.length - reviewedCount !== 1 ? 's' : ''} remaining
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !declared || !allReviewed}
                className="w-full"
              >
                {submitting ? 'Submitting…' : 'Submit Anaesthetist Verification'}
              </Button>
            </div>
          </VerifyCard>
        )}

        {/* Already verified state */}
        {alreadyVerified && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              fontSize: 13, color: '#065F46',
            }}>
              <Lock style={{ width: 14, height: 14, flexShrink: 0 }} />
              Anaesthetist section locked. Both verifications complete — staff may now finalise.
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
              {showCompleted ? 'Hide' : 'Show'} verified anaesthetic details
            </button>

            {showCompleted && (
              <VerifyCard>
                <CardHead title="Verified Anaesthetic Information (read-only)" />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {FIELDS_INIT.map(f => (
                    <div key={f.key} style={{ fontSize: 13 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                      <div style={{ padding: '6px 10px', background: 'var(--gray-50, #F9FAFB)', borderRadius: 6, color: 'var(--gray-700)' }}>
                        {f.aiValue || '—'}
                      </div>
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
