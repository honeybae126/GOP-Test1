// src/lib/mock-data.ts — Complete mock data for GOP Automation System (Phase 1)

// ── Types ──────────────────────────────────────────────────────────────────────

export type GOPStatus   = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type GOPPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY'
export type InsurerCode = 'APRIL' | 'HSC' | 'LUMA' | 'AIA' | 'ASSURNET'
export type CostCategory =
  | 'SURGICAL_STAFF'
  | 'ANAESTHESIA'
  | 'EQUIPMENT_INSTRUMENTS'
  | 'FACILITY_THEATRE'
  | 'IPD_WARD'
  | 'PHARMACY'
  | 'OTHER'

export type AuditAction =
  | 'REQUEST_CREATED'
  | 'FIELD_CORRECTED'
  | 'SURGEON_VERIFIED'
  | 'ANAESTHETIST_VERIFIED'
  | 'FINANCE_VERIFIED'
  | 'STAFF_FINALISED'
  | 'SUBMITTED_TO_INSURER'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_EXPIRED'
  | 'DOCTOR_REASSIGNED'
  | 'VERIFICATION_RESET'
  | 'ANAESTHETIST_ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'APPEAL_INITIATED'
  | 'APPEAL_NOTES_UPDATED'
  | 'APPEAL_SUBMITTED'
  | 'EXPIRY_WARNING_SENT'
  | 'APPROVAL_RECORDED'
  | 'COST_RECONCILED'
  | 'SUPPLEMENTARY_FLAGGED'
  | 'COST_UPDATED'
  | 'COST_EDITED'
  | 'NOTE_ADDED'

export interface CostLineItem {
  id: string
  department: string
  category: CostCategory
  code: string
  description: string
  unit: number
  unitPrice: number
  amount: number
  discount: number
  netAmount: number
  editedByFinance?: boolean
}

export interface AuditEntry {
  id: string
  action: AuditAction
  performedAt: string
  performedBy: string
  performedByRole: string
  detail?: string
}

export interface HumanName {
  family: string
  given: string[]
  prefix?: string[]
}

export interface MockPatient {
  id: string
  resourceType: 'Patient'
  name: HumanName[]
  gender: 'male' | 'female'
  birthDate: string
  identifier: Array<{ system: string; value: string }>
  telecom: Array<{ system: string; value: string }>
  address?: Array<{ line?: string[]; city: string; country: string }>
}

export interface MockCoverage {
  id: string
  resourceType: 'Coverage'
  status: 'active' | 'inactive' | 'cancelled'
  beneficiary: { reference: string }
  insurer: InsurerCode
  planName: string
  policyNumber: string
  membershipId: string
  coPayPercent: number
  employer?: string
  period?: { start: string; end: string }
  coverageDates?: { start: string; end: string }
}

export interface MockEncounter {
  id: string
  resourceType: 'Encounter'
  status: 'in-progress' | 'planned' | 'finished'
  class: { code: string; display: string }
  subject: { reference: string }
  participant: Array<{ individual: { reference: string; display: string } }>
  reasonCode?: Array<{
    text: string
    coding?: Array<{ system: string; code: string; display: string }>
  }>
  serviceProvider: { display: string }
  period: { start: string; end?: string }
}

export interface SurgicalFormData {
  surgery: string
  assistant: string
  procedureLength: string
  preferredAnaesthesia: string
  potentialDate: string
  isInpatient: boolean
  losDays: number | null
  surgeonFee: number
  assistantFee: number
  otProcedureFee: number
  nursingFeeOT: number
  ipdRoomCharge: number
  ipdNursing: number
  ipdDoctor: number
  ipdSpecialistConsult: number
  histopathology: number
}

export interface AnaesthesiaFormData {
  asaClass: string
  anaesthesiaType: string
  preOpLab: boolean
  preOpECG: boolean
  preOpRadiology: boolean
  referralCardiology: boolean
  referralRespiratory: boolean
  referralOther: string
  isICU: boolean
  icuLOS: number | null
  anaesthesiologistFee: number
  anaesthesiaFee: number
  drugs: number
  consumables: number
  others: number
}

