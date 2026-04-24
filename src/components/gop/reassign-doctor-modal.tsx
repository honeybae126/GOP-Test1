'use client'

import { useState, useEffect } from 'react'
import { useGopStore } from '@/lib/gop-store'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserCog } from 'lucide-react'
import { toast } from 'sonner'

// Fallback mock doctor list when DB is unavailable
const MOCK_DOCTORS = [
  'Dr. Sok Phearith',
  'Dr. Chan Reaksmey',
  'Dr. Roeun Chanveasna',
  'Dr. Lim Pagna',
  'Dr. Keo Sophea',
]

interface ReassignDoctorModalProps {
  open: boolean
  onClose: () => void
  gopId: string
  currentSurgeon: string | null
  currentAnaesthetist: string | null
  performer: { name: string; role: string }
}

export function ReassignDoctorModal({
  open,
  onClose,
  gopId,
  currentSurgeon,
  currentAnaesthetist,
  performer,
}: ReassignDoctorModalProps) {
  const reassignDoctor = useGopStore((s) => s.reassignDoctor)

  const [role, setRole] = useState<'surgeon' | 'anaesthetist'>('surgeon')
  const [doctors, setDoctors] = useState<string[]>(MOCK_DOCTORS)
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentDoctor = role === 'surgeon' ? currentSurgeon : currentAnaesthetist

  // Fetch real doctor list from DB, fall back to mock on error
  useEffect(() => {
    if (!open) return
    setRole('surgeon')
    setSelected('')
    setReason('')
    fetch('/api/users?role=DOCTOR')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDoctors(data.map((u: { displayName?: string; name?: string }) => u.displayName ?? u.name ?? '').filter(Boolean))
        }
      })
      .catch(() => {}) // silently use mock list
  }, [open])

  const canSubmit = selected && selected !== currentDoctor && reason.trim().length > 0

  async function handleConfirm() {
    if (!canSubmit) return
    setSubmitting(true)

    reassignDoctor(gopId, performer, selected, reason.trim(), role)

    fetch(`/api/gop/${gopId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role === 'surgeon' ? { assignedSurgeonId: selected } : { assignedAnaesthetistId: selected }),
    }).catch(() => {})

    toast.success(`Doctor reassigned to ${selected} successfully`)
    setSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-4" />
            Reassign Doctor
          </DialogTitle>
          <DialogDescription>
            Select a new doctor and provide a reason for the reassignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Role selector */}
          <div className="space-y-1.5">
            <Label>Reassign role</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="reassign-role"
                  value="surgeon"
                  checked={role === 'surgeon'}
                  onChange={() => { setRole('surgeon'); setSelected('') }}
                  className="accent-primary"
                />
                Surgeon
                {currentSurgeon && <span className="text-xs text-muted-foreground">({currentSurgeon})</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="reassign-role"
                  value="anaesthetist"
                  checked={role === 'anaesthetist'}
                  onChange={() => { setRole('anaesthetist'); setSelected('') }}
                  className="accent-primary"
                />
                Anaesthetist
                {currentAnaesthetist && <span className="text-xs text-muted-foreground">({currentAnaesthetist})</span>}
              </label>
            </div>
          </div>

          {/* Doctor dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="doctor-select">{role === 'surgeon' ? 'Surgeon' : 'Anaesthetist'}</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="doctor-select">
                <SelectValue placeholder="Select a doctor…" />
              </SelectTrigger>
              <SelectContent>
                {currentDoctor && (
                  <SelectItem value={currentDoctor} disabled>
                    {currentDoctor} <span className="text-muted-foreground ml-1">(current)</span>
                  </SelectItem>
                )}
                {doctors
                  .filter((d) => d !== currentDoctor)
                  .map((doctor) => (
                    <SelectItem key={doctor} value={doctor}>
                      {doctor}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <Label htmlFor="reassign-reason">
              Reason for reassignment <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reassign-reason"
              placeholder="e.g. Doctor unavailable — on leave from 8 Apr"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.trim().length === 0 && selected && (
              <p className="text-xs text-destructive">Reason is required.</p>
            )}
          </div>

          {selected && selected !== currentDoctor && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {role === 'surgeon'
                ? 'Existing surgeon verification will be reset and must be completed again by the new surgeon.'
                : 'Existing anaesthetist verification will be reset and must be completed again by the new anaesthetist.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Confirm Reassignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
