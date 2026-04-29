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

// ── Line Item Templates ────────────────────────────────────────────────────────

const CARDIAC_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-c01', department: 'Cardiothoracic', category: 'SURGICAL_STAFF',        code: 'SRG-CAR-01', description: 'Cardiac Surgeon Fee (CABG)',         unit: 1, unitPrice: 8000, amount: 8000, discount:   0, netAmount: 8000 },
  { id: 'li-c02', department: 'Cardiothoracic', category: 'SURGICAL_STAFF',        code: 'SRG-RES-01', description: 'Resident Surgeon Assistance',         unit: 1, unitPrice: 1500, amount: 1500, discount:   0, netAmount: 1500 },
  { id: 'li-c03', department: 'Anaesthesia',    category: 'ANAESTHESIA',            code: 'ANA-GEN-01', description: 'General Anaesthesia (cardiac)',       unit: 1, unitPrice: 3000, amount: 3000, discount:   0, netAmount: 3000 },
  { id: 'li-c04', department: 'Cardiothoracic', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-CBP-01', description: 'Cardiopulmonary Bypass Circuit',       unit: 1, unitPrice: 4500, amount: 4500, discount: 500, netAmount: 4000 },
  { id: 'li-c05', department: 'Theatre',        category: 'FACILITY_THEATRE',       code: 'FAC-THR-08', description: 'Theatre Usage (8 hours)',              unit: 8, unitPrice:  600, amount: 4800, discount:   0, netAmount: 4800 },
  { id: 'li-c06', department: 'ICU',            category: 'IPD_WARD',               code: 'IPD-ICU-01', description: 'ICU Stay (per day)',                   unit: 3, unitPrice: 1200, amount: 3600, discount:   0, netAmount: 3600 },
  { id: 'li-c07', department: 'Cardiothoracic', category: 'IPD_WARD',               code: 'IPD-HDU-01', description: 'High Dependency Unit (per day)',        unit: 2, unitPrice:  800, amount: 1600, discount:   0, netAmount: 1600 },
  { id: 'li-c08', department: 'Pharmacy',       category: 'PHARMACY',               code: 'PHA-MED-01', description: 'Medications & IV Fluids',               unit: 1, unitPrice: 1200, amount: 1200, discount:   0, netAmount: 1200 },
  { id: 'li-c09', department: 'Pharmacy',       category: 'PHARMACY',               code: 'PHA-BLD-01', description: 'Blood Products & Transfusion',          unit: 2, unitPrice:  500, amount: 1000, discount:   0, netAmount: 1000 },
]

const KNEE_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-k01', department: 'Orthopaedics',  category: 'SURGICAL_STAFF',        code: 'SRG-ORT-01', description: 'Orthopaedic Surgeon Fee (TKR)',       unit: 1, unitPrice: 5000, amount: 5000, discount:   0, netAmount: 5000 },
  { id: 'li-k02', department: 'Anaesthesia',   category: 'ANAESTHESIA',            code: 'ANA-SPI-01', description: 'Spinal Anaesthesia',                  unit: 1, unitPrice: 1200, amount: 1200, discount:   0, netAmount: 1200 },
  { id: 'li-k03', department: 'Orthopaedics',  category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-TKR-01', description: 'Total Knee Prosthesis (cemented)',     unit: 1, unitPrice: 7000, amount: 7000, discount: 500, netAmount: 6500 },
  { id: 'li-k04', department: 'Theatre',       category: 'FACILITY_THEATRE',       code: 'FAC-THR-04', description: 'Theatre Usage (4 hours)',               unit: 4, unitPrice:  500, amount: 2000, discount:   0, netAmount: 2000 },
  { id: 'li-k05', department: 'Orthopaedics',  category: 'IPD_WARD',               code: 'IPD-WAR-01', description: 'Ward Stay (per day)',                   unit: 5, unitPrice:  400, amount: 2000, discount:   0, netAmount: 2000 },
  { id: 'li-k06', department: 'Pharmacy',      category: 'PHARMACY',               code: 'PHA-POO-01', description: 'Post-Op Medications & Dressings',       unit: 1, unitPrice:  800, amount:  800, discount:   0, netAmount:  800 },
  { id: 'li-k07', department: 'Physiotherapy', category: 'OTHER',                  code: 'OTH-PHY-01', description: 'Physiotherapy (4 sessions)',             unit: 4, unitPrice:  150, amount:  600, discount:   0, netAmount:  600 },
]

