// Mock data for GOP Automation System — Phase 1
// All data follows HL7 FHIR R4 resource shapes

export type GOPStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type UserRole = 'INSURANCE_STAFF' | 'DOCTOR' | 'ADMIN'
export type InsurerCode = 'APRIL' | 'HSC' | 'LUMA' | 'AIA' | 'ASSURNET'

// ─── Patients ───────────────────────────────────────────────────────────────

export interface MockPatient {
  id: string
  resourceType: 'Patient'
  name: Array<{ family: string; given: string[] }>
  birthDate: string
  gender: 'male' | 'female'
  identifier: Array<{ system: string; value: string }>
  telecom: Array<{ system: string; value: string }>
  address?: Array<{ line: string[]; city: string; country: string }>
}

export const MOCK_PATIENTS: MockPatient[] = [
  {
    id: 'patient-001',
    resourceType: 'Patient',
    name: [{ family: 'Chan', given: ['Sophea'] }],
    birthDate: '1985-03-12',
    gender: 'female',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-001' },
      { system: 'national-id', value: 'KH-102938475' },
    ],
    telecom: [
      { system: 'phone', value: '+855 12 345 678' },
      { system: 'email', value: 'sophea.chan@email.com' },
    ],
    address: [{ line: ['House 12, St. 271'], city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-002',
    resourceType: 'Patient',
    name: [{ family: 'Kim', given: ['Dara', 'Rith'] }],
    birthDate: '1972-07-25',
    gender: 'male',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-002' },
      { system: 'national-id', value: 'KH-203847561' },
    ],
    telecom: [
      { system: 'phone', value: '+855 17 890 123' },
      { system: 'email', value: 'dara.kim@email.com' },
    ],
    address: [{ line: ['Apt 5B, Boeung Keng Kang'], city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-003',
    resourceType: 'Patient',
    name: [{ family: 'Pou', given: ['Sreymom'] }],
    birthDate: '1990-11-08',
    gender: 'female',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-003' },
      { system: 'national-id', value: 'KH-309182736' },
    ],
    telecom: [
      { system: 'phone', value: '+855 96 555 789' },
    ],
    address: [{ line: ['Village 3, Sangkat Tonle Bassac'], city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-004',
    resourceType: 'Patient',
    name: [{ family: 'Heng', given: ['Visal'] }],
    birthDate: '1968-04-30',
    gender: 'male',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-004' },
      { system: 'national-id', value: 'KH-410293847' },
    ],
    telecom: [
      { system: 'phone', value: '+855 11 222 333' },
      { system: 'email', value: 'visal.heng@business.com' },
    ],
    address: [{ line: ['No 88, Preah Norodom Blvd'], city: 'Phnom Penh', country: 'KH' }],
  },
  {
    id: 'patient-005',
    resourceType: 'Patient',
    name: [{ family: 'Lim', given: ['Bopha'] }],
    birthDate: '2001-09-14',
    gender: 'female',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-005' },
      { system: 'national-id', value: 'KH-512837465' },
    ],
    telecom: [
      { system: 'phone', value: '+855 78 901 234' },
    ],
  },
  {
    id: 'patient-006',
    resourceType: 'Patient',
    name: [{ family: 'Nhem', given: ['Sokha'] }],
    birthDate: '1955-12-01',
    gender: 'male',
    identifier: [
      { system: 'hospital.local/id', value: 'IC-2024-006' },
      { system: 'national-id', value: 'KH-601928374' },
    ],
    telecom: [
      { system: 'phone', value: '+855 12 777 888' },
      { system: 'email', value: 'sokha.nhem@retire.com' },
    ],
  },
]

// ─── Encounters ──────────────────────────────────────────────────────────────

export interface MockEncounter {
  id: string
  resourceType: 'Encounter'
  status: 'in-progress' | 'finished' | 'planned'
  class: { code: 'IMP' | 'AMB'; display: string }
  subject: { reference: string }
  period: { start: string; end?: string }
  serviceProvider: { display: string }
  participant: Array<{ individual: { reference: string; display: string } }>
  reasonCode?: Array<{ text: string }>
}

export const MOCK_ENCOUNTERS: MockEncounter[] = [
  {
    id: 'enc-001',
    resourceType: 'Encounter',
    status: 'in-progress',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-001' },
    period: { start: '2026-04-03T08:00:00' },
    serviceProvider: { display: 'Internal Medicine — Ward 3B' },
    participant: [{ individual: { reference: 'Practitioner/doc-001', display: 'Dr. Sok Phearith' } }],
    reasonCode: [{ text: 'Acute appendicitis with abscess' }],
  },
  {
    id: 'enc-002',
    resourceType: 'Encounter',
    status: 'in-progress',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-002' },
    period: { start: '2026-04-01T14:30:00' },
    serviceProvider: { display: 'Cardiology — ICU' },
    participant: [{ individual: { reference: 'Practitioner/doc-002', display: 'Dr. Chan Reaksmey' } }],
    reasonCode: [{ text: 'Acute myocardial infarction, STEMI' }],
  },
  {
    id: 'enc-003',
    resourceType: 'Encounter',
    status: 'planned',
    class: { code: 'AMB', display: 'Outpatient' },
    subject: { reference: 'Patient/patient-003' },
    period: { start: '2026-04-07T09:00:00' },
    serviceProvider: { display: 'Orthopaedics OPD' },
    participant: [{ individual: { reference: 'Practitioner/doc-003', display: 'Dr. Roeun Chanveasna' } }],
    reasonCode: [{ text: 'Total knee arthroplasty — right knee' }],
  },
  {
    id: 'enc-004',
    resourceType: 'Encounter',
    status: 'finished',
    class: { code: 'IMP', display: 'Inpatient' },
    subject: { reference: 'Patient/patient-004' },
    period: { start: '2026-03-28T11:00:00', end: '2026-04-02T10:00:00' },
    serviceProvider: { display: 'General Surgery — Ward 2A' },
    participant: [{ individual: { reference: 'Practitioner/doc-001', display: 'Dr. Sok Phearith' } }],
    reasonCode: [{ text: 'Cholecystectomy — laparoscopic' }],
  },
]

// ─── Coverage (Insurance) ─────────────────────────────────────────────────────

export interface MockCoverage {
  id: string
  resourceType: 'Coverage'
  status: 'active' | 'cancelled' | 'entered-in-error'
  beneficiary: { reference: string }
  payor: Array<{ display: string; reference: string }>
  insurer: InsurerCode
  policyNumber: string
  membershipId: string
  coverageDates: { start: string; end: string }
  coPayPercent: number
  planName: string
}

export const MOCK_COVERAGES: MockCoverage[] = [
  {
    id: 'cov-001',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-001' },
    payor: [{ display: 'APRIL International', reference: 'Organization/april' }],
    insurer: 'APRIL',
    policyNumber: 'APRIL-2024-KH-88821',
    membershipId: 'APR-KH-100012',
    coverageDates: { start: '2026-01-01', end: '2026-12-31' },
    coPayPercent: 20,
    planName: 'APRIL Exec Care Gold',
  },
  {
    id: 'cov-002',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-002' },
    payor: [{ display: 'HSC Medical', reference: 'Organization/hsc' }],
    insurer: 'HSC',
    policyNumber: 'HSC-PP-2025-00345',
    membershipId: 'HSC-00345-M',
    coverageDates: { start: '2025-07-01', end: '2026-06-30' },
    coPayPercent: 10,
    planName: 'HSC Corporate Comprehensive',
  },
  {
    id: 'cov-003',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-003' },
    payor: [{ display: 'LUMA Health', reference: 'Organization/luma' }],
    insurer: 'LUMA',
    policyNumber: 'LUMA-KH-78901',
    membershipId: 'LUM-78901-F',
    coverageDates: { start: '2026-01-01', end: '2026-12-31' },
    coPayPercent: 15,
    planName: 'LUMA Premium Plus',
  },
  {
    id: 'cov-004',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-004' },
    payor: [{ display: 'APRIL International', reference: 'Organization/april' }],
    insurer: 'APRIL',
    policyNumber: 'APRIL-2024-KH-55102',
    membershipId: 'APR-KH-200088',
    coverageDates: { start: '2026-01-01', end: '2026-12-31' },
    coPayPercent: 0,
    planName: 'APRIL Elite VIP',
  },
  {
    id: 'cov-005',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-005' },
    payor: [{ display: 'AIA Cambodia', reference: 'Organization/aia' }],
    insurer: 'AIA',
    policyNumber: 'AIA-KH-2025-30192',
    membershipId: 'AIA-KH-30192',
    coverageDates: { start: '2026-01-01', end: '2026-12-31' },
    coPayPercent: 15,
    planName: 'AIA HealthShield Gold',
  },
  {
    id: 'cov-006',
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: 'Patient/patient-006' },
    payor: [{ display: 'Assurnet International', reference: 'Organization/assurnet' }],
    insurer: 'ASSURNET',
    policyNumber: 'ASN-2025-KH-00871',
    membershipId: 'ASN-00871-M',
    coverageDates: { start: '2025-09-01', end: '2026-08-31' },
    coPayPercent: 20,
    planName: 'Assurnet Comprehensive Care',
  },
]

