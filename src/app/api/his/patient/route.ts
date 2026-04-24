import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getPatientByNRIC,
  getPatientInsurance,
  getAdmission,
  getAdmissionDiagnosis,
} from '@/lib/his'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN']

// GET /api/his/patient?nric={nric}&admissionId={id}
// Returns patient demographics + insurance + admission + diagnosis in one call.
// admissionId is optional — omit if the admission ID is not yet known.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const nric        = req.nextUrl.searchParams.get('nric')
  const admissionId = req.nextUrl.searchParams.get('admissionId')

  if (!nric) return NextResponse.json({ error: 'nric is required' }, { status: 400 })

  const patient = await getPatientByNRIC(nric)
  if (!patient) {
    return NextResponse.json({ found: false })
  }

  const [insurance, admission, diagnosis] = await Promise.all([
    getPatientInsurance(patient.patientId),
    admissionId ? getAdmission(admissionId) : Promise.resolve(null),
    admissionId ? getAdmissionDiagnosis(admissionId) : Promise.resolve(null),
  ])

  return NextResponse.json({
    found: true,
    patient,
    insurance,
    admission,
    diagnosis,
  })
}