const APPENDIX_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-a01', department: 'General Surgery', category: 'SURGICAL_STAFF',        code: 'SRG-GEN-01', description: 'General Surgeon Fee (laparoscopic)',   unit: 1, unitPrice: 2500, amount: 2500, discount: 0, netAmount: 2500 },
  { id: 'li-a02', department: 'Anaesthesia',     category: 'ANAESTHESIA',            code: 'ANA-GEN-02', description: 'General Anaesthesia',                  unit: 1, unitPrice: 1000, amount: 1000, discount: 0, netAmount: 1000 },
  { id: 'li-a03', department: 'General Surgery', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-LAP-01', description: 'Laparoscopic Instrument Set',            unit: 1, unitPrice: 1200, amount: 1200, discount: 0, netAmount: 1200 },
  { id: 'li-a04', department: 'Theatre',         category: 'FACILITY_THEATRE',       code: 'FAC-THR-02', description: 'Theatre Usage (2 hours)',                unit: 2, unitPrice:  450, amount:  900, discount: 0, netAmount:  900 },
  { id: 'li-a05', department: 'General Surgery', category: 'IPD_WARD',               code: 'IPD-WAR-02', description: 'Ward Stay (per day)',                    unit: 2, unitPrice:  350, amount:  700, discount: 0, netAmount:  700 },
  { id: 'li-a06', department: 'Pharmacy',        category: 'PHARMACY',               code: 'PHA-ANT-01', description: 'Antibiotics & Pain Management',          unit: 1, unitPrice:  400, amount:  400, discount: 0, netAmount:  400 },
]

const HIP_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-h01', department: 'Orthopaedics', category: 'SURGICAL_STAFF',        code: 'SRG-ORT-02', description: 'Orthopaedic Surgeon Fee (THR)',         unit: 1, unitPrice: 6000, amount: 6000, discount:   0, netAmount: 6000 },
  { id: 'li-h02', department: 'Anaesthesia',  category: 'ANAESTHESIA',            code: 'ANA-SPE-01', description: 'Spinal/Epidural Anaesthesia',            unit: 1, unitPrice: 1400, amount: 1400, discount:   0, netAmount: 1400 },
  { id: 'li-h03', department: 'Orthopaedics', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-THR-01', description: 'Total Hip Prosthesis (cementless)',       unit: 1, unitPrice: 8000, amount: 8000, discount: 500, netAmount: 7500 },
  { id: 'li-h04', department: 'Theatre',      category: 'FACILITY_THEATRE',       code: 'FAC-THR-05', description: 'Theatre Usage (5 hours)',                 unit: 5, unitPrice:  500, amount: 2500, discount:   0, netAmount: 2500 },
  { id: 'li-h05', department: 'Orthopaedics', category: 'IPD_WARD',               code: 'IPD-WAR-03', description: 'Ward Stay (per day)',                     unit: 6, unitPrice:  400, amount: 2400, discount:   0, netAmount: 2400 },
  { id: 'li-h06', department: 'Pharmacy',     category: 'PHARMACY',               code: 'PHA-POO-02', description: 'Post-Op Meds & DVT Prophylaxis',           unit: 1, unitPrice:  700, amount:  700, discount:   0, netAmount:  700 },
]

const GALLBLADDER_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-g01', department: 'General Surgery', category: 'SURGICAL_STAFF',        code: 'SRG-GEN-02', description: 'General Surgeon Fee (cholecystectomy)', unit: 1, unitPrice: 2500, amount: 2500, discount: 0, netAmount: 2500 },
  { id: 'li-g02', department: 'Anaesthesia',     category: 'ANAESTHESIA',            code: 'ANA-GEN-03', description: 'General Anaesthesia',                   unit: 1, unitPrice: 1000, amount: 1000, discount: 0, netAmount: 1000 },
  { id: 'li-g03', department: 'General Surgery', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-LAP-02', description: 'Laparoscopic Cholecystectomy Kit',        unit: 1, unitPrice:  900, amount:  900, discount: 0, netAmount:  900 },
  { id: 'li-g04', department: 'Theatre',         category: 'FACILITY_THEATRE',       code: 'FAC-THR-02', description: 'Theatre Usage (2 hours)',                 unit: 2, unitPrice:  450, amount:  900, discount: 0, netAmount:  900 },
  { id: 'li-g05', department: 'General Surgery', category: 'IPD_WARD',               code: 'IPD-WAR-04', description: 'Ward Stay (per day)',                     unit: 2, unitPrice:  350, amount:  700, discount: 0, netAmount:  700 },
  { id: 'li-g06', department: 'Pharmacy',        category: 'PHARMACY',               code: 'PHA-ANT-02', description: 'Antibiotics & Pain Management',           unit: 1, unitPrice:  350, amount:  350, discount: 0, netAmount:  350 },
]

