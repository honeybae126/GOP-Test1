import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAuditHistory } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

const DOCTOR_VISIBLE_ACTIONS = new Set([
  'REQUEST_ASSIGNED',
  'REQUEST_VERIFIED',
  'REQUEST_CORRECTION_REQUESTED',
])

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const role = session.user.role as string

  if (role === 'IT_ADMIN') {
    const history = await getAuditHistory(requestId)
    return NextResponse.json(history)
  }

  if (role === 'INSURANCE_STAFF') {
    // Staff can view audit history for any request (no createdById filter in schema yet)
    const gopRequest = await prisma.gOPRequest.findUnique({ where: { id: requestId } })
    if (!gopRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const history = await getAuditHistory(requestId)
    return NextResponse.json(history)
  }

  if (role === 'DOCTOR') {
    const userId = session.user.id as string
    const gopRequest = await prisma.gOPRequest.findFirst({
      where: { id: requestId, OR: [{ assignedSurgeonId: userId }, { assignedAnaesthetistId: userId }] },
    })
    if (!gopRequest) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const history = await getAuditHistory(requestId)
    const filtered = history.filter((entry) => DOCTOR_VISIBLE_ACTIONS.has(entry.action))
    return NextResponse.json(filtered)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
