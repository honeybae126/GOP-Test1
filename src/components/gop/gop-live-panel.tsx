'use client'

import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import { DownloadPdfButton } from '@/components/gop/download-pdf-button'
import {
  CheckCircle, AlertTriangle, Clock, Sparkles,
  FileText, ClipboardCheck, Send, CheckSquare, Loader2, ThumbsUp, ThumbsDown, Circle, TimerOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface GOPLivePanelProps {
  gopId: string
  isDoctor: boolean
  isStaff: boolean
  isAdmin: boolean
  userName: string
  userRole: string
  aiFieldCount: number
  prefillTotal: number
  verifiedCount: number
}

function StepRow({ done, label, active = false }: { done: boolean; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${active ? 'font-medium' : ''}`}>
      {done
        ? <CheckCircle className="size-3.5 text-green-500 shrink-0" />
        : active
          ? <Circle className="size-3.5 text-primary shrink-0" />
          : <Clock className="size-3.5 text-muted-foreground shrink-0" />}
      <span className={done ? 'text-green-700' : active ? 'text-primary' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}

export function GOPLivePanel({
  gopId, isDoctor, isStaff, isAdmin, userName, userRole, aiFieldCount, prefillTotal, verifiedCount,
}: GOPLivePanelProps) {
  const req = useGopStore((s) => s.requests.find((r) => r.id === gopId))
  const { setStaffFinalised, submitToInsurer, setRejected, setExpired } = useGopStore()
  const performer = { name: userName, role: userRole }
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [expireOpen, setExpireOpen] = useState(false)

  if (!req) return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Request not found in session. Try refreshing.
    </div>
  )

  // Derive verification state — support both old (doctorVerified) and new fields
  const surgeonDone      = req.surgeonVerified      ?? req.doctorVerified ?? false
  const anaesthetistDone = req.anaesthetistVerified ?? req.doctorVerified ?? false
  const bothDone         = surgeonDone && anaesthetistDone

  const isAssignedToMe = isDoctor && req.assignedDoctor === userName

  const handleFinalise = () => {
    setLoading('finalise')
    setTimeout(() => {
      setStaffFinalised(gopId, performer)
      setLoading(null)
      toast.success('Request marked as finalised. Ready to submit.')
    }, 600)
  }

  const handleSubmit = () => {
    setLoading('submit')
    setTimeout(() => {
      submitToInsurer(gopId, performer)
      setLoading(null)
      toast.success(`GOP request submitted to ${req.insurer}.`)
    }, 800)

    fetch(`/api/gop/${gopId}/submit`, { method: 'POST' }).catch(() => {})
  }

  const handleApprove = async () => {
    setLoading('approve')
    try {
      const res = await fetch(`/api/gop/${gopId}/approve`, { method: 'POST' })
      if (res.ok) {
        toast.success('GOP request marked as approved.')
        window.location.reload()
      } else {
        toast.error('Failed to approve request.')
      }
    } catch {
      toast.error('Failed to approve request.')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason.'); return }
    setLoading('reject')
    try {
      const res = await fetch(`/api/gop/${gopId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      if (res.ok) {
        setRejected(gopId, performer, rejectReason.trim())
        toast.success('GOP request marked as rejected.')
        setRejectOpen(false)
      } else {
        toast.error('Failed to reject request.')
      }
    } catch {
      toast.error('Failed to reject request.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Status banners ──────────────────────────────── */}
      {isStaff && req.status === 'DRAFT' && !bothDone && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>Awaiting Verification</AlertTitle>
          <AlertDescription>
            <strong>{req.assignedDoctor}</strong> must complete surgeon and anaesthetist verification before this request can be finalised.
          </AlertDescription>
        </Alert>
      )}
      {isStaff && req.status === 'DRAFT' && bothDone && !req.staffFinalised && (
        <Alert variant="info">
          <Clock className="size-4" />
          <AlertTitle>Ready for Finalisation</AlertTitle>
          <AlertDescription>
            Both verifications complete. Review the cost estimate, then click <strong>Mark as Finalised</strong>.
          </AlertDescription>
        </Alert>
      )}
      {isStaff && req.status === 'DRAFT' && req.staffFinalised && (
        <Alert variant="info">
          <CheckSquare className="size-4" />
          <AlertTitle>Finalised — Ready to Submit</AlertTitle>
          <AlertDescription>
            Click <strong>Submit to {req.insurer}</strong> to send this GOP request.
          </AlertDescription>
        </Alert>
      )}
      {req.status === 'SUBMITTED' && (
        <Alert>
          <Send className="size-4" />
          <AlertTitle>Submitted to {req.insurer}</AlertTitle>
          <AlertDescription>Awaiting insurer decision.</AlertDescription>
        </Alert>
      )}
      {req.status === 'APPROVED' && (
        <Alert variant="success">
          <CheckCircle className="size-4" />
          <AlertTitle>Request Approved</AlertTitle>
          <AlertDescription>
            Approved amount: <strong>${req.approvedAmount?.toLocaleString()}</strong>
          </AlertDescription>
        </Alert>
      )}
      {req.status === 'REJECTED' && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Request Rejected</AlertTitle>
          <AlertDescription>{req.notes}</AlertDescription>
        </Alert>
      )}

      {/* ── Status card ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Request Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status</span>
            <GOPStatusBadge status={req.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Insurer</span>
            <span className="font-medium px-2 py-0.5 rounded-full bg-muted text-xs">{req.insurer}</span>
          </div>
          {aiFieldCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="size-3.5 text-violet-500" />
              <span className="text-muted-foreground">
                AI prefilled <strong>{aiFieldCount}</strong> fields — {verifiedCount}/{prefillTotal} verified
              </span>
            </div>
          )}

          <Separator />

          {/* 3-step progress */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Verification Progress</p>
            <StepRow done={surgeonDone} label="Surgeon verification" active={!surgeonDone} />
            <StepRow done={anaesthetistDone} label="Anaesthetist verification" active={surgeonDone && !anaesthetistDone} />
            <StepRow done={!!req.staffFinalised} label="Staff finalisation" active={bothDone && !req.staffFinalised} />
          </div>
        </CardContent>
      </Card>

      {/* ── Action buttons ──────────────────────────────── */}
      {req.status === 'DRAFT' && (
        <div className="flex flex-col gap-2">
          {isStaff && (
            <Link href={`/gop/${req.id}/form`}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="size-3.5 mr-1.5" />
                Edit Form
              </Button>
            </Link>
          )}

          {/* Doctor: surgeon verification button */}
          {isDoctor && isAssignedToMe && !surgeonDone && (
            <Link href={`/gop/${req.id}/verify/surgeon`}>
              <Button className="w-full justify-start">
                <ClipboardCheck className="size-3.5 mr-1.5" />
                Start Surgeon Verification
              </Button>
            </Link>
          )}

          {/* Doctor: anaesthetist button only after surgeon done */}
          {isDoctor && isAssignedToMe && surgeonDone && !anaesthetistDone && (
            <Link href={`/gop/${req.id}/verify/anaesthetist`}>
              <Button className="w-full justify-start">
                <ClipboardCheck className="size-3.5 mr-1.5" />
                Start Anaesthetist Verification
              </Button>
            </Link>
          )}

          {/* Finance review — visible to all when at least surgeon done */}
          {surgeonDone && (
            <Link href={`/gop/${req.id}/verify/finance`}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="size-3.5 mr-1.5" />
                View Finance Review
              </Button>
            </Link>
          )}

          {isStaff && bothDone && !req.staffFinalised && (
            <Button
              variant="outline"
              className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={handleFinalise}
              disabled={loading === 'finalise'}
            >
              {loading === 'finalise'
                ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                : <CheckSquare className="size-3.5 mr-1.5" />}
              {loading === 'finalise' ? 'Finalising…' : 'Mark as Finalised'}
            </Button>
          )}

          {isStaff && req.staffFinalised && (
            <Button
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={loading === 'submit'}
            >
              {loading === 'submit'
                ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                : <Send className="size-3.5 mr-1.5" />}
              {loading === 'submit' ? 'Submitting…' : `Submit to ${req.insurer}`}
            </Button>
          )}
        </div>
      )}

      {/* Admin: Mark as Expired — only for SUBMITTED */}
      {isAdmin && req.status === 'SUBMITTED' && (
        <Button
          variant="outline"
          className="w-full justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
          onClick={() => setExpireOpen(true)}
          disabled={!!loading}
        >
          <TimerOff className="size-3.5 mr-1.5" />
          Mark as Expired
        </Button>
      )}

      {isStaff && (req.status === 'APPROVED' || req.status === 'SUBMITTED' || req.status === 'REJECTED') && (
        <div className="space-y-1.5">
          <DownloadPdfButton gopId={req.id} status={req.status} />
          {req.status === 'REJECTED' && (
            <p className="text-[11px] text-muted-foreground leading-snug px-0.5">
              This document reflects the request at time of rejection and may be used for appeal or audit purposes.
            </p>
          )}
        </div>
      )}

      {/* Admin: Approve / Reject */}
      {isAdmin && req.status === 'SUBMITTED' && (
        <div className="flex flex-col gap-2">
          <Button
            className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={!!loading}
          >
            {loading === 'approve'
              ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              : <ThumbsUp className="size-3.5 mr-1.5" />}
            {loading === 'approve' ? 'Approving…' : 'Approve Request'}
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setRejectOpen(true)}
            disabled={!!loading}
          >
            <ThumbsDown className="size-3.5 mr-1.5" />
            Reject Request
          </Button>
        </div>
      )}

      {/* Expire confirmation dialog */}
      <Dialog open={expireOpen} onOpenChange={setExpireOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Expired</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this request as expired? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpireOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              disabled={loading === 'expire'}
              onClick={() => {
                setLoading('expire')
                setExpired(gopId, performer, 'Manually expired by admin')
                setExpireOpen(false)
                setLoading(null)
                toast.success('Request marked as expired.')
              }}
            >
              {loading === 'expire'
                ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                : <TimerOff className="size-3.5 mr-1.5" />}
              Confirm Expiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject GOP Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be recorded and sent to the responsible staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading === 'reject'}>
              {loading === 'reject' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