const HYST_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-y01', department: 'Gynaecology', category: 'SURGICAL_STAFF',        code: 'SRG-GYN-01', description: 'Gynaecologist Fee (hysterectomy)',       unit: 1, unitPrice: 4000, amount: 4000, discount:   0, netAmount: 4000 },
  { id: 'li-y02', department: 'Anaesthesia', category: 'ANAESTHESIA',            code: 'ANA-GEN-04', description: 'General Anaesthesia',                    unit: 1, unitPrice: 1200, amount: 1200, discount:   0, netAmount: 1200 },
  { id: 'li-y03', department: 'Gynaecology', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-LAP-03', description: 'Laparoscopic Hysterectomy Set',            unit: 1, unitPrice: 1500, amount: 1500, discount: 200, netAmount: 1300 },
  { id: 'li-y04', department: 'Theatre',     category: 'FACILITY_THEATRE',       code: 'FAC-THR-03', description: 'Theatre Usage (3 hours)',                  unit: 3, unitPrice:  500, amount: 1500, discount:   0, netAmount: 1500 },
  { id: 'li-y05', department: 'Gynaecology', category: 'IPD_WARD',               code: 'IPD-WAR-05', description: 'Ward Stay (per day)',                      unit: 3, unitPrice:  380, amount: 1140, discount:   0, netAmount: 1140 },
  { id: 'li-y06', department: 'Pharmacy',    category: 'PHARMACY',               code: 'PHA-MED-02', description: 'Medications & Hormone Therapy',             unit: 1, unitPrice:  600, amount:  600, discount:   0, netAmount:  600 },
]

const CATARACT_LINE_ITEMS: CostLineItem[] = [
  { id: 'li-e01', department: 'Ophthalmology', category: 'SURGICAL_STAFF',        code: 'SRG-OPH-01', description: 'Ophthalmologist Fee (phaco)',             unit: 1, unitPrice: 1500, amount: 1500, discount:   0, netAmount: 1500 },
  { id: 'li-e02', department: 'Anaesthesia',   category: 'ANAESTHESIA',            code: 'ANA-LOC-01', description: 'Local Anaesthesia (topical)',              unit: 1, unitPrice:  200, amount:  200, discount:   0, netAmount:  200 },
  { id: 'li-e03', department: 'Ophthalmology', category: 'EQUIPMENT_INSTRUMENTS', code: 'EQP-IOL-01', description: 'Intraocular Lens Implant (monofocal)',      unit: 1, unitPrice: 1200, amount: 1200, discount: 100, netAmount: 1100 },
  { id: 'li-e04', department: 'Theatre',       category: 'FACILITY_THEATRE',       code: 'FAC-THR-01', description: 'Day Surgery Theatre (1 hour)',              unit: 1, unitPrice:  400, amount:  400, discount:   0, netAmount:  400 },
  { id: 'li-e05', department: 'Pharmacy',      category: 'PHARMACY',               code: 'PHA-EYE-01', description: 'Eye Drops & Post-Op Medications',           unit: 1, unitPrice:  150, amount:  150, discount:   0, netAmount:  150 },
]