// ─── Cost Estimates (FHIR Claim) ──────────────────────────────────────────────

export interface MockCostEstimate {
  id: string
  encounterId: string
  total: number
  currency: 'USD'
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    code?: string
  }>
  coPayAmount: number
  estimatedAt: string
}

export const MOCK_COST_ESTIMATES: MockCostEstimate[] = [
  {
    id: 'claim-001',
    encounterId: 'enc-001',
    total: 3200,
    currency: 'USD',
    items: [
      { description: 'Appendectomy — Laparoscopic', quantity: 1, unitPrice: 1800, total: 1800, code: '44950' },
      { description: 'General Anaesthesia', quantity: 1, unitPrice: 600, total: 600, code: '00840' },
      { description: 'ICU Room (2 nights)', quantity: 2, unitPrice: 250, total: 500, code: 'ICU-RM' },
      { description: 'Medications & Consumables', quantity: 1, unitPrice: 300, total: 300 },
    ],
    coPayAmount: 640,
    estimatedAt: '2026-04-03T10:30:00',
  },
  {
    id: 'claim-002',
    encounterId: 'enc-002',
    total: 8500,
    currency: 'USD',
    items: [
      { description: 'Coronary Angioplasty (PCI)', quantity: 1, unitPrice: 5500, total: 5500, code: '92941' },
      { description: 'Drug-Eluting Stent (x2)', quantity: 2, unitPrice: 800, total: 1600, code: 'DES-STENT' },
      { description: 'ICU (3 nights)', quantity: 3, unitPrice: 350, total: 1050, code: 'ICU-RM' },
      { description: 'Medications & Labs', quantity: 1, unitPrice: 350, total: 350 },
    ],
    coPayAmount: 850,
    estimatedAt: '2026-04-01T16:00:00',
  },
  {
    id: 'claim-003',
    encounterId: 'enc-003',
    total: 6800,
    currency: 'USD',
    items: [
      { description: 'Total Knee Arthroplasty', quantity: 1, unitPrice: 4500, total: 4500, code: '27447' },
      { description: 'Implant — Knee Prosthesis', quantity: 1, unitPrice: 1500, total: 1500, code: 'IMP-KNEE' },
      { description: 'Spinal Anaesthesia', quantity: 1, unitPrice: 400, total: 400, code: '00630' },
      { description: 'Ward Room (4 nights)', quantity: 4, unitPrice: 100, total: 400 },
    ],
    coPayAmount: 1020,
    estimatedAt: '2026-04-05T09:15:00',
  },
]

