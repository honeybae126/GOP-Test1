// FHIR Client - Typed wrappers for HAPI FHIR REST API
// Base URL from .env

const FHIR_BASE = process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir'

type FHIRPatient = {
  resourceType: 'Patient'
  id: string
  name: Array<{
    family: string
    given: string[]
  }>
  identifier: Array<{
    system: string
    value: string
  }>
  telecom?: Array<{
    system: string
    value: string
  }>
  managingOrganization?: {
    reference: string
  }
}

type FHIRSearchParams = Record<string, string>

export async function searchPatients(params: FHIRSearchParams): Promise<FHIRPatient[]> {
  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${FHIR_BASE}/Patient?${query}`)
  if (!response.ok) throw new Error(`FHIR search failed: ${response.status}`)
  const bundle = await response.json()
  return bundle.entry?.map((e: any) => e.resource as FHIRPatient) || []
}

export async function getQuestionnaire(id: string) {
  const response = await fetch(`${FHIR_BASE}/Questionnaire/${id}`)
  if (!response.ok) throw new Error(`Questionnaire not found`)
  return response.json()
}

export async function createTask(task: any) {
  const response = await fetch(`${FHIR_BASE}/Task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(task)
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Task creation failed: ${response.status} ${error}`)
  }
  return response.json()
}

// Mock data for dev without FHIR server
export const MOCK_PATIENTS = [
  {
    resourceType: 'Patient',
    id: 'patient-1',
    name: [{ family: 'Doe', given: ['John'] }],
    identifier: [{ system: 'hospital.local/id', value: 'P001' }],
    telecom: [{ system: 'email', value: 'john@example.com' }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-2',
    name: [{ family: 'Smith', given: ['Jane'] }],
    identifier: [{ system: 'hospital.local/id', value: 'P002' }],
    telecom: [{ system: 'phone', value: '+1234567890' }]
  }
]

export const MOCK_APRIL_QUESTIONNAIRE = {
  resourceType: 'Questionnaire',
  id: 'april-preauth-form',
  title: 'APRIL GOP Pre-authorization Form',
  item: [
    { linkId: 'patient-details', text: 'Patient Details', type: 'group', item: [
      { linkId: 'name', text: 'Full Name', type: 'string' },
      { linkId: 'policy-no', text: 'Policy Number', type: 'string' },
    ]},
    { linkId: 'diagnosis', text: 'Diagnosis', type: 'text' },
    { linkId: 'procedures', text: 'Planned Procedures', type: 'text' },
    { linkId: 'physician-sign', text: 'Physician Verification', type: 'signature' }
  ]
}