// ── Patients ──────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS: MockPatient[] = [
  {
    id: 'patient-001', resourceType: 'Patient',
    name: [{ family: 'Sophea', given: ['Chan'], prefix: ['Ms'] }],
    gender: 'female', birthDate: '1985-06-15',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10045' }, { system: 'national-id', value: 'KH-198506-001' }],
    telecom: [{ system: 'phone', value: '+855 12 345 678' }, { system: 'email', value: 'chan.sophea@email.kh' }],
    address: [{ city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-002', resourceType: 'Patient',
    name: [{ family: 'Pich', given: ['Kosal'], prefix: ['Mr'] }],
    gender: 'male', birthDate: '1972-03-22',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10046' }, { system: 'national-id', value: 'KH-197203-002' }],
    telecom: [{ system: 'phone', value: '+855 12 456 789' }, { system: 'email', value: 'kosal.pich@email.kh' }],
    address: [{ city: 'Siem Reap', country: 'KH' }],
  },
  {
    id: 'patient-003', resourceType: 'Patient',
    name: [{ family: 'Mao', given: ['Sreyleak'], prefix: ['Ms'] }],
    gender: 'female', birthDate: '1990-11-08',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10047' }, { system: 'national-id', value: 'KH-199011-003' }],
    telecom: [{ system: 'phone', value: '+855 12 567 890' }, { system: 'email', value: 'sreyleak.mao@email.kh' }],
    address: [{ city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-004', resourceType: 'Patient',
    name: [{ family: 'Chea', given: ['Bunna'], prefix: ['Mr'] }],
    gender: 'male', birthDate: '1955-07-14',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10048' }, { system: 'national-id', value: 'KH-195507-004' }],
    telecom: [{ system: 'phone', value: '+855 12 678 901' }, { system: 'email', value: 'bunna.chea@email.kh' }],
    address: [{ city: 'Battambang', country: 'KH' }],
  },
  {
    id: 'patient-005', resourceType: 'Patient',
    name: [{ family: 'Keo', given: ['Dara'], prefix: ['Mr'] }],
    gender: 'male', birthDate: '1968-02-28',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10049' }, { system: 'national-id', value: 'KH-196802-005' }],
    telecom: [{ system: 'phone', value: '+855 12 789 012' }, { system: 'email', value: 'dara.keo@email.kh' }],
    address: [{ city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-006', resourceType: 'Patient',
    name: [{ family: 'Seng', given: ['Maly'], prefix: ['Ms'] }],
    gender: 'female', birthDate: '1995-09-03',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10050' }, { system: 'national-id', value: 'KH-199509-006' }],
    telecom: [{ system: 'phone', value: '+855 12 890 123' }, { system: 'email', value: 'maly.seng@email.kh' }],
    address: [{ city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-007', resourceType: 'Patient',
    name: [{ family: 'Noun', given: ['Virak'], prefix: ['Mr'] }],
    gender: 'male', birthDate: '1980-01-19',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10051' }, { system: 'national-id', value: 'KH-198001-007' }],
    telecom: [{ system: 'phone', value: '+855 12 901 234' }, { system: 'email', value: 'virak.noun@email.kh' }],
    address: [{ city: 'Kampong Cham', country: 'KH' }],
  },
  {
    id: 'patient-008', resourceType: 'Patient',
    name: [{ family: 'Chhun', given: ['Sothea'], prefix: ['Ms'] }],
    gender: 'female', birthDate: '2001-04-25',
    identifier: [{ system: 'hospital.local/id', value: 'IC-10052' }, { system: 'national-id', value: 'KH-200104-008' }],
    telecom: [{ system: 'phone', value: '+855 12 012 345' }, { system: 'email', value: 'sothea.chhun@email.kh' }],
    address: [{ city: 'Phnom Penh', country: 'KH' }],
  },
]

// ── Encounters ────────────────────────────────────────────────────────────────

export const MOCK_ENCOUNTERS: MockEncounter[] = [
  {
    id: 'enc-001', resourceType: 'Encounter', status: 'in-progress',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-001' },
    participant: [{ individual: { reference: 'Practitioner/dr-sok', display: 'Dr. Sok Phearith' } }],
    reasonCode: [{ text: 'Coronary Artery Bypass Graft (CABG)', coding: [{ system: 'ICD-10', code: 'I25.10', display: 'Coronary Artery Disease' }] }],
    serviceProvider: { display: 'Cardiothoracic Ward — Intercare Hospital' },
    period: { start: '2026-04-08T08:00:00.000Z' },
  },
  {
    id: 'enc-002', resourceType: 'Encounter', status: 'finished',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-002' },
    participant: [{ individual: { reference: 'Practitioner/dr-chan', display: 'Dr. Chan Reaksmey' } }],
    reasonCode: [{ text: 'Total Knee Replacement (TKR)', coding: [{ system: 'ICD-10', code: 'M17.11', display: 'Primary Osteoarthritis, Right Knee' }] }],
    serviceProvider: { display: 'Orthopaedics Ward — Intercare Hospital' },
    period: { start: '2026-03-01T08:00:00.000Z', end: '2026-03-08T10:00:00.000Z' },
  },
  {
    id: 'enc-003', resourceType: 'Encounter', status: 'in-progress',
    class: { code: 'EMER', display: 'Emergency' },
    subject: { reference: 'Patient/patient-003' },
    participant: [{ individual: { reference: 'Practitioner/dr-roeun', display: 'Dr. Roeun Chanveasna' } }],
    reasonCode: [{ text: 'Acute Appendicitis — Emergency Appendectomy', coding: [{ system: 'ICD-10', code: 'K35.89', display: 'Acute Appendicitis with Complications' }] }],
    serviceProvider: { display: 'General Surgery Ward — Intercare Hospital' },
    period: { start: '2026-04-08T10:00:00.000Z' },
  },
  {
    id: 'enc-004', resourceType: 'Encounter', status: 'planned',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-004' },
    participant: [{ individual: { reference: 'Practitioner/dr-lim', display: 'Dr. Lim Pagna' } }],
    reasonCode: [{ text: 'Right Femoral Neck Fracture — Total Hip Replacement', coding: [{ system: 'ICD-10', code: 'S72.001', display: 'Fracture of Neck of Right Femur' }] }],
    serviceProvider: { display: 'Orthopaedics Ward — Intercare Hospital' },
    period: { start: '2026-04-15T08:00:00.000Z' },
  },
  {
    id: 'enc-005', resourceType: 'Encounter', status: 'finished',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-005' },
    participant: [{ individual: { reference: 'Practitioner/dr-sok', display: 'Dr. Sok Phearith' } }],
    reasonCode: [{ text: 'Acute Cholecystitis — Laparoscopic Cholecystectomy', coding: [{ system: 'ICD-10', code: 'K81.0', display: 'Acute Cholecystitis' }] }],
    serviceProvider: { display: 'General Surgery Ward — Intercare Hospital' },
    period: { start: '2026-03-10T08:00:00.000Z', end: '2026-03-14T12:00:00.000Z' },
  },
  {
    id: 'enc-006', resourceType: 'Encounter', status: 'in-progress',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-006' },
    participant: [{ individual: { reference: 'Practitioner/dr-chan', display: 'Dr. Chan Reaksmey' } }],
    reasonCode: [{ text: 'Uterine Fibroids — Laparoscopic Hysterectomy', coding: [{ system: 'ICD-10', code: 'D25.9', display: 'Leiomyoma of Uterus' }] }],
    serviceProvider: { display: 'Gynaecology Ward — Intercare Hospital' },
    period: { start: '2026-04-09T08:00:00.000Z' },
  },
  {
    id: 'enc-007', resourceType: 'Encounter', status: 'finished',
    class: { code: 'AMB', display: 'Day Surgery' },
    subject: { reference: 'Patient/patient-007' },
    participant: [{ individual: { reference: 'Practitioner/dr-roeun', display: 'Dr. Roeun Chanveasna' } }],
    reasonCode: [{ text: 'Bilateral Cataract — Phacoemulsification with IOL', coding: [{ system: 'ICD-10', code: 'H26.9', display: 'Unspecified Cataract' }] }],
    serviceProvider: { display: 'Ophthalmology Clinic — Intercare Hospital' },
    period: { start: '2026-01-20T09:00:00.000Z', end: '2026-01-20T14:00:00.000Z' },
  },
  {
    id: 'enc-008', resourceType: 'Encounter', status: 'in-progress',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-008' },
    participant: [{ individual: { reference: 'Practitioner/dr-sok', display: 'Dr. Sok Phearith' } }],
    reasonCode: [{ text: 'Acute Appendicitis — Emergency Appendectomy', coding: [{ system: 'ICD-10', code: 'K35.89', display: 'Acute Appendicitis with Complications' }] }],
    serviceProvider: { display: 'General Surgery Ward — Intercare Hospital' },
    period: { start: '2026-04-09T20:00:00.000Z' },
  },
]

// ── Coverages ─────────────────────────────────────────────────────────────────

export const MOCK_COVERAGES: MockCoverage[] = [
  { id: 'cov-001', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-001' }, insurer: 'APRIL',    planName: 'APRIL Premium Health',     policyNumber: 'APR-2025-045601', membershipId: 'APR-MBR-001456', coPayPercent: 10, employer: 'TotalEnergies Cambodia',       period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-002', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-002' }, insurer: 'HSC',      planName: 'HSC Standard Plus',         policyNumber: 'HSC-2025-012345', membershipId: 'HSC-MBR-002789', coPayPercent: 15, employer: 'Angkor Beer Ltd.',              period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-003', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-003' }, insurer: 'LUMA',     planName: 'LUMA Gold Plus',            policyNumber: 'LUMA-2025-078902',membershipId: 'LUMA-MBR-003001',coPayPercent:  5, employer: 'ACLEDA Bank Plc.',              period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-004', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-004' }, insurer: 'AIA',      planName: 'AIA Elite Health Cover',    policyNumber: 'AIA-2025-234501', membershipId: 'AIA-MBR-004112', coPayPercent: 10, employer: 'Phnom Penh Water Supply',       period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-005', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-005' }, insurer: 'APRIL',    planName: 'APRIL Standard Plus',       policyNumber: 'APR-2025-098723', membershipId: 'APR-MBR-005233', coPayPercent: 15, employer: 'CamGSM (Metfone)',              period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-006', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-006' }, insurer: 'HSC',      planName: 'HSC Premium Plus',          policyNumber: 'HSC-2025-056789', membershipId: 'HSC-MBR-006445', coPayPercent: 10, employer: 'Smart Axiata Co., Ltd.',        period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-007', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-007' }, insurer: 'ASSURNET', planName: 'ASSURNET Basic',            policyNumber: 'ASN-2025-123456', membershipId: 'ASN-MBR-007890', coPayPercent: 20, employer: 'Royal Cambodian Railways',      period: { start: '2025-01-01', end: '2026-12-31' } },
  { id: 'cov-008', resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-008' }, insurer: 'LUMA',     planName: 'LUMA Silver',               policyNumber: 'LUMA-2025-345678',membershipId: 'LUMA-MBR-008901',coPayPercent: 15, employer: 'Phnom Penh Post Ltd.',          period: { start: '2025-01-01', end: '2026-12-31' } },
]

// ── Prefill Responses ─────────────────────────────────────────────────────────

export const MOCK_PREFILL_RESPONSE: Record<string, PrefillEntry[]> = {
  'gop-001': [
    { linkId: 'primary-diagnosis',     answer: 'I25.10',                                         aiPrefilled: true,  humanVerified: false },
    { linkId: 'diagnosis-description', answer: 'Coronary Artery Disease requiring CABG',         aiPrefilled: true,  humanVerified: false },
    { linkId: 'planned-procedure',     answer: 'Coronary Artery Bypass Graft (4-vessel)',         aiPrefilled: true,  humanVerified: false },
    { linkId: 'admission-type',        answer: 'Elective',                                        aiPrefilled: true,  humanVerified: false },
    { linkId: 'length-of-stay',        answer: '7',                                               aiPrefilled: true,  humanVerified: false },
    { linkId: 'clinical-notes',        answer: 'Multi-vessel CAD with 3 prior NSTEMI events. Pre-op workup complete.', aiPrefilled: true, humanVerified: false },
  ],
  'gop-002': [
    { linkId: 'primary-diagnosis',     answer: 'M17.11',                                         aiPrefilled: true,  humanVerified: true },
    { linkId: 'diagnosis-description', answer: 'Primary Osteoarthritis, Right Knee',              aiPrefilled: true,  humanVerified: true },
    { linkId: 'planned-procedure',     answer: 'Total Knee Replacement (right)',                  aiPrefilled: true,  humanVerified: true },
    { linkId: 'admission-type',        answer: 'Elective',                                        aiPrefilled: true,  humanVerified: true },
    { linkId: 'length-of-stay',        answer: '5',                                               aiPrefilled: true,  humanVerified: true },
    { linkId: 'clinical-notes',        answer: 'Severe osteoarthritis. Failed conservative management. Bone-on-bone radiological changes.', aiPrefilled: true, humanVerified: true },
  ],
  'gop-003': [
    { linkId: 'primary-diagnosis',     answer: 'K35.89',                                         aiPrefilled: true,  humanVerified: false },
    { linkId: 'diagnosis-description', answer: 'Acute Appendicitis with Peritonitis',             aiPrefilled: true,  humanVerified: false },
    { linkId: 'planned-procedure',     answer: 'Emergency Laparoscopic Appendectomy',             aiPrefilled: true,  humanVerified: false },
    { linkId: 'admission-type',        answer: 'Emergency',                                       aiPrefilled: false, humanVerified: true  },
    { linkId: 'length-of-stay',        answer: '3',                                               aiPrefilled: true,  humanVerified: false },
    { linkId: 'clinical-notes',        answer: 'EMERGENCY. Acute RIF pain, fever 38.9°C, elevated WBC. CT confirms appendicitis with impending perforation.', aiPrefilled: true, humanVerified: false },
  ],
  'gop-004': [
    { linkId: 'primary-diagnosis',     answer: 'S72.001',                                        aiPrefilled: true,  humanVerified: true },
    { linkId: 'diagnosis-description', answer: 'Fracture of Neck of Right Femur',                aiPrefilled: true,  humanVerified: true },
    { linkId: 'planned-procedure',     answer: 'Total Hip Replacement (right)',                   aiPrefilled: true,  humanVerified: true },
    { linkId: 'admission-type',        answer: 'Urgent',                                          aiPrefilled: true,  humanVerified: true },
    { linkId: 'length-of-stay',        answer: '7',                                               aiPrefilled: true,  humanVerified: true },
    { linkId: 'clinical-notes',        answer: 'Displaced femoral neck fracture following fall. Garden Type III.', aiPrefilled: true, humanVerified: true },
  ],
  'gop-005': [
    { linkId: 'primary-diagnosis',     answer: 'K81.0',                                          aiPrefilled: true,  humanVerified: true },
    { linkId: 'diagnosis-description', answer: 'Acute Cholecystitis',                             aiPrefilled: true,  humanVerified: true },
    { linkId: 'planned-procedure',     answer: 'Laparoscopic Cholecystectomy',                    aiPrefilled: true,  humanVerified: true },
    { linkId: 'admission-type',        answer: 'Urgent',                                          aiPrefilled: true,  humanVerified: true },
    { linkId: 'length-of-stay',        answer: '2',                                               aiPrefilled: true,  humanVerified: true },
    { linkId: 'clinical-notes',        answer: 'Acute cholecystitis, multiple gallstones. Murphy sign positive. CRP 180.', aiPrefilled: true, humanVerified: true },
  ],
  'gop-005-appeal': [
    { linkId: 'primary-diagnosis',     answer: 'K81.0',                                          aiPrefilled: true,  humanVerified: false },
    { linkId: 'diagnosis-description', answer: 'Acute Cholecystitis (appeal — new evidence)',     aiPrefilled: false, humanVerified: true  },
    { linkId: 'planned-procedure',     answer: 'Laparoscopic Cholecystectomy',                    aiPrefilled: true,  humanVerified: false },
    { linkId: 'admission-type',        answer: 'Urgent',                                          aiPrefilled: true,  humanVerified: false },
    { linkId: 'length-of-stay',        answer: '2',                                               aiPrefilled: true,  humanVerified: false },
    { linkId: 'clinical-notes',        answer: 'APPEAL: Acute onset confirmed. Pre-existing gallstones are incidental. New specialist report attached.', aiPrefilled: false, humanVerified: true },
  ],
}

// ── Cost Estimates ────────────────────────────────────────────────────────────

export const MOCK_COST_ESTIMATES: MockCostEstimate[] = [
  { encounterId: 'enc-001', total: 28700, lineItems: CARDIAC_LINE_ITEMS },
  { encounterId: 'enc-002', total: 18100, lineItems: KNEE_LINE_ITEMS },
  { encounterId: 'enc-003', total:  6700, lineItems: APPENDIX_LINE_ITEMS },
  { encounterId: 'enc-004', total: 20500, lineItems: HIP_LINE_ITEMS },
  { encounterId: 'enc-005', total:  6350, lineItems: GALLBLADDER_LINE_ITEMS },
  { encounterId: 'enc-006', total:  9740, lineItems: HYST_LINE_ITEMS },
  { encounterId: 'enc-007', total:  3350, lineItems: CATARACT_LINE_ITEMS },
  { encounterId: 'enc-008', total:  6700, lineItems: APPENDIX_LINE_ITEMS },
]

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
  return MOCK_PATIENTS.find(p => p.id === id)
}

export function getCoverageByPatientId(patientId: string): MockCoverage | undefined {
  return MOCK_COVERAGES.find(c => c.beneficiary.reference === `Patient/${patientId}`)
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
