import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_GOP_REQUESTS, type GOPStatus, type MockGOPRequest, type AuditEntry } from './mock-data'

interface Performer {
  name: string
  role: string
}

interface CreateGOPInput {
  patientId: string
  patientName: string
  encounterId: string
  coverageId: string
  insurer: string
  questionnaireId: string
  assignedDoctor: string
  estimatedAmount: number
  createdBy: string
  createdByRole: string
}

interface GOPState {
  requests: MockGOPRequest[]
  setSurgeonVerified: (id: string, performer: Performer) => void
  setAnaesthetistVerified: (id: string, performer: Performer) => void
  setStaffFinalised: (id: string, performer: Performer) => void
  submitToInsurer: (id: string, performer: Performer) => void
  setRejected: (id: string, performer: Performer, reason: string) => void
  setExpired: (id: string, performer: Performer, detail?: string) => void
  reassignDoctor: (id: string, performer: Performer, newDoctor: string, reason: string) => void
  createGOPRequest: (input: CreateGOPInput) => string
  logFieldCorrection: (id: string, performer: Performer, fieldName: string, oldValue: string, newValue: string) => void
  // Legacy alias kept so existing call sites don't break
  setDoctorVerified: (id: string) => void
}

function makeEntry(action: AuditEntry['action'], performer: Performer, detail?: string): AuditEntry {
  return {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    performedAt: new Date().toISOString(),
    performedBy: performer.name,
    performedByRole: performer.role,
    detail,
  }
}

function appendAudit(req: MockGOPRequest, entry: AuditEntry): MockGOPRequest {
  return { ...req, auditLog: [entry, ...(req.auditLog ?? [])] }
}

export const useGopStore = create<GOPState>()(
  persist(
    (set, get) => ({
      requests: structuredClone(MOCK_GOP_REQUESTS),

      setSurgeonVerified: (id, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit({ ...r, surgeonVerified: true }, makeEntry('SURGEON_VERIFIED', performer))
          }),
        })),

      setAnaesthetistVerified: (id, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit({ ...r, anaesthetistVerified: true }, makeEntry('ANAESTHETIST_VERIFIED', performer))
          }),
        })),

      // Legacy alias — marks both so old flows don't break (no audit entry for legacy path)
      setDoctorVerified: (id) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, surgeonVerified: true, anaesthetistVerified: true, doctorVerified: true }
              : r
          ),
        })),

      setStaffFinalised: (id, performer) => {
        const req = get().requests.find((r) => r.id === id)
        if (!req) return
        const bothVerified =
          (req.surgeonVerified ?? req.doctorVerified) &&
          (req.anaesthetistVerified ?? req.doctorVerified)
        if (!bothVerified) return
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit({ ...r, staffFinalised: true }, makeEntry('STAFF_FINALISED', performer))
          }),
        }))
      },

      submitToInsurer: (id, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now = new Date().toISOString()
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            return appendAudit(
              { ...r, status: 'SUBMITTED' as GOPStatus, submittedAt: now, expiresAt },
              makeEntry('SUBMITTED_TO_INSURER', performer)
            )
          }),
        })),

      setExpired: (id, performer, detail = 'Auto-expired after 30 days without insurer response') =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id || r.status !== 'SUBMITTED') return r
            return appendAudit(
              { ...r, status: 'EXPIRED' as GOPStatus, resolvedAt: new Date().toISOString() },
              makeEntry('REQUEST_EXPIRED', performer, detail)
            )
          }),
        })),

      setRejected: (id, performer, reason) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now = new Date().toISOString()
            return appendAudit(
              { ...r, status: 'REJECTED' as GOPStatus, resolvedAt: now, notes: reason },
              makeEntry('REQUEST_REJECTED', performer, reason)
            )
          }),
        })),

      reassignDoctor: (id, performer, newDoctor, reason) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const oldDoctor = r.assignedDoctor
            let updated: MockGOPRequest = {
              ...r,
              assignedDoctor: newDoctor,
            }
            // Append reassignment entry (newest-first)
            updated = appendAudit(
              updated,
              makeEntry(
                'DOCTOR_REASSIGNED',
                performer,
                `Reassigned from ${oldDoctor} to ${newDoctor}. Reason: ${reason}`
              )
            )
            // Reset surgeon verification if set
            if (r.surgeonVerified) {
              updated = { ...updated, surgeonVerified: false }
              updated = appendAudit(
                updated,
                makeEntry('VERIFICATION_RESET', performer, 'Surgeon verification reset due to doctor reassignment')
              )
            }
            // Reset anaesthetist verification if set
            if (r.anaesthetistVerified) {
              updated = { ...updated, anaesthetistVerified: false }
              updated = appendAudit(
                updated,
                makeEntry('VERIFICATION_RESET', performer, 'Anaesthetist verification reset due to doctor reassignment')
              )
            }
            return updated
          }),
        })),

      logFieldCorrection: (id, performer, fieldName, oldValue, newValue) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const detail = `'${fieldName}' changed from "${oldValue}" to "${newValue}"`
            return appendAudit(r, makeEntry('FIELD_CORRECTED', performer, detail))
          }),
        })),

      createGOPRequest: (input) => {
        const newId = `gop-${Date.now()}`
        const now = new Date().toISOString()
        const initialEntry = makeEntry('REQUEST_CREATED', {
          name: input.createdBy,
          role: input.createdByRole,
        })
        const newRequest: MockGOPRequest = {
          id: newId,
          resourceType: 'Task',
          status: 'DRAFT',
          patientId: input.patientId,
          patientName: input.patientName,
          encounterId: input.encounterId,
          coverageId: input.coverageId,
          insurer: input.insurer as MockGOPRequest['insurer'],
          questionnaireId: input.questionnaireId,
          createdAt: now,
          updatedAt: now,
          createdBy: input.createdBy,
          assignedDoctor: input.assignedDoctor,
          doctorVerified: false,
          surgeonVerified: false,
          anaesthetistVerified: false,
          staffFinalised: false,
          hasAiPrefill: true,
          estimatedAmount: input.estimatedAmount,
          auditLog: [initialEntry],
        }
        set((s) => ({ requests: [newRequest, ...s.requests] }))

        // Fire-and-forget API sync
        fetch('/api/gop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }).catch(() => {})

        return newId
      },
    }),
    {
      name: 'gop-store-v3',
      partialize: (state) => ({ requests: state.requests }),
    }
  )
)