export interface MockGOPRequest {
  id: string
  resourceType: 'Task'
  quoteNumber: string
  quoteDate: string
  status: GOPStatus
  priority: GOPPriority
  patientId: string
  patientName: string
  encounterId: string
  coverageId: string
  insurer: InsurerCode
  questionnaireId: string
  assignedSurgeon: string | null
  assignedAnaesthetist: string | null
  surgicalForm?: SurgicalFormData | null
  anaesthesiaForm?: AnaesthesiaFormData | null
  // Verification flags
  doctorVerified: boolean
  surgeonVerified: boolean
  anaesthetistVerified: boolean
  financeVerified: boolean
  staffFinalised: boolean
  // Verification timestamps
  surgeonVerifiedAt?: string | null
  anaesthetistVerifiedAt?: string | null
  financeVerifiedAt?: string | null
  staffFinalisedAt?: string | null
  // Lifecycle timestamps
  createdAt: string
  updatedAt: string
  createdBy?: string
  submittedAt?: string | null
  expiresAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  resolvedAt?: string | null
  decidedAt?: string | null
  // Registration numbers captured on verify pages
  surgeonRegistrationNumber?: string | null
  anaesthetistRegistrationNumber?: string | null
  // Appeal identity
  isAppeal?: boolean
  linkedToId?: string | null
  // Cost
  estimatedAmount: number
  estimatedCost?: number
  approvedAmount?: number | null
  actualCost?: number | null
  costVariance?: number | null
  requiresSupplementaryClaim?: boolean
  reconciliationNotes?: string | null
  reconciliationStatus?: string | null
  // CPI / pricing
  cpi: number
  pricingType: 'NORMAL' | 'DIFFERENT'
  pricingUnit?: string | null
  marketingPackage?: string | null
  employer?: string | null
  // Appeal
  appealOf: string | null
  appealVersion: number
  hasAppeal: boolean
  appealNotes: string
  appealStatus?: string | null
  // Metadata
  hasAiPrefill: boolean
  notes?: string | null
  rejectedReason?: string | null
  prioritySetBy?: string | null
  prioritySetAt?: string | null
  stageEnteredAt: Partial<Record<string, string>>
  auditLog: AuditEntry[]
  lineItems: CostLineItem[]
}

export interface QuestionnaireItem {
  linkId: string
  text: string
  type: 'group' | 'string' | 'text' | 'boolean' | 'integer' | 'choice' | 'date' | 'decimal' | 'display'
  required?: boolean
  readOnly?: boolean
  answerOption?: Array<{ valueCoding?: { display: string }; valueString?: string }>
  item?: QuestionnaireItem[]
}

export interface MockQuestionnaire {
  id: string
  resourceType: 'Questionnaire'
  title: string
  insurer: InsurerCode
  version: string
  item: QuestionnaireItem[]
}

export interface MockCostEstimate {
  encounterId: string
  total: number
  coPayAmount?: number
  lineItems?: CostLineItem[]
}

export interface QuestionnaireResponseAnswer {
  linkId: string
  answer: string | boolean | number
  aiPrefilled: boolean
  humanVerified: boolean
}

export type PrefillEntry = {
  linkId: string
  answer: string | boolean | number
  aiPrefilled: boolean
  humanVerified: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  SURGICAL_STAFF:        'Surgical Staff',
  ANAESTHESIA:           'Anaesthesia',
  EQUIPMENT_INSTRUMENTS: 'Equipment & Instruments',
  FACILITY_THEATRE:      'Facility & Theatre',
  IPD_WARD:              'IPD Ward',
  PHARMACY:              'Pharmacy',
  OTHER:                 'Other',
}

