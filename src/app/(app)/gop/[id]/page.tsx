'use client'

import { useParams, notFound, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import Link from 'next/link'
import { useState } from 'react'
import { useGopStore } from '@/lib/gop-store'
import { ReassignDoctorModal } from '@/components/gop/reassign-doctor-modal'
import { EditLockBanner } from '@/components/gop/edit-lock-banner'
import { useEditLock } from '@/hooks/use-edit-lock'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  getPatientById,
  getCoverageByPatientId,
  getEncounterById,
  formatPatientName,
  calculateAge,
  MOCK_PREFILL_RESPONSE,
  type AuditEntry,
} from '@/lib/mock-data'
import { CostTable } from '@/components/gop/cost-table'
import {
  ArrowLeft, User, Shield, Stethoscope,
  DollarSign, CheckCircle, Clock, Sparkles, Activity, FileText, Pencil, RefreshCw, UserCog, UserPlus,
  AlertCircle, Info, Download, Printer,
} from 'lucide-react'
import { GOPLivePanel } from '@/components/gop/gop-live-panel'
import { PriorityBadge } from '@/components/gop/priority-badge'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { GOPPriority } from '@/lib/mock-data'
import { PRIORITY_SLA } from '@/lib/mock-data'

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
  ANAESTHETIST_ASSIGNED: 'Anaesthetist assigned',
  VERIFICATION_RESET: 'Verification reset',
  APPEAL_INITIATED: 'Appeal initiated',
  APPEAL_NOTES_UPDATED: 'Appeal grounds updated',
  APPEAL_SUBMITTED: 'Appeal submitted',
  PRIORITY_CHANGED: 'Priority changed',
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
  ANAESTHETIST_ASSIGNED: UserPlus,
  VERIFICATION_RESET: RefreshCw,
  APPEAL_INITIATED: AlertCircle,
  APPEAL_NOTES_UPDATED: FileText,
  APPEAL_SUBMITTED: Sparkles,
  PRIORITY_CHANGED: AlertCircle,
}

const AUDIT_ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  ADMIN:            { bg: '#EDE9FF', color: '#6D28D9' },
  INSURANCE_STAFF:  { bg: 'var(--blue-50)', color: 'var(--blue-700)' },
  DOCTOR:           { bg: '#ECFDF5', color: '#059669' },
  SYSTEM:           { bg: 'var(--gray-100)', color: 'var(--gray-600)' },
}

function AuditTimeline({ auditLog }: { auditLog: AuditEntry[] }) {
  if (auditLog.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 20px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--gray-400)',
      }}>
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 4 }}>
      {/* vertical line */}
      <div style={{
        position: 'absolute', left: 17, top: 8, bottom: 8,
        width: 1, background: 'var(--border-light)',
      }} />
      {auditLog.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] ?? Activity
        const roleStyle = AUDIT_ROLE_STYLES[entry.performedByRole] ?? AUDIT_ROLE_STYLES.SYSTEM
        return (
          <div key={entry.id} style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '2px solid var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, zIndex: 1,
            }}>
              <Icon style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />
            </div>
            <div style={{ flex: 1, paddingTop: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: roleStyle.bg, color: roleStyle.color,
                }}>
                  {entry.performedBy}
                </span>
              </div>
              {entry.detail && (
                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3, fontStyle: 'italic' }}>
                  {entry.detail}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
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

const MOCK_DOCTORS = [
  'Dr. Sok Phearith',
  'Dr. Chan Reaksmey',
  'Dr. Roeun Chanveasna',
  'Dr. Lim Pagna',
  'Dr. Keo Sophea',
  'Dr. Sophea Meas',
]