// ─── GOP Requests (Tasks) ─────────────────────────────────────────────────────

export type AuditAction =
  | 'REQUEST_CREATED'
  | 'SURGEON_VERIFIED'
  | 'ANAESTHETIST_VERIFIED'
  | 'STAFF_FINALISED'
  | 'SUBMITTED_TO_INSURER'
  | 'FIELD_CORRECTED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_EXPIRED'
  | 'DOCTOR_REASSIGNED'
  | 'VERIFICATION_RESET'

export interface AuditEntry {
  id: string
  action: AuditAction
  performedAt: string
  performedBy: string
  performedByRole: string
  detail?: string
}

export interface MockGOPRequest {
  id: string
  resourceType: 'Task'
  status: GOPStatus
  patientId: string
  patientName: string
  encounterId: string
  coverageId: string
  insurer: InsurerCode
  questionnaireId: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  expiresAt?: string
  resolvedAt?: string
  createdBy: string
  assignedDoctor: string
  doctorVerified: boolean
  surgeonVerified?: boolean
  anaesthetistVerified?: boolean
  staffFinalised: boolean
  hasAiPrefill: boolean
  notes?: string
  estimatedAmount: number
  approvedAmount?: number
  auditLog?: AuditEntry[]
}

export const MOCK_GOP_REQUESTS: MockGOPRequest[] = [
  {
    id: 'gop-001',
    resourceType: 'Task',
    status: 'SUBMITTED',
    patientId: 'patient-001',
    patientName: 'Sophea Chan',
    encounterId: 'enc-001',
    coverageId: 'cov-001',
    insurer: 'APRIL',
    questionnaireId: 'q-april-v1',
    createdAt: '2026-04-03T10:45:00',
    updatedAt: '2026-04-03T14:20:00',
    submittedAt: '2026-04-03T14:20:00',
    expiresAt: '2026-05-03T14:20:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Sok Phearith',
    doctorVerified: true,
    staffFinalised: true,
    hasAiPrefill: true,
    notes: 'Urgent case — patient admitted via ER. Pre-auth required before surgery.',
    estimatedAmount: 3200,
    auditLog: [
      { id: 'al-001-4', action: 'SUBMITTED_TO_INSURER', performedAt: '2026-04-03T14:20:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-001-3', action: 'STAFF_FINALISED',     performedAt: '2026-04-03T14:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-001-2', action: 'ANAESTHETIST_VERIFIED', performedAt: '2026-04-03T13:30:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-001-1', action: 'SURGEON_VERIFIED',    performedAt: '2026-04-03T12:00:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-001-0', action: 'REQUEST_CREATED',     performedAt: '2026-04-03T10:45:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
  {
    id: 'gop-002',
    resourceType: 'Task',
    status: 'APPROVED',
    patientId: 'patient-004',
    patientName: 'Visal Heng',
    encounterId: 'enc-004',
    coverageId: 'cov-004',
    insurer: 'APRIL',
    questionnaireId: 'q-april-v1',
    createdAt: '2026-03-28T12:00:00',
    updatedAt: '2026-03-29T09:30:00',
    submittedAt: '2026-03-28T16:00:00',
    expiresAt: '2026-04-27T16:00:00',
    resolvedAt: '2026-03-29T09:30:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Sok Phearith',
    doctorVerified: true,
    staffFinalised: true,
    hasAiPrefill: true,
    estimatedAmount: 4500,
    approvedAmount: 4500,
    auditLog: [
      { id: 'al-002-4', action: 'SUBMITTED_TO_INSURER', performedAt: '2026-03-28T16:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-002-3', action: 'STAFF_FINALISED',     performedAt: '2026-03-28T15:30:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-002-2', action: 'ANAESTHETIST_VERIFIED', performedAt: '2026-03-28T15:00:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-002-1', action: 'SURGEON_VERIFIED',    performedAt: '2026-03-28T14:00:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-002-0', action: 'REQUEST_CREATED',     performedAt: '2026-03-28T12:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
  {
    id: 'gop-003',
    resourceType: 'Task',
    status: 'DRAFT',
    patientId: 'patient-002',
    patientName: 'Dara Rith Kim',
    encounterId: 'enc-002',
    coverageId: 'cov-002',
    insurer: 'HSC',
    questionnaireId: 'q-hsc-v1',
    createdAt: '2026-04-01T17:00:00',
    updatedAt: '2026-04-01T17:00:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Chan Reaksmey',
    doctorVerified: false,
    staffFinalised: false,
    hasAiPrefill: true,
    notes: 'Awaiting physician section completion.',
    estimatedAmount: 8500,
    auditLog: [
      { id: 'al-003-0', action: 'REQUEST_CREATED', performedAt: '2026-04-01T17:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
  {
    id: 'gop-004',
    resourceType: 'Task',
    status: 'DRAFT',
    patientId: 'patient-003',
    patientName: 'Sreymom Pou',
    encounterId: 'enc-003',
    coverageId: 'cov-003',
    insurer: 'LUMA',
    questionnaireId: 'q-luma-v1',
    createdAt: '2026-04-05T10:00:00',
    updatedAt: '2026-04-05T10:00:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Roeun Chanveasna',
    doctorVerified: false,
    staffFinalised: false,
    hasAiPrefill: false,
    estimatedAmount: 6800,
    auditLog: [
      { id: 'al-004-0', action: 'REQUEST_CREATED', performedAt: '2026-04-05T10:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
  {
    id: 'gop-005',
    resourceType: 'Task',
    status: 'REJECTED',
    patientId: 'patient-005',
    patientName: 'Bopha Lim',
    encounterId: 'enc-001',
    coverageId: 'cov-001',
    insurer: 'APRIL',
    questionnaireId: 'q-april-v1',
    createdAt: '2026-03-20T09:00:00',
    updatedAt: '2026-03-22T11:00:00',
    submittedAt: '2026-03-20T15:00:00',
    expiresAt: '2026-04-19T15:00:00',
    resolvedAt: '2026-03-22T11:00:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Sok Phearith',
    doctorVerified: true,
    staffFinalised: true,
    hasAiPrefill: true,
    notes: 'Insurer rejected: pre-existing condition clause (Section 4.2). Appeal in progress.',
    estimatedAmount: 2800,
    auditLog: [
      { id: 'al-005-5', action: 'REQUEST_REJECTED',    performedAt: '2026-03-22T11:00:00', performedBy: 'Admin', performedByRole: 'ADMIN', detail: 'Insurer rejected: pre-existing condition clause (Section 4.2). Appeal in progress.' },
      { id: 'al-005-4', action: 'SUBMITTED_TO_INSURER', performedAt: '2026-03-20T15:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-005-3', action: 'STAFF_FINALISED',     performedAt: '2026-03-20T14:30:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-005-2', action: 'ANAESTHETIST_VERIFIED', performedAt: '2026-03-20T14:00:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-005-1', action: 'SURGEON_VERIFIED',    performedAt: '2026-03-20T13:00:00', performedBy: 'Dr. Sok Phearith', performedByRole: 'DOCTOR' },
      { id: 'al-005-0', action: 'REQUEST_CREATED',     performedAt: '2026-03-20T09:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
  {
    id: 'gop-006',
    resourceType: 'Task',
    status: 'EXPIRED',
    patientId: 'patient-006',
    patientName: 'Sokha Nhem',
    encounterId: 'enc-004',
    coverageId: 'cov-002',
    insurer: 'HSC',
    questionnaireId: 'q-hsc-v1',
    createdAt: '2026-03-01T08:00:00',
    updatedAt: '2026-03-15T00:00:00',
    submittedAt: '2026-03-01T14:00:00',
    expiresAt: '2026-03-31T14:00:00',
    resolvedAt: '2026-03-15T00:00:00',
    createdBy: 'Insurance Staff',
    assignedDoctor: 'Dr. Chan Reaksmey',
    doctorVerified: true,
    staffFinalised: true,
    hasAiPrefill: false,
    estimatedAmount: 3600,
    auditLog: [
      { id: 'al-006-3', action: 'REQUEST_EXPIRED',     performedAt: '2026-03-31T14:00:00', performedBy: 'system', performedByRole: 'SYSTEM', detail: 'Auto-expired after 30 days without insurer response' },
      { id: 'al-006-2', action: 'SUBMITTED_TO_INSURER', performedAt: '2026-03-01T14:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
      { id: 'al-006-1', action: 'SURGEON_VERIFIED',    performedAt: '2026-03-01T12:00:00', performedBy: 'Dr. Chan Reaksmey', performedByRole: 'DOCTOR' },
      { id: 'al-006-0', action: 'REQUEST_CREATED',     performedAt: '2026-03-01T08:00:00', performedBy: 'Insurance Staff', performedByRole: 'INSURANCE_STAFF' },
    ],
  },
]

// ─── Questionnaire Templates ──────────────────────────────────────────────────

export type QuestionnaireItemType = 'group' | 'string' | 'text' | 'boolean' | 'date' | 'decimal' | 'choice' | 'attachment'

export interface QuestionnaireItem {
  linkId: string
  text: string
  type: QuestionnaireItemType
  required?: boolean
  item?: QuestionnaireItem[]
  answerOption?: Array<{ valueString: string }>
  aiPrefilled?: boolean
  readOnly?: boolean
}

export interface MockQuestionnaire {
  id: string
  resourceType: 'Questionnaire'
  title: string
  insurer: InsurerCode
  version: string
  item: QuestionnaireItem[]
}

export const MOCK_QUESTIONNAIRES: MockQuestionnaire[] = [
  {
    id: 'q-april-v1',
    resourceType: 'Questionnaire',
    title: 'APRIL GOP Pre-Authorisation Form',
    insurer: 'APRIL',
    version: '2026-01',
    item: [
      {
        linkId: 'section-patient',
        text: 'Patient Information',
        type: 'group',
        item: [
          { linkId: 'patient-name', text: 'Full Name (as per ID)', type: 'string', required: true },
          { linkId: 'patient-dob', text: 'Date of Birth', type: 'date', required: true },
          { linkId: 'patient-gender', text: 'Gender', type: 'choice', required: true, answerOption: [{ valueString: 'Male' }, { valueString: 'Female' }] },
          { linkId: 'patient-national-id', text: 'National ID / Passport No.', type: 'string', required: true },
        ],
      },
      {
        linkId: 'section-policy',
        text: 'Policy & Coverage Details',
        type: 'group',
        item: [
          { linkId: 'policy-number', text: 'Policy Number', type: 'string', required: true },
          { linkId: 'membership-id', text: 'Membership ID', type: 'string', required: true },
          { linkId: 'plan-name', text: 'Plan Name', type: 'string' },
          { linkId: 'coverage-start', text: 'Coverage Start Date', type: 'date', required: true },
          { linkId: 'coverage-end', text: 'Coverage End Date', type: 'date', required: true },
        ],
      },
      {
        linkId: 'section-clinical',
        text: 'Clinical Information (Physician Section)',
        type: 'group',
        item: [
          { linkId: 'diagnosis-primary', text: 'Primary Diagnosis (ICD-10)', type: 'string', required: true, aiPrefilled: true },
          { linkId: 'diagnosis-secondary', text: 'Secondary Diagnosis (if any)', type: 'string', aiPrefilled: true },
          { linkId: 'planned-procedures', text: 'Planned Procedures / Treatments', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'admit-type', text: 'Admission Type', type: 'choice', required: true, answerOption: [{ valueString: 'Elective' }, { valueString: 'Emergency' }, { valueString: 'Day Surgery' }], aiPrefilled: true },
          { linkId: 'expected-los', text: 'Expected Length of Stay (days)', type: 'decimal', required: true, aiPrefilled: true },
          { linkId: 'clinical-notes', text: 'Clinical Notes / Justification', type: 'text', aiPrefilled: true },
        ],
      },
      {
        linkId: 'section-cost',
        text: 'Cost Estimate (from ANZER)',
        type: 'group',
        item: [
          { linkId: 'total-estimate', text: 'Total Estimated Cost (USD)', type: 'decimal', required: true, readOnly: true },
          { linkId: 'copay-amount', text: 'Patient Co-Pay Amount (USD)', type: 'decimal', readOnly: true },
          { linkId: 'cost-breakdown', text: 'Cost Breakdown Notes', type: 'text' },
        ],
      },
      {
        linkId: 'section-physician-sign',
        text: 'Physician Declaration',
        type: 'group',
        item: [
          { linkId: 'physician-name', text: 'Attending Physician Name', type: 'string', required: true, aiPrefilled: true },
          { linkId: 'physician-reg', text: 'Medical Registration No.', type: 'string', required: true },
          { linkId: 'physician-verified', text: 'I confirm the above clinical information is accurate', type: 'boolean', required: true },
        ],
      },
    ],
  },
  {
    id: 'q-hsc-v1',
    resourceType: 'Questionnaire',
    title: 'HSC Medical Pre-Authorisation Request',
    insurer: 'HSC',
    version: '2026-01',
    item: [
      {
        linkId: 'section-patient',
        text: 'Insured Member Details',
        type: 'group',
        item: [
          { linkId: 'patient-name', text: 'Member Name', type: 'string', required: true },
          { linkId: 'patient-dob', text: 'Date of Birth', type: 'date', required: true },
          { linkId: 'membership-id', text: 'HSC Membership No.', type: 'string', required: true },
          { linkId: 'employee-id', text: 'Employer / Group Code', type: 'string' },
        ],
      },
      {
        linkId: 'section-clinical',
        text: 'Medical Details',
        type: 'group',
        item: [
          { linkId: 'diagnosis', text: 'Diagnosis / Condition', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'procedure', text: 'Requested Procedure(s)', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'urgency', text: 'Clinical Urgency', type: 'choice', required: true, answerOption: [{ valueString: 'Routine' }, { valueString: 'Urgent' }, { valueString: 'Emergency' }], aiPrefilled: true },
          { linkId: 'hospital-name', text: 'Treating Hospital', type: 'string', required: true },
          { linkId: 'admission-date', text: 'Planned Admission Date', type: 'date', required: true },
        ],
      },
      {
        linkId: 'section-cost',
        text: 'Financial Details',
        type: 'group',
        item: [
          { linkId: 'total-cost', text: 'Total Estimated Cost (USD)', type: 'decimal', required: true, readOnly: true },
          { linkId: 'room-type', text: 'Room Type', type: 'choice', answerOption: [{ valueString: 'Standard' }, { valueString: 'Semi-Private' }, { valueString: 'Private' }] },
        ],
      },
    ],
  },
  {
    id: 'q-luma-v1',
    resourceType: 'Questionnaire',
    title: 'LUMA Health Pre-Authorisation Form',
    insurer: 'LUMA',
    version: '2026-01',
    item: [
      {
        linkId: 'section-member',
        text: 'Member Information',
        type: 'group',
        item: [
          { linkId: 'member-name', text: 'Full Name', type: 'string', required: true },
          { linkId: 'policy-no', text: 'LUMA Policy Number', type: 'string', required: true },
          { linkId: 'dob', text: 'Date of Birth', type: 'date', required: true },
        ],
      },
      {
        linkId: 'section-medical',
        text: 'Medical Necessity',
        type: 'group',
        item: [
          { linkId: 'diagnosis', text: 'Confirmed / Suspected Diagnosis', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'treatment-plan', text: 'Proposed Treatment / Surgery', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'icd-code', text: 'ICD-10 Code', type: 'string', aiPrefilled: true },
          { linkId: 'supporting-docs', text: 'Supporting Documents Attached', type: 'boolean' },
        ],
      },
      {
        linkId: 'section-financials',
        text: 'Cost Details',
        type: 'group',
        item: [
          { linkId: 'estimated-cost', text: 'Estimated Total (USD)', type: 'decimal', required: true, readOnly: true },
          { linkId: 'currency', text: 'Currency', type: 'string', readOnly: true },
        ],
      },
    ],
  },
  {
    id: 'q-aia-v1',
    resourceType: 'Questionnaire',
    title: 'AIA Insurance Pre-Authorisation Form',
    insurer: 'AIA',
    version: '2026-01',
    item: [
      {
        linkId: 'section-patient',
        text: 'Patient Information',
        type: 'group',
        item: [
          { linkId: 'fullName', text: 'Full Name (as per ID)', type: 'string', required: true, readOnly: true },
          { linkId: 'dateOfBirth', text: 'Date of Birth', type: 'date', required: true, readOnly: true },
          { linkId: 'gender', text: 'Gender', type: 'choice', required: true, readOnly: true, answerOption: [{ valueString: 'Male' }, { valueString: 'Female' }] },
          { linkId: 'nationalId', text: 'National ID / Passport No.', type: 'string', required: true, readOnly: true },
        ],
      },
      {
        linkId: 'section-policy',
        text: 'Policy and Coverage Details',
        type: 'group',
        item: [
          { linkId: 'policyNumber', text: 'Policy Number', type: 'string', required: true, readOnly: true },
          { linkId: 'membershipId', text: 'AIA Membership ID', type: 'string', required: true, readOnly: true },
          { linkId: 'planName', text: 'Plan Name', type: 'string', readOnly: true },
          { linkId: 'coverageFrom', text: 'Coverage Start Date', type: 'date', required: true, readOnly: true },
          { linkId: 'coverageTo', text: 'Coverage End Date', type: 'date', required: true, readOnly: true },
          { linkId: 'coPay', text: 'Co-Pay Percentage (%)', type: 'decimal', readOnly: true },
        ],
      },
      {
        linkId: 'section-clinical',
        text: 'Clinical Information',
        type: 'group',
        item: [
          { linkId: 'primaryDiagnosis', text: 'Primary Diagnosis (ICD-10 code + description)', type: 'string', required: true, aiPrefilled: true },
          { linkId: 'secondaryDiagnosis', text: 'Secondary Diagnosis (if any)', type: 'string', aiPrefilled: true },
          { linkId: 'plannedProcedures', text: 'Planned Procedures / Treatments', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'admissionType', text: 'Admission Type', type: 'choice', required: true, aiPrefilled: true, answerOption: [{ valueString: 'Elective' }, { valueString: 'Emergency' }, { valueString: 'Day Surgery' }] },
          { linkId: 'expectedLengthOfStay', text: 'Expected Length of Stay (days)', type: 'decimal', required: true, aiPrefilled: true },
          { linkId: 'clinicalNotes', text: 'Clinical Notes / Medical Justification', type: 'text', aiPrefilled: true },
        ],
      },
      {
        linkId: 'section-cost',
        text: 'Cost Estimate (from ANZER)',
        type: 'group',
        item: [
          { linkId: 'totalEstimatedCost', text: 'Total Estimated Cost (USD)', type: 'decimal', required: true, readOnly: true },
          { linkId: 'coPayAmount', text: 'Patient Co-Pay Amount (USD)', type: 'decimal', readOnly: true },
        ],
      },
      {
        linkId: 'section-physician',
        text: 'Physician Declaration',
        type: 'group',
        item: [
          { linkId: 'surgeonName', text: 'Surgeon Name', type: 'string', required: true },
          { linkId: 'surgeonRegNo', text: 'Surgeon Registration No.', type: 'string', required: true },
          { linkId: 'anaesthetistName', text: 'Anaesthetist Name', type: 'string', required: true },
          { linkId: 'anaesthetistRegNo', text: 'Anaesthetist Registration No.', type: 'string', required: true },
          { linkId: 'declarationConfirmed', text: 'I confirm the above clinical information is accurate and complete to the best of my knowledge', type: 'boolean', required: true },
        ],
      },
    ],
  },
  {
    id: 'q-assurnet-v1',
    resourceType: 'Questionnaire',
    title: 'Assurnet Pre-Authorisation Request Form',
    insurer: 'ASSURNET',
    version: '2026-01',
    item: [
      {
        linkId: 'section-patient',
        text: 'Patient Information',
        type: 'group',
        item: [
          { linkId: 'fullName', text: 'Full Name (as per identification)', type: 'string', required: true, readOnly: true },
          { linkId: 'dateOfBirth', text: 'Date of Birth', type: 'date', required: true, readOnly: true },
          { linkId: 'gender', text: 'Gender', type: 'choice', required: true, readOnly: true, answerOption: [{ valueString: 'Male' }, { valueString: 'Female' }] },
          { linkId: 'nationalId', text: 'National ID / Passport Number', type: 'string', required: true, readOnly: true },
        ],
      },
      {
        linkId: 'section-policy',
        text: 'Policy and Coverage Details',
        type: 'group',
        item: [
          { linkId: 'policyNumber', text: 'Assurnet Policy Number', type: 'string', required: true, readOnly: true },
          { linkId: 'membershipId', text: 'Member Certificate No.', type: 'string', required: true, readOnly: true },
          { linkId: 'planName', text: 'Scheme / Plan Name', type: 'string', readOnly: true },
          { linkId: 'coverageFrom', text: 'Policy Start Date', type: 'date', required: true, readOnly: true },
          { linkId: 'coverageTo', text: 'Policy End Date', type: 'date', required: true, readOnly: true },
          { linkId: 'coPay', text: 'Co-Insurance Percentage (%)', type: 'decimal', readOnly: true },
        ],
      },
      {
        linkId: 'section-clinical',
        text: 'Clinical Information',
        type: 'group',
        item: [
          { linkId: 'primaryDiagnosis', text: 'Primary Diagnosis (ICD-10 code + description)', type: 'string', required: true, aiPrefilled: true },
          { linkId: 'secondaryDiagnosis', text: 'Secondary / Comorbid Diagnosis', type: 'string', aiPrefilled: true },
          { linkId: 'plannedProcedures', text: 'Planned Procedure(s) / Treatment Plan', type: 'text', required: true, aiPrefilled: true },
          { linkId: 'admissionType', text: 'Admission Type', type: 'choice', required: true, aiPrefilled: true, answerOption: [{ valueString: 'Elective' }, { valueString: 'Emergency' }, { valueString: 'Day Surgery' }] },
          { linkId: 'expectedLengthOfStay', text: 'Expected Length of Stay (days)', type: 'decimal', required: true, aiPrefilled: true },
          { linkId: 'clinicalNotes', text: 'Clinical Justification / Supporting Notes', type: 'text', aiPrefilled: true },
        ],
      },
      {
        linkId: 'section-cost',
        text: 'Cost Estimate (from ANZER)',
        type: 'group',
        item: [
          { linkId: 'totalEstimatedCost', text: 'Total Estimated Cost (USD)', type: 'decimal', required: true, readOnly: true },
          { linkId: 'coPayAmount', text: 'Patient Co-Pay Amount (USD)', type: 'decimal', readOnly: true },
        ],
      },
      {
        linkId: 'section-physician',
        text: 'Physician Declaration',
        type: 'group',
        item: [
          { linkId: 'surgeonName', text: 'Operating Surgeon Name', type: 'string', required: true },
          { linkId: 'surgeonRegNo', text: 'Surgeon Professional Registration No.', type: 'string', required: true },
          { linkId: 'anaesthetistName', text: 'Anaesthetist Name', type: 'string', required: true },
          { linkId: 'anaesthetistRegNo', text: 'Anaesthetist Professional Registration No.', type: 'string', required: true },
          { linkId: 'declarationConfirmed', text: 'I hereby certify that the above information is true, correct, and complete to the best of my knowledge and belief', type: 'boolean', required: true },
        ],
      },
    ],
  },
]

// ─── QuestionnaireResponse (AI Prefilled Draft) ───────────────────────────────

export interface QuestionnaireResponseAnswer {
  linkId: string
  answer: string | boolean | number
  aiPrefilled: boolean
  humanVerified: boolean
}

export const MOCK_PREFILL_RESPONSE: Record<string, QuestionnaireResponseAnswer[]> = {
  'gop-001': [
    { linkId: 'patient-name', answer: 'Chan Sophea', aiPrefilled: false, humanVerified: true },
    { linkId: 'patient-dob', answer: '1985-03-12', aiPrefilled: false, humanVerified: true },
    { linkId: 'patient-gender', answer: 'Female', aiPrefilled: false, humanVerified: true },
    { linkId: 'patient-national-id', answer: 'KH-102938475', aiPrefilled: false, humanVerified: true },
    { linkId: 'policy-number', answer: 'APRIL-2024-KH-88821', aiPrefilled: false, humanVerified: true },
    { linkId: 'membership-id', answer: 'APR-KH-100012', aiPrefilled: false, humanVerified: true },
    { linkId: 'diagnosis-primary', answer: 'K35.2 — Acute appendicitis with peritoneal abscess', aiPrefilled: true, humanVerified: true },
    { linkId: 'diagnosis-secondary', answer: '', aiPrefilled: true, humanVerified: true },
    { linkId: 'planned-procedures', answer: 'Laparoscopic appendectomy under general anaesthesia. Expected 2-night ICU stay post-op.', aiPrefilled: true, humanVerified: true },
    { linkId: 'admit-type', answer: 'Emergency', aiPrefilled: true, humanVerified: true },
    { linkId: 'expected-los', answer: 3, aiPrefilled: true, humanVerified: true },
    { linkId: 'clinical-notes', answer: 'Patient presented with acute RLQ pain, fever (38.9°C), elevated WBC (15,200). CT confirms perforated appendix.', aiPrefilled: true, humanVerified: true },
    { linkId: 'total-estimate', answer: 3200, aiPrefilled: false, humanVerified: true },
    { linkId: 'copay-amount', answer: 640, aiPrefilled: false, humanVerified: true },
    { linkId: 'physician-name', answer: 'Dr. Sok Phearith', aiPrefilled: true, humanVerified: true },
    { linkId: 'physician-reg', answer: 'KH-MED-20103', aiPrefilled: false, humanVerified: true },
    { linkId: 'physician-verified', answer: true, aiPrefilled: false, humanVerified: true },
  ],
  'gop-003': [
    { linkId: 'patient-name', answer: 'Kim Dara Rith', aiPrefilled: false, humanVerified: false },
    { linkId: 'patient-dob', answer: '1972-07-25', aiPrefilled: false, humanVerified: false },
    { linkId: 'membership-id', answer: 'HSC-00345-M', aiPrefilled: false, humanVerified: false },
    { linkId: 'diagnosis', answer: 'I21.0 — Acute transmural myocardial infarction of anterior wall (STEMI)', aiPrefilled: true, humanVerified: false },
    { linkId: 'procedure', answer: 'Percutaneous coronary intervention (PCI) with drug-eluting stent placement (x2 vessels)', aiPrefilled: true, humanVerified: false },
    { linkId: 'urgency', answer: 'Emergency', aiPrefilled: true, humanVerified: false },
    { linkId: 'hospital-name', answer: 'Intercare Hospital, Phnom Penh', aiPrefilled: true, humanVerified: false },
    { linkId: 'total-cost', answer: 8500, aiPrefilled: false, humanVerified: false },
  ],
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  totalRequests: 6,
  draft: 2,
  submitted: 1,
  approved: 1,
  rejected: 1,
  expired: 1,
  avgTurnaroundHours: 18.4,
  monthlyTrend: [
    { month: 'Jan', submitted: 12, approved: 9, rejected: 2 },
    { month: 'Feb', submitted: 15, approved: 11, rejected: 1 },
    { month: 'Mar', submitted: 18, approved: 13, rejected: 3 },
    { month: 'Apr', submitted: 6, approved: 1, rejected: 1 },
  ],
  statusDistribution: [
    { name: 'Draft', value: 2, color: '#94a3b8' },
    { name: 'Submitted', value: 1, color: '#3b82f6' },
    { name: 'Approved', value: 1, color: '#22c55e' },
    { name: 'Rejected', value: 1, color: '#ef4444' },
    { name: 'Expired', value: 1, color: '#f97316' },
  ],
  insurerBreakdown: [
    { insurer: 'APRIL', count: 3 },
    { insurer: 'HSC', count: 2 },
    { insurer: 'LUMA', count: 1 },
  ],
}

// ─── Helper lookups ───────────────────────────────────────────────────────────

export function getPatientById(id: string) {
  return MOCK_PATIENTS.find(p => p.id === id)
}

export function getCoverageByPatientId(patientId: string) {
  return MOCK_COVERAGES.find(c => c.beneficiary.reference === `Patient/${patientId}`)
}

export function getEncounterById(id: string) {
  return MOCK_ENCOUNTERS.find(e => e.id === id)
}

export function getCostEstimateByEncounterId(encounterId: string) {
  return MOCK_COST_ESTIMATES.find(c => c.encounterId === encounterId)
}

export function getQuestionnaireById(id: string) {
  return MOCK_QUESTIONNAIRES.find(q => q.id === id)
}

export function getGOPRequestById(id: string) {
  return MOCK_GOP_REQUESTS.find(r => r.id === id)
}

export function getQuestionnaireByInsurer(insurer: InsurerCode) {
  return MOCK_QUESTIONNAIRES.find(q => q.insurer === insurer)
}

export function formatPatientName(patient: MockPatient) {
  const n = patient.name[0]
  return `${n.given.join(' ')} ${n.family}`
}

export function calculateAge(birthDate: string) {
  const today = new Date()
  const dob = new Date(birthDate)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}