export const PRIORITY_SLA: Record<GOPPriority, { total: number; perStage: Record<string, number> }> = {
  EMERGENCY: {
    total: 7,
    perStage: { awaiting_surgeon: 2, awaiting_anaesthetist: 2, awaiting_finance: 1, awaiting_finalisation: 1, awaiting_submission: 1 },
  },
  URGENT: {
    total: 28,
    perStage: { awaiting_surgeon: 8, awaiting_anaesthetist: 8, awaiting_finance: 4, awaiting_finalisation: 4, awaiting_submission: 4 },
  },
  ROUTINE: {
    total: 168,
    perStage: { awaiting_surgeon: 48, awaiting_anaesthetist: 48, awaiting_finance: 24, awaiting_finalisation: 24, awaiting_submission: 24 },
  },
}


// ── Patients ──────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS: MockPatient[] = []

// ── Encounters ────────────────────────────────────────────────────────────────

export const MOCK_ENCOUNTERS: MockEncounter[] = [] // Mock data removed - use real HIS API

// ── Coverages ─────────────────────────────────────────────────────────────────

export const MOCK_COVERAGES: MockCoverage[] = [] // Mock data removed - use real HIS API

// ── Prefill Responses ─────────────────────────────────────────────────────────

export const MOCK_PREFILL_RESPONSE: Record<string, PrefillEntry[]> = {}

// ── Cost Estimates ────────────────────────────────────────────────────────────

export const MOCK_COST_ESTIMATES: MockCostEstimate[] = []

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  totalRequests:      9,
  draft:              4,
  submitted:          1,
  approved:           1,
  rejected:           1,
  expired:            1,
  avgTurnaroundHours: 48,
}

// ── Questionnaires ────────────────────────────────────────────────────────────

const COMMON_PATIENT_FIELDS: QuestionnaireItem[] = [
  { linkId: 'patient-allergies',   text: 'Known Allergies',              type: 'string',  required: false },
  { linkId: 'pre-existing',        text: 'Pre-existing Conditions',       type: 'string',  required: true  },
  { linkId: 'current-medications', text: 'Current Medications',           type: 'string',  required: false },
]

const COMMON_CLINICAL_FIELDS: QuestionnaireItem[] = [
  { linkId: 'primary-diagnosis',     text: 'Primary Diagnosis (ICD-10)',       type: 'string',  required: true },
  { linkId: 'diagnosis-description', text: 'Diagnosis Description',             type: 'string',  required: true },
  { linkId: 'planned-procedure',     text: 'Planned Procedure(s)',               type: 'string',  required: true },
  { linkId: 'admission-type',        text: 'Admission Type',                     type: 'choice',  required: true,
    answerOption: [{ valueCoding: { display: 'Elective' } }, { valueCoding: { display: 'Urgent' } }, { valueCoding: { display: 'Emergency' } }] },
  { linkId: 'length-of-stay',        text: 'Estimated Length of Stay (days)',    type: 'integer', required: true },
  { linkId: 'clinical-notes',        text: 'Clinical Notes / Supporting Evidence', type: 'string', required: false },
]

const COMMON_COST_FIELDS: QuestionnaireItem[] = [
  { linkId: 'estimated-cost', text: 'Total Estimated Cost (USD)', type: 'decimal', required: true },
  { linkId: 'currency',       text: 'Currency',                   type: 'string',  required: true },
]

