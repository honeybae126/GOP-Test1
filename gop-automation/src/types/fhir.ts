// FHIR Types for GOP app

export interface FHIRPatient {
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
  extension?: Array<any>
}

export interface FHIREncounter {
  resourceType: 'Encounter'
  id: string
  status: string
  class: { code: string }
  period?: { start: string; end?: string }
  serviceProvider?: { reference: string }
  participant?: Array<{
    individual: { reference: string }
  }>
}

export interface FHIRCoverage {
  resourceType: 'Coverage'
  id: string
  status: string
  beneficiary: { reference: string }
  payor: Array<{ reference: string }>
  policyHolder: { reference: string }
  // Simplified - ANZER handles complex rules
}

