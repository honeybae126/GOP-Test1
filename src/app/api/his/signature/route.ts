import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDoctorSignature } from '@/lib/his'

// GET /api/his/signature
// Returns the signature for the currently logged-in doctor.
// ⚠ ASSUMPTION: session.user.id (the Microsoft Entra object ID) matches DoctorSignatures.DoctorID.
//   If HIS uses a different key, a lookup/mapping table is required.
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const doctorId = session.user.id
  const signature = await getDoctorSignature(doctorId)

  // null means HIS is offline — distinguish from "found but no signature"
  if (signature === null) {
    return NextResponse.json({ offline: true, signatureUrl: null, signatureData: null })
  }

  const hasSignature = !!(signature.signatureUrl || signature.signatureData)
  return NextResponse.json({
    offline: false,
    hasSignature,
    signatureUrl:  signature.signatureUrl,
    signatureData: signature.signatureData,
  })
}
