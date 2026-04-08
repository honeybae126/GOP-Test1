import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  if (role !== 'INSURANCE_STAFF' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.gOPRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: { status: 'SUBMITTED', submittedAt: new Date(), updatedAt: new Date() },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    role === 'ADMIN' ? 'ADMIN' : 'STAFF',
    'REQUEST_SUBMITTED_TO_INSURER',
    id
  )

  // Notify admins
  const admins = await prisma.userMetadata.findMany({ where: { role: 'ADMIN' } })
  for (const admin of admins) {
    await createNotification(admin.entraObjectId, 'ADMIN', 'REQUEST_SUBMITTED', id)
  }

  // Notify assigned doctor
  if (existing.assignedDoctorId) {
    await createNotification(existing.assignedDoctorId, 'DOCTOR', 'REQUEST_SUBMITTED', id)
  }

  return NextResponse.json(updated)
}
