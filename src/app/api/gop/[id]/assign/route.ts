import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  if (role !== 'INSURANCE_STAFF' && role !== 'IT_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { surgeonId, anaesthetistId } = await request.json()

  const existing = await prisma.gOPRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isReassign = !!existing.assignedSurgeonId
  const action = isReassign ? 'REQUEST_REASSIGNED' : 'REQUEST_ASSIGNED'
  const event = isReassign ? ('REQUEST_REASSIGNED' as const) : ('REQUEST_ASSIGNED' as const)

  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: {
      ...(surgeonId !== undefined ? { assignedSurgeonId: surgeonId } : {}),
      ...(anaesthetistId !== undefined ? { assignedAnaesthetistId: anaesthetistId } : {}),
      updatedAt: new Date(),
    },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    role === 'IT_ADMIN' ? 'ADMIN' : 'STAFF',
    action,
    id
  )

  if (surgeonId) await createNotification(surgeonId, 'DOCTOR', event, id)
  if (anaesthetistId) await createNotification(anaesthetistId, 'DOCTOR', event, id)

  return NextResponse.json(updated)
}