function AssignAnaesthetistModal({
  open, onClose, gopId, performer,
}: {
  open: boolean
  onClose: () => void
  gopId: string
  performer: { name: string; role: string }
}) {
  const assignAnaesthetist = useGopStore((s) => s.assignAnaesthetist)
  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleConfirm() {
    if (!selected) return
    setSubmitting(true)
    assignAnaesthetist(gopId, selected, performer)
    setSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Assign Anaesthetist
          </DialogTitle>
          <DialogDescription>
            Select the anaesthetist who will complete anaesthetic verification for this request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label htmlFor="ana-select">Anaesthetist</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger id="ana-select">
              <SelectValue placeholder="Select a doctor…" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_DOCTORS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting}>
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InitiateAppealModal({
  open, onClose, gopId, patientName, performedBy,
}: {
  open: boolean
  onClose: () => void
  gopId: string
  patientName: string
  performedBy: string
}) {
  const initiateAppeal = useGopStore((s) => s.initiateAppeal)
  const updateAppealNotes = useGopStore((s) => s.updateAppealNotes)
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isValid = notes.trim().length >= 20

  function handleConfirm() {
    if (!isValid) return
    setSubmitting(true)
    const newId = initiateAppeal(gopId, performedBy)
    updateAppealNotes(newId, notes.trim(), performedBy)
    toast.success(`Appeal request created — ID: ${newId}`)
    router.push(`/gop/${newId}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" />
            Initiate Appeal
          </DialogTitle>
          <DialogDescription>
            You are creating an appeal for request <span className="font-mono font-medium">{gopId}</span> — {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="appeal-notes">
              Grounds for appeal <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="appeal-notes"
              placeholder="Describe the grounds for this appeal (minimum 20 characters)…"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {notes.length > 0 && notes.length < 20 && (
              <p className="text-xs text-destructive">{20 - notes.length} more characters required</p>
            )}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1.5">
            <p className="text-xs font-semibold text-amber-800">The following will be reset on the new request:</p>
            <ul className="text-xs text-amber-700 space-y-0.5">
              <li className="flex items-center gap-1.5"><span>☐</span> Surgeon verification will be reset</li>
              <li className="flex items-center gap-1.5"><span>☐</span> Anaesthetist verification will be reset</li>
              <li className="flex items-center gap-1.5"><span>☐</span> Finance sign-off will be reset</li>
              <li className="flex items-center gap-1.5"><span>☐</span> Staff finalisation will be reset</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!isValid || submitting}>
            Create Appeal Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail card primitives ────────────────────────────────────────────────

function DetailCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

function CardSectionHeader({ icon, title, action }: {
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}

function KVRow({ label, value, mono, first }: { label: string; value: React.ReactNode; mono?: boolean; first?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '8px 16px',
      borderTop: first ? undefined : '1px solid var(--border-light)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--gray-400)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', textAlign: 'right',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function GOPDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))

  if (!req) notFound()

  const patient      = getPatientById(req.patientId)
  const coverage     = getCoverageByPatientId(req.patientId)
  const encounter    = getEncounterById(req.encounterId)
  const prefillAnswers = MOCK_PREFILL_RESPONSE[req.id] ?? []

  const role             = useActiveRole()
  const userName         = session?.user?.name ?? ''
  const isDoctor         = role === 'DOCTOR'
  const isInsuranceStaff = role === 'INSURANCE_STAFF'
  const isITAdmin        = role === 'IT_ADMIN'
  const isFinance        = role === 'FINANCE'
  const isAdmin          = isITAdmin
  const isStaff          = isInsuranceStaff || isITAdmin

  const aiFieldCount  = prefillAnswers.filter(a => a.aiPrefilled).length
  const verifiedCount = prefillAnswers.filter(a => a.humanVerified).length

  const [reassignOpen, setReassignOpen] = useState(false)
  const [assignAnaOpen, setAssignAnaOpen] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)
  const [editingAppealNotes, setEditingAppealNotes] = useState(false)
  const [appealNotesDraft, setAppealNotesDraft] = useState(req.appealNotes)
  const [editingPriority, setEditingPriority] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details')
  const updateAppealNotes = useGopStore((s) => s.updateAppealNotes)
  const setPriority = useGopStore((s) => s.setPriority)
  const allRequests = useGopStore((s) => s.requests)
  const appealRequest = req.hasAppeal
    ? allRequests.find((r) => r.appealOf === req.id)
    : null

  const canReassign  = isITAdmin && (req.status === 'DRAFT' || req.status === 'SUBMITTED')
  const canAssignAna = isInsuranceStaff && req.assignedAnaesthetist === null && (req.status === 'DRAFT' || req.status === 'SUBMITTED')
  const performer    = { name: userName, role }

  const canInitiateAppeal = isInsuranceStaff && req.status === 'REJECTED' && !req.hasAppeal

  const lockUser = session?.user?.email ? { email: session.user.email, name: userName } : null
  const { conflictName, dismissed, dismiss } = useEditLock(id, lockUser)

  return (
    <div className="p-6 space-y-6">
      <EditLockBanner conflictName={conflictName} dismissed={dismissed} dismiss={dismiss} />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-h1">GOP Request — {req.insurer}</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--blue-600)', background: 'var(--blue-50)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
              {req.quoteNumber}
            </span>
          </div>
          <p className="text-tiny mt-0.5">
            Patient: {req.patientName} · Created {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Print Form PDF — any status */}
          <Button
            variant="outline" size="sm"
            onClick={() => { toast.info('Opening print dialog…'); setTimeout(() => window.print(), 200) }}
          >
            <Printer className="size-4" />
            Print
          </Button>

          {/* Download GOP PDF — APPROVED or SUBMITTED */}
          {(req.status === 'APPROVED' || req.status === 'SUBMITTED') && (
            <Button
              variant="outline" size="sm"
              onClick={() => toast.success('GOP PDF prepared — download will start shortly. (Demo mode)')}
            >
              <Download className="size-4" />
              Download GOP
            </Button>
          )}

          <Button variant="outline" size="sm" asChild>
            <Link href="/gop">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Emergency banner */}
      {req.priority === 'EMERGENCY' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid #FECACA', background: '#FFF0F0',
          borderLeft: '4px solid var(--priority-emergency-dot)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        }}>
          <AlertCircle style={{ width: 16, height: 16, color: 'var(--priority-emergency-text)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--priority-emergency-text)', flex: 1 }}>
            EMERGENCY — This request requires immediate processing. SLA: {PRIORITY_SLA.EMERGENCY.total} hours total from creation.
          </span>
        </div>
      )}

      {/* Appeal chain banner */}
      {req.appealOf && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          border: '1px solid var(--blue-200)', background: 'var(--blue-50)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        }}>
          <Info style={{ width: 15, height: 15, color: 'var(--blue-600)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--blue-700)', flex: 1 }}>
            <strong>This is an appeal request (v{req.appealVersion})</strong> for rejected request{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{req.appealOf}</span>.{' '}
            <Link href={`/gop/${req.appealOf}`} style={{ color: 'var(--blue-600)', textDecoration: 'underline' }}>
              View original request →
            </Link>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left column — 320px sticky */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Live status panel */}
          <GOPLivePanel
            gopId={req.id}
            isDoctor={isDoctor}
            isInsuranceStaff={isInsuranceStaff}
            isITAdmin={isITAdmin}
            isFinance={isFinance}
            isStaff={isStaff}
            isAdmin={isAdmin}
            userName={userName}
            userRole={role}
            aiFieldCount={aiFieldCount}
            prefillTotal={prefillAnswers.length}
            verifiedCount={verifiedCount}
          />

          {/* Appeal action — INSURANCE_STAFF only, REJECTED requests */}
          {req.status === 'REJECTED' && isInsuranceStaff && (
            canInitiateAppeal ? (
              <button
                onClick={() => setAppealOpen(true)}
                style={{
                  width: '100%', padding: '9px 14px',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
                  fontSize: 13, fontWeight: 500, color: 'var(--gray-700)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                className="hover:bg-[#F8FAFF] transition-colors"
              >
                <AlertCircle style={{ width: 14, height: 14, color: '#C47B10' }} />
                Initiate Appeal
              </button>
            ) : req.hasAppeal && appealRequest ? (
              <Link href={`/gop/${appealRequest.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid var(--blue-200)', background: 'var(--blue-50)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  fontSize: 13, color: 'var(--blue-700)', cursor: 'pointer',
                }}>
                  <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                  Appeal submitted — view appeal request →
                </div>
              </Link>
            ) : null
          )}

          {/* Finance Review action — Finance role, both doctors verified, finance not yet verified */}
          {isFinance && (req.surgeonVerified || req.doctorVerified) && (req.anaesthetistVerified || req.doctorVerified) && !req.financeVerified && req.status === 'DRAFT' && (
            <Link href={`/gop/${req.id}/verify/finance`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--blue-50) 0%, var(--ai-bg) 100%)',
                border: '1px solid var(--blue-200)', cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}>
                <DollarSign style={{ width: 15, height: 15, color: 'var(--blue-600)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)' }}>Go to Finance Review</div>
                  <div style={{ fontSize: 11, color: 'var(--blue-500)', marginTop: 1 }}>Both doctor verifications complete</div>
                </div>
                <ArrowLeft style={{ width: 13, height: 13, color: 'var(--blue-400)', transform: 'rotate(180deg)', flexShrink: 0 }} />
              </div>
            </Link>
          )}

          {/* Priority card */}
          <DetailCard>
            <CardSectionHeader
              title="Priority"
              action={isInsuranceStaff && !editingPriority ? (
                <button
                  onClick={() => setEditingPriority(true)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)', display: 'flex' }}
                >
                  <Pencil style={{ width: 12, height: 12 }} />
                </button>
              ) : undefined}
            />
            <div style={{ padding: '12px 16px' }}>
              {editingPriority ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Select
                    value={req.priority}
                    onValueChange={(v) => {
                      setPriority(req.id, v as GOPPriority, userName, role)
                      setEditingPriority(false)
                      toast.success(`Priority updated to ${v}`)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROUTINE">Routine</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setEditingPriority(false)}
                    style={{
                      padding: '6px', border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
                      fontSize: 12, color: 'var(--gray-600)', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PriorityBadge priority={req.priority} size="md" />
                  {req.prioritySetBy && (
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>set by {req.prioritySetBy}</span>
                  )}
                </div>
              )}
            </div>
          </DetailCard>

          {/* Patient card */}
          <DetailCard>
            <CardSectionHeader
              icon={<User style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
              title="Patient"
            />
            {patient ? (
              <>
                <KVRow first label="Name" value={formatPatientName(patient)} />
                <KVRow label="Age / Gender" value={`${calculateAge(patient.birthDate)} yrs · ${patient.gender}`} />
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-light)' }}>
                  <Link href={`/patients/${patient.id}`} style={{ fontSize: 12, color: 'var(--blue-600)', textDecoration: 'none' }}>
                    View patient record →
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-400)' }}>Patient data unavailable.</div>
            )}
          </DetailCard>

          {/* Coverage card */}
          {coverage && (
            <DetailCard>
              <CardSectionHeader
                icon={<Shield style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
                title="Coverage"
              />
              <KVRow first label="Plan" value={coverage.planName} />
              <KVRow label="Policy" value={coverage.policyNumber} mono />
              <KVRow label="Member ID" value={coverage.membershipId} mono />
              <KVRow label="Employer" value={req.employer || coverage.employer || '—'} />
              <KVRow label="Co-Pay" value={`${coverage.coPayPercent}%`} />
            </DetailCard>
          )}

          {/* Encounter card */}
          {encounter && (
            <DetailCard>
              <CardSectionHeader
                icon={<Stethoscope style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
                title="Encounter"
              />
              <KVRow first label="Reason" value={encounter.reasonCode?.[0]?.text ?? '—'} />
              <KVRow label="Provider" value={encounter.serviceProvider.display} />
              <KVRow label="Class" value={`${encounter.class.display} · ${encounter.status}`} />
              <KVRow label="Date" value={new Date(encounter.period.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />

              {/* Surgeon row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderTop: '1px solid var(--border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                    Surgeon
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: req.assignedSurgeon ? 'var(--gray-700)' : 'var(--gray-400)' }}>
                    {req.assignedSurgeon ?? 'Unassigned'}
                  </span>
                </div>
                {canReassign && (
                  <button
                    onClick={() => setReassignOpen(true)}
                    title="Reassign surgeon"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)', display: 'flex' }}
                  >
                    <Pencil style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </div>

              {/* Anaesthetist row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderTop: '1px solid var(--border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                    Anaesthetist
                  </div>
                  {req.assignedAnaesthetist
                    ? <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>{req.assignedAnaesthetist}</span>
                    : <span style={{ fontSize: 12, color: '#C47B10', fontStyle: 'italic' }}>Not yet assigned</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {canReassign && req.assignedAnaesthetist && (
                    <button
                      onClick={() => setReassignOpen(true)}
                      title="Reassign anaesthetist"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)', display: 'flex' }}
                    >
                      <Pencil style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                  {canAssignAna && (
                    <button
                      onClick={() => setAssignAnaOpen(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', border: '1px solid var(--blue-200)',
                        borderRadius: 'var(--radius-md)', background: 'var(--blue-50)',
                        fontSize: 11, fontWeight: 500, color: 'var(--blue-700)', cursor: 'pointer',
                      }}
                    >
                      <UserPlus style={{ width: 11, height: 11 }} />
                      Assign
                    </button>
                  )}
                </div>
              </div>

              {/* Warning: surgeon done but no anaesthetist */}
              {req.surgeonVerified && !req.assignedAnaesthetist && (
                <div style={{
                  margin: '0 12px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  border: '1px solid #FDE68A', background: '#FFFBEB',
                  borderRadius: 'var(--radius-md)', padding: '8px 10px',
                  fontSize: 12, color: '#92400E',
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  <span>An anaesthetist must be assigned before anaesthetist verification can begin.</span>
                </div>
              )}
            </DetailCard>
          )}

          {canReassign && (
            <ReassignDoctorModal
              open={reassignOpen}
              onClose={() => setReassignOpen(false)}
              gopId={req.id}
              currentSurgeon={req.assignedSurgeon}
              currentAnaesthetist={req.assignedAnaesthetist}
              performer={performer}
            />
          )}
          <AssignAnaesthetistModal
            open={assignAnaOpen}
            onClose={() => setAssignAnaOpen(false)}
            gopId={req.id}
            performer={performer}
          />
          <InitiateAppealModal
            open={appealOpen}
            onClose={() => setAppealOpen(false)}
            gopId={req.id}
            patientName={req.patientName}
            performedBy={userName}
          />
        </div>

        {/* Right column — tabbed content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 4,
            marginBottom: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
            padding: 6,
            width: 'fit-content',
          }}>
            {(['details', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 18px', border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: activeTab === tab ? 'var(--blue-600)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--gray-500)',
                  transition: 'all 120ms ease',
                }}
              >
                {tab === 'details' ? 'Details' : 'Activity'}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cost Estimate */}
              {req.lineItems?.length > 0 && (
                <DetailCard>
                  <CardSectionHeader
                    icon={<DollarSign style={{ width: 12, height: 12, color: 'var(--gray-400)' }} />}
                    title="Cost Estimate"
                    action={req.lineItems.some(item => item.editedByFinance) ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: '#FFFBEB', color: '#92400E',
                        border: '1px solid #FDE68A',
                      }}>
                        <Pencil style={{ width: 9, height: 9 }} />
                        Finance edited
                      </span>
                    ) : undefined}
                  />
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
                      Quote: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gray-700)' }}>{req.quoteNumber}</span>
                      {' · '}Date: {req.quoteDate}
                      {req.marketingPackage && <> · Package: {req.marketingPackage}</>}
                    </div>
                    <CostTable
                      lineItems={req.lineItems}
                      cpi={req.cpi ?? 1}
                      pricingType={req.pricingType ?? 'NORMAL'}
                      pricingUnit={req.pricingUnit}
                      marketingPackage={req.marketingPackage}
                      employer={req.employer}
                      coPayPercent={coverage?.coPayPercent}
                      showCategorySubtotals
                      editable={false}
                    />
                  </div>
                </DetailCard>
              )}

              {/* Form Answers Summary */}
              {prefillAnswers.length > 0 && (
                <DetailCard>
                  <CardSectionHeader
                    icon={<Sparkles style={{ width: 12, height: 12, color: 'var(--ai-color)' }} />}
                    title="Form Answers Summary"
                  />
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
                      Fields marked <span className="badge badge-ai" style={{ fontSize: 9, padding: '1px 6px', verticalAlign: 'middle' }}>AI</span> were prefilled by the AI service and require human verification.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {prefillAnswers.filter(a => a.answer !== '').map((answer) => (
                        <div key={answer.linkId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'capitalize' }}>
                              {answer.linkId.replace(/-/g, ' ')}:
                            </span>{' '}
                            <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>
                              {typeof answer.answer === 'boolean'
                                ? answer.answer ? 'Yes' : 'No'
                                : String(answer.answer)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {answer.aiPrefilled && (
                              <span className="badge badge-ai" style={{ fontSize: 9, padding: '1px 5px' }}>AI</span>
                            )}
                            {answer.humanVerified
                              ? <CheckCircle style={{ width: 13, height: 13, color: 'var(--success)' }} />
                              : <Clock style={{ width: 13, height: 13, color: '#C47B10' }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DetailCard>
              )}

              {!req.lineItems?.length && !prefillAnswers.length && (
                <DetailCard>
                  <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray-400)' }}>
                    No cost estimate or form answers available for this request yet.
                  </div>
                </DetailCard>
              )}

              {/* Notes */}
              {req.notes && (
                <DetailCard>
                  <CardSectionHeader title="Notes" />
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{req.notes}</p>
                  </div>
                </DetailCard>
              )}

              {/* Appeal notes */}
              {(req.appealNotes || (req.appealOf && isInsuranceStaff && req.status === 'DRAFT')) && (
                <DetailCard>
                  <CardSectionHeader
                    icon={<AlertCircle style={{ width: 12, height: 12, color: 'var(--blue-600)' }} />}
                    title="Grounds for appeal"
                    action={isInsuranceStaff && req.status === 'DRAFT' && req.appealOf && !editingAppealNotes ? (
                      <button
                        onClick={() => { setAppealNotesDraft(req.appealNotes); setEditingAppealNotes(true) }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)', display: 'flex' }}
                      >
                        <Pencil style={{ width: 12, height: 12 }} />
                      </button>
                    ) : undefined}
                  />
                  <div style={{ padding: 16 }}>
                    {editingAppealNotes ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Textarea
                          rows={4}
                          value={appealNotesDraft}
                          onChange={(e) => setAppealNotesDraft(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            size="sm"
                            disabled={appealNotesDraft.trim().length < 20}
                            onClick={() => {
                              updateAppealNotes(req.id, appealNotesDraft.trim(), userName)
                              setEditingAppealNotes(false)
                            }}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingAppealNotes(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {req.appealNotes || <span style={{ fontStyle: 'italic', color: 'var(--gray-400)' }}>No grounds recorded yet.</span>}
                      </p>
                    )}
                  </div>
                </DetailCard>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <AuditTimeline auditLog={req.auditLog ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
