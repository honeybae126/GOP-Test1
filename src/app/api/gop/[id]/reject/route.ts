import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  if (role !== 'IT_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { reason } = body

  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  }

  const existing = await prisma.gOPRequest.findUnique({
    where: { id },
    include: { insurer: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'Request is not in SUBMITTED state' }, { status: 400 })
  }

  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: { status: 'REJECTED', rejectedAt: new Date(), rejectedReason: reason },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    'ADMIN',
    'REQUEST_REJECTED',
    id,
    { status: existing.status },
    { status: 'REJECTED', rejectedReason: reason },
    { reason }
  )

  if (existing.assignedSurgeonId) {
    await createNotification(existing.assignedSurgeonId, 'DOCTOR', 'REQUEST_REJECTED', id, {
      insurerName: existing.insurer?.name ?? '',
      rejectionReason: reason,
    }).catch(() => {})
  }
  if (existing.assignedAnaesthetistId) {
    await createNotification(existing.assignedAnaesthetistId, 'DOCTOR', 'REQUEST_REJECTED', id, {
      insurerName: existing.insurer?.name ?? '',
      rejectionReason: reason,
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
