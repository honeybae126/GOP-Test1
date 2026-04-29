import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type GOPStatus,
  type GOPPriority,
  type MockGOPRequest,
  type AuditEntry,
  type CostLineItem,
  type SurgicalFormData,
  type AnaesthesiaFormData,
} from './mock-data'

interface Performer {
  name: string
  role: string
}

interface CreateGOPInput {
  patientId:       string
  patientName:     string
  encounterId:     string
  coverageId:      string
  insurer:         string
  questionnaireId: string
  assignedSurgeon: string | null
  estimatedAmount: number
  createdBy:       string
  createdByRole:   string
  priority?:       GOPPriority
  lineItems?:      CostLineItem[]
  employer?:       string | null
  marketingPackage?: string | null
}

interface GOPState {
  requests:        MockGOPRequest[]
  gopQuoteCounter: number   // last-used sequential number for quote numbering
  setSurgeonVerified:      (id: string, performer: Performer, surgicalForm: SurgicalFormData, regNumber?: string) => void
  setAnaesthetistVerified: (id: string, performer: Performer, anaesthesiaForm: AnaesthesiaFormData, regNumber?: string) => void
  setFinanceVerified:      (id: string, performer: Performer) => void
  setStaffFinalised:       (id: string, performer: Performer) => void
  submitToInsurer:         (id: string, performer: Performer) => void
  setRejected:             (id: string, performer: Performer, reason: string) => void
  setExpired:              (id: string, performer: Performer, detail?: string) => void
  assignAnaesthetist:      (id: string, anaesthetistName: string, performer: Performer) => void
  reassignDoctor:          (id: string, performer: Performer, newDoctor: string, reason: string, role: 'surgeon' | 'anaesthetist') => void
  createGOPRequest:        (input: CreateGOPInput) => string
  logFieldCorrection:      (id: string, performer: Performer, fieldName: string, oldValue: string, newValue: string) => void
  initiateAppeal:          (rejectedId: string, performedBy: string) => string
  updateAppealNotes:       (id: string, notes: string, performedBy: string) => void
  setPriority:             (id: string, priority: GOPPriority, performedBy: string, performedByRole: string) => void
  updateLineItems:         (id: string, items: CostLineItem[], performer: Performer) => void
  setCPI:                  (id: string, newCpi: number, performer: Performer) => void
  setPricingType:          (id: string, pricingType: 'NORMAL' | 'DIFFERENT', pricingUnit: string | null, performer: Performer) => void
  setMarketingPackage:     (id: string, marketingPackage: string | null, performer: Performer) => void
  setEmployer:             (id: string, employer: string | null, performer: Performer) => void
  // Legacy alias kept so existing call sites don't break
  setDoctorVerified:       (id: string) => void
  // Replaces in-memory seed with real data from Prisma via GET /api/gop
  fetchGOPRequests:        () => Promise<void>
}

