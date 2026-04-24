import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchPatients } from '@/lib/his'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN']

// GET /api/his/patients?q={query}
// Returns matching patients from CPIPersonal (max 10).
// Staff and Admin only — doctors do not search patients.
// Patient searches are NOT written to the audit log (per spec).
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const results = await searchPatients(q)

  // null means HIS is offline — return empty with a flag so the client can show a fallback
  if (results === null) {
    return NextResponse.json({ offline: true, results: [] })
  }

  return NextResponse.json(results)
}