export const MOCK_QUESTIONNAIRES: MockQuestionnaire[] = [
  {
    id: 'Q-APRIL-001', resourceType: 'Questionnaire', title: 'APRIL Pre-Authorisation Form', insurer: 'APRIL', version: '2.1',
    item: [
      { linkId: 'section-patient',  text: 'Patient Information', type: 'group', item: COMMON_PATIENT_FIELDS },
      { linkId: 'section-clinical', text: 'Clinical Details',    type: 'group', item: COMMON_CLINICAL_FIELDS },
      { linkId: 'section-cost',     text: 'Cost Estimate',       type: 'group', item: COMMON_COST_FIELDS },
      { linkId: 'section-declaration', text: 'Declaration', type: 'group', item: [
        { linkId: 'treating-doctor', text: 'Treating Physician Name',   type: 'string',  required: true },
        { linkId: 'reg-number',      text: 'Medical Registration No.',  type: 'string',  required: true },
        { linkId: 'declaration',     text: 'I declare the information above is accurate and complete.', type: 'boolean', required: true },
      ]},
    ],
  },
  {
    id: 'Q-HSC-001', resourceType: 'Questionnaire', title: 'HSC Medical Pre-Authorisation', insurer: 'HSC', version: '3.0',
    item: [
      { linkId: 'section-patient',     text: 'Patient Details',       type: 'group', item: COMMON_PATIENT_FIELDS },
      { linkId: 'section-clinical',    text: 'Clinical Overview',     type: 'group', item: COMMON_CLINICAL_FIELDS },
      { linkId: 'section-cost',        text: 'Cost Breakdown',        type: 'group', item: COMMON_COST_FIELDS },
      { linkId: 'section-additional',  text: 'Additional Information', type: 'group', item: [
        { linkId: 'specialist-referral', text: 'Specialist Referral Number', type: 'string', required: false },
        { linkId: 'previous-claim',      text: 'Previous Related Claim No.', type: 'string', required: false },
      ]},
    ],
  },
  {
    id: 'Q-LUMA-001', resourceType: 'Questionnaire', title: 'LUMA Hospital Pre-Authorisation', insurer: 'LUMA', version: '1.5',
    item: [
      { linkId: 'section-patient',  text: 'Patient Information', type: 'group', item: COMMON_PATIENT_FIELDS },
      { linkId: 'section-clinical', text: 'Clinical Details',    type: 'group', item: COMMON_CLINICAL_FIELDS },
      { linkId: 'section-cost',     text: 'Financial Estimate',  type: 'group', item: COMMON_COST_FIELDS },
    ],
  },
  {
    id: 'Q-AIA-001', resourceType: 'Questionnaire', title: 'AIA Hospital Pre-Authorisation Form', insurer: 'AIA', version: '4.2',
    item: [
      { linkId: 'section-patient',  text: 'Patient Details',  type: 'group', item: COMMON_PATIENT_FIELDS },
      { linkId: 'section-clinical', text: 'Clinical Details', type: 'group', item: COMMON_CLINICAL_FIELDS },
      { linkId: 'section-cost',     text: 'Cost Estimate',    type: 'group', item: COMMON_COST_FIELDS },
    ],
  },
  {
    id: 'Q-ASSURNET-001', resourceType: 'Questionnaire', title: 'ASSURNET Pre-Authorisation Request', insurer: 'ASSURNET', version: '2.0',
    item: [
      { linkId: 'section-patient',  text: 'Patient Info',    type: 'group', item: COMMON_PATIENT_FIELDS },
      { linkId: 'section-clinical', text: 'Medical Details', type: 'group', item: COMMON_CLINICAL_FIELDS },
      { linkId: 'section-cost',     text: 'Cost Details',    type: 'group', item: COMMON_COST_FIELDS },
    ],
  },
]

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getPatientById(id: string): MockPatient | undefined {
  console.warn('getPatientById called with mock data removed - implement real API call');
  return undefined;
}

export function getCoverageByPatientId(patientId: string): MockCoverage | undefined {
  console.warn('getCoverageByPatientId called with mock data removed - implement real API call');
  return undefined;
}

export function getEncounterById(id: string): MockEncounter | undefined {
  return MOCK_ENCOUNTERS.find(e => e.id === id)
}

export function formatPatientName(patient: MockPatient): string {
  const name = patient.name?.[0]
  if (!name) return 'Unknown Patient'
  return [...(name.prefix ?? []), ...(name.given ?? []), name.family].filter(Boolean).join(' ')
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now   = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function getQuestionnaireById(id: string): MockQuestionnaire | undefined {
  return MOCK_QUESTIONNAIRES.find(q => q.id === id)
}

export function getCostEstimateByEncounterId(encounterId: string): MockCostEstimate | undefined {
  return MOCK_COST_ESTIMATES.find(e => e.encounterId === encounterId)
}
