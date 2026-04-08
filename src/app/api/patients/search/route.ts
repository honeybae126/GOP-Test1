import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PATIENTS } from '@/lib/fhir'
import { auth } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const patients = MOCK_PATIENTS

    return NextResponse.json({
      patients,
      total: patients.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