function makeEntry(action: AuditEntry['action'], performer: Performer, detail?: string): AuditEntry {
  return {
    id:             `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    performedAt:    new Date().toISOString(),
    performedBy:    performer.name,
    performedByRole: performer.role,
    detail,
  }
}

function appendAudit(req: MockGOPRequest, entry: AuditEntry): MockGOPRequest {
  return { ...req, auditLog: [entry, ...(req.auditLog ?? [])] }
}

function generateQuoteNumber(counter: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  return `EQ${year}-${counter}`
}

function makeLine(id: string, description: string, category: CostLineItem['category'], amount: number): CostLineItem {
  return { id, department: '', category, code: '', description, unit: 1, unitPrice: amount, amount, discount: 0, netAmount: amount }
}

function surgicalLineItems(f: SurgicalFormData): CostLineItem[] {
  const rows: Array<[string, string, CostLineItem['category'], number]> = [
    ['sli-01', 'Surgeon Fee',            'SURGICAL_STAFF',        f.surgeonFee],
    ['sli-02', 'Assistant Fee',          'SURGICAL_STAFF',        f.assistantFee],
    ['sli-03', 'OT Procedure Fee',       'FACILITY_THEATRE',      f.otProcedureFee],
    ['sli-04', 'Nursing Fee (OT)',       'FACILITY_THEATRE',      f.nursingFeeOT],
    ['sli-05', 'IPD Room Charge',        'IPD_WARD',              f.ipdRoomCharge],
    ['sli-06', 'IPD Nursing',            'IPD_WARD',              f.ipdNursing],
    ['sli-07', 'IPD Doctor',             'IPD_WARD',              f.ipdDoctor],
    ['sli-08', 'IPD Specialist Consult', 'IPD_WARD',              f.ipdSpecialistConsult],
    ['sli-09', 'Histopathology',         'OTHER',                 f.histopathology],
  ]
  return rows.filter(([,,,amt]) => amt > 0).map(([id, desc, cat, amt]) => makeLine(id, desc, cat, amt))
}

function anaesthesiaLineItems(f: AnaesthesiaFormData): CostLineItem[] {
  const rows: Array<[string, string, CostLineItem['category'], number]> = [
    ['ali-01', 'Anaesthesiologist Fee', 'ANAESTHESIA',           f.anaesthesiologistFee],
    ['ali-02', 'Anaesthesia Fee',       'ANAESTHESIA',           f.anaesthesiaFee],
    ['ali-03', 'Drugs',                 'PHARMACY',              f.drugs],
    ['ali-04', 'Consumables',           'EQUIPMENT_INSTRUMENTS', f.consumables],
    ['ali-05', 'Others',                'OTHER',                 f.others],
  ]
  return rows.filter(([,,,amt]) => amt > 0).map(([id, desc, cat, amt]) => makeLine(id, desc, cat, amt))
}

export const useGopStore = create<GOPState>()(
  persist(
    (set, get) => ({
      requests:        [],
      gopQuoteCounter: 9,

      setSurgeonVerified: (id, performer, surgicalForm, regNumber?: string) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now      = new Date().toISOString()
            const sItems   = surgicalLineItems(surgicalForm)
            // Keep any existing anaesthesia-side items, replace surgical-side
            const anaItems = (r.lineItems ?? []).filter(i =>
              i.category === 'ANAESTHESIA' || i.id.startsWith('ali-')
            )
            const newItems = [...sItems, ...anaItems]
            const total    = +newItems.reduce((sum, i) => sum + i.netAmount, 0).toFixed(2)
            const updated  = {
              ...r,
              surgicalForm,
              lineItems: newItems,
              estimatedAmount: total,
              surgeonVerified: true,
              surgeonVerifiedAt: now,
              surgeonRegistrationNumber: regNumber ?? r.surgeonRegistrationNumber ?? null,
              stageEnteredAt: { ...r.stageEnteredAt, awaiting_anaesthetist: now },
            }
            return appendAudit(updated, makeEntry('SURGEON_VERIFIED', performer, `Registration: ${regNumber ?? 'N/A'}`))
          }),
        })),

      setAnaesthetistVerified: (id, performer, anaesthesiaForm, regNumber?: string) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now      = new Date().toISOString()
            const aItems   = anaesthesiaLineItems(anaesthesiaForm)
            // Keep surgeon-side items, replace anaesthesia-side
            const sItems   = (r.lineItems ?? []).filter(i => i.id.startsWith('sli-'))
            const newItems = [...sItems, ...aItems]
            const total    = +newItems.reduce((sum, i) => sum + i.netAmount, 0).toFixed(2)
            const updated  = {
              ...r,
              anaesthesiaForm,
              lineItems: newItems,
              estimatedAmount: total,
              anaesthetistVerified: true,
              anaesthetistVerifiedAt: now,
              anaesthetistRegistrationNumber: regNumber ?? r.anaesthetistRegistrationNumber ?? null,
              stageEnteredAt: { ...r.stageEnteredAt, awaiting_finance: now },
            }
            return appendAudit(updated, makeEntry('ANAESTHETIST_VERIFIED', performer, `Registration: ${regNumber ?? 'N/A'}`))
          }),
        })),

      setFinanceVerified: (id, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now     = new Date().toISOString()
            const updated = {
              ...r,
              financeVerified: true,
              stageEnteredAt: { ...r.stageEnteredAt, awaiting_finalisation: now },
            }
            return appendAudit(updated, makeEntry('FINANCE_VERIFIED', performer))
          }),
        })),

      // Legacy alias — marks both verified without audit entry
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
            const now     = new Date().toISOString()
            const updated = {
              ...r,
              staffFinalised: true,
              stageEnteredAt: { ...r.stageEnteredAt, awaiting_submission: now },
            }
            return appendAudit(updated, makeEntry('STAFF_FINALISED', performer))
          }),
        }))
      },

      submitToInsurer: (id, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now      = new Date().toISOString()
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            const updated  = {
              ...r,
              status:     'SUBMITTED' as GOPStatus,
              submittedAt: now,
              expiresAt,
              stageEnteredAt: { ...r.stageEnteredAt, submitted: now },
            }
            return appendAudit(updated, makeEntry('SUBMITTED_TO_INSURER', performer))
          }),
        })),

      setExpired: (id, performer, detail = 'Auto-expired after 30 days without insurer response') =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id || r.status !== 'SUBMITTED') return r
            const now     = new Date().toISOString()
            const updated = {
              ...r,
              status: 'EXPIRED' as GOPStatus,
              resolvedAt: now,
              stageEnteredAt: { ...r.stageEnteredAt, resolved: now },
            }
            return appendAudit(updated, makeEntry('REQUEST_EXPIRED', performer, detail))
          }),
        })),

      setRejected: (id, performer, reason) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now     = new Date().toISOString()
            const updated = {
              ...r,
              status: 'REJECTED' as GOPStatus,
              resolvedAt: now,
              notes: reason,
              stageEnteredAt: { ...r.stageEnteredAt, resolved: now },
            }
            return appendAudit(updated, makeEntry('REQUEST_REJECTED', performer, reason))
          }),
        })),

      assignAnaesthetist: (id, anaesthetistName, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, assignedAnaesthetist: anaesthetistName },
              makeEntry('ANAESTHETIST_ASSIGNED', performer, `Anaesthetist assigned: ${anaesthetistName}`)
            )
          }),
        })),

      reassignDoctor: (id, performer, newDoctor, reason, role) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const oldDoctor = role === 'surgeon' ? r.assignedSurgeon : r.assignedAnaesthetist
            let updated: MockGOPRequest = role === 'surgeon'
              ? { ...r, assignedSurgeon: newDoctor }
              : { ...r, assignedAnaesthetist: newDoctor }
            updated = appendAudit(
              updated,
              makeEntry(
                'DOCTOR_REASSIGNED',
                performer,
                `${role === 'surgeon' ? 'Surgeon' : 'Anaesthetist'} reassigned from ${oldDoctor} to ${newDoctor}. Reason: ${reason}`
              )
            )
            if (role === 'surgeon' && r.surgeonVerified) {
              updated = { ...updated, surgeonVerified: false }
              updated = appendAudit(
                updated,
                makeEntry('VERIFICATION_RESET', performer, 'Surgeon verification reset due to reassignment')
              )
            }
            if (role === 'anaesthetist' && r.anaesthetistVerified) {
              updated = { ...updated, anaesthetistVerified: false }
              updated = appendAudit(
                updated,
                makeEntry('VERIFICATION_RESET', performer, 'Anaesthetist verification reset due to reassignment')
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
        const newId  = `gop-${Date.now()}`
        const now    = new Date().toISOString()
        const today  = now.slice(0, 10)

        // Generate quote number using the persisted counter
        const nextCounter = get().gopQuoteCounter + 1
        const quoteNumber = generateQuoteNumber(nextCounter)

        const initialEntry = makeEntry('REQUEST_CREATED', {
          name: input.createdBy,
          role: input.createdByRole,
        })

        const newRequest: MockGOPRequest = {
          id:                  newId,
          resourceType:        'Task',
          status:              'DRAFT',
          patientId:           input.patientId,
          patientName:         input.patientName,
          encounterId:         input.encounterId,
          coverageId:          input.coverageId,
          insurer:             input.insurer as MockGOPRequest['insurer'],
          questionnaireId:     input.questionnaireId,
          createdAt:           now,
          updatedAt:           now,
          createdBy:           input.createdBy,
          assignedSurgeon:     input.assignedSurgeon,
          assignedAnaesthetist: null,
          doctorVerified:      false,
          surgeonVerified:     false,
          anaesthetistVerified: false,
          financeVerified:     false,
          staffFinalised:      false,
          hasAiPrefill:        true,
          estimatedAmount:     input.estimatedAmount,
          appealOf:            null,
          appealVersion:       1,
          hasAppeal:           false,
          appealNotes:         '',
          appealStatus:        null,
          priority:            input.priority ?? 'ROUTINE',
          prioritySetBy:       null,
          prioritySetAt:       null,
          stageEnteredAt:      { awaiting_surgeon: now },
          auditLog:            [initialEntry],
          submittedAt:         null,
          expiresAt:           null,
          approvedAt:          null,
          rejectedAt:          null,
          rejectedReason:      null,
          // Cost quotation fields
          cpi:             1,
          pricingType:     'NORMAL',
          pricingUnit:     null,
          marketingPackage: input.marketingPackage ?? null,
          employer:        input.employer ?? null,
          quoteNumber,
          quoteDate:       today,
          lineItems:       input.lineItems ?? [],
        }

        set((s) => ({
          requests:        [newRequest, ...s.requests],
          gopQuoteCounter: nextCounter,
        }))

        // Fire-and-forget API sync
        fetch('/api/gop', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(input),
        }).catch(() => {})

        return newId
      },

      updateLineItems: (id, items, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const total = items.reduce((sum, i) => sum + i.netAmount, 0)
            const isFinance = performer.role === 'FINANCE'
            const taggedItems = isFinance
              ? items.map(i => ({ ...i, editedByFinance: true }))
              : items
            const updated: MockGOPRequest = {
              ...r,
              lineItems:       taggedItems,
              estimatedAmount: +total.toFixed(2),
              updatedAt:       new Date().toISOString(),
            }
            const action = isFinance ? 'COST_EDITED' : 'COST_UPDATED'
            return appendAudit(
              updated,
              makeEntry(action, performer, `Cost estimate updated. New total: $${total.toFixed(2)}`)
            )
          }),
        })),

      initiateAppeal: (rejectedId, performedBy) => {
        const original = get().requests.find((r) => r.id === rejectedId)
        if (!original) return ''
        const newVersion  = original.appealVersion + 1
        const newId       = `gop-appeal-${Date.now()}`
        const now         = new Date().toISOString()
        const today       = now.slice(0, 10)
        // Appeal quote format: EQyy-nnn-An (original quote # with appeal suffix)
        const baseQuote   = original.quoteNumber.replace(/-A\d+$/, '') // strip existing appeal suffix
        const quoteNumber = `${baseQuote}-A${newVersion - 1}`

        const initEntry = makeEntry(
          'APPEAL_INITIATED',
          { name: performedBy, role: 'INSURANCE_STAFF' },
          `Appeal initiated from rejected request ${rejectedId} — version ${newVersion}`
        )
        const appealRequest: MockGOPRequest = {
          ...original,
          id:                  newId,
          status:              'DRAFT',
          createdAt:           now,
          updatedAt:           now,
          submittedAt:         null,
          expiresAt:           null,
          resolvedAt:          null,
          surgeonVerified:     false,
          anaesthetistVerified: false,
          doctorVerified:      false,
          financeVerified:     false,
          staffFinalised:      false,
          hasAiPrefill:        true,
          appealOf:            rejectedId,
          appealVersion:       newVersion,
          hasAppeal:           false,
          appealNotes:         '',
          appealStatus:        'in_progress',
          stageEnteredAt:      { awaiting_surgeon: now },
          auditLog:            [initEntry],
          quoteNumber,
          quoteDate:           today,
        }
        set((s) => ({
          requests: [
            appealRequest,
            ...s.requests.map((r) =>
              r.id === rejectedId ? { ...r, hasAppeal: true } : r
            ),
          ],
        }))
        return newId
      },

      updateAppealNotes: (id, notes, performedBy) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, appealNotes: notes },
              makeEntry(
                'APPEAL_NOTES_UPDATED',
                { name: performedBy, role: 'INSURANCE_STAFF' },
                `Appeal grounds: ${notes}`
              )
            )
          }),
        })),

      setPriority: (id, priority, performedBy, performedByRole) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            const now = new Date().toISOString()
            return appendAudit(
              { ...r, priority, prioritySetBy: performedBy, prioritySetAt: now },
              makeEntry(
                'PRIORITY_CHANGED',
                { name: performedBy, role: performedByRole },
                `Priority set to ${priority} by ${performedBy}`
              )
            )
          }),
        })),

      setCPI: (id, newCpi, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, cpi: newCpi, updatedAt: new Date().toISOString() },
              makeEntry('COST_UPDATED', performer, `CPI updated to ${newCpi}`)
            )
          }),
        })),

      setPricingType: (id, pricingType, pricingUnit, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, pricingType, pricingUnit, updatedAt: new Date().toISOString() },
              makeEntry('COST_UPDATED', performer, `Pricing type set to ${pricingType}${pricingUnit ? ` (${pricingUnit})` : ''}`)
            )
          }),
        })),

      setMarketingPackage: (id, marketingPackage, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, marketingPackage, updatedAt: new Date().toISOString() },
              makeEntry('FIELD_CORRECTED', performer, `Marketing package set to ${marketingPackage ?? 'none'}`)
            )
          }),
        })),

      setEmployer: (id, employer, performer) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r
            return appendAudit(
              { ...r, employer, updatedAt: new Date().toISOString() },
              makeEntry('FIELD_CORRECTED', performer, `Employer set to ${employer ?? 'none'}`)
            )
          }),
        })),

      fetchGOPRequests: async () => {
        try {
          const res = await fetch('/api/gop')
          if (!res.ok) throw new Error('Failed to fetch GOP requests')
          const data = await res.json()
          set({ requests: data })
        } catch (error) {
          console.error('fetchGOPRequests error:', error)
        }
      },
    }),
    {
      name:       'gop-store-v5',
      partialize: (state) => ({
        requests:        state.requests,
        gopQuoteCounter: state.gopQuoteCounter,
      }),
    }
  )
)

