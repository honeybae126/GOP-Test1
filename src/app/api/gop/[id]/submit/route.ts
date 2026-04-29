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
  if (role !== 'INSURANCE_STAFF' && role !== 'IT_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Gate — both doctors must have verified before GOP can be submitted to insurer
  const gopRecord = await prisma.gOPRequest.findUnique({
    where: { id },
    select: {
      surgeonVerifiedAt: true,
      anaesthetistVerifiedAt: true,
    },
  })

  if (!gopRecord) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!gopRecord.surgeonVerifiedAt || !gopRecord.anaesthetistVerifiedAt) {
    return NextResponse.json(
      {
        error: 'Both surgeon and anaesthetist must verify the quotation form before the GOP can be submitted to the insurer.',
        surgeonVerified: !!gopRecord.surgeonVerifiedAt,
        anaesthetistVerified: !!gopRecord.anaesthetistVerifiedAt,
      },
      { status: 403 }
    )
  }

  const existing = await prisma.gOPRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: { status: 'SUBMITTED', submittedAt: new Date(), updatedAt: new Date() },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    role === 'IT_ADMIN' ? 'ADMIN' : 'STAFF',
    'REQUEST_SUBMITTED_TO_INSURER',
    id
  )

  // Notify admins
  const admins = await prisma.userMetadata.findMany({ where: { role: 'IT_ADMIN' } })
  for (const admin of admins) {
    await createNotification(admin.entraObjectId, 'IT_ADMIN', 'REQUEST_SUBMITTED', id)
  }

  if (existing.assignedSurgeonId) {
    await createNotification(existing.assignedSurgeonId, 'DOCTOR', 'REQUEST_SUBMITTED', id)
  }
  if (existing.assignedAnaesthetistId) {
    await createNotification(existing.assignedAnaesthetistId, 'DOCTOR', 'REQUEST_SUBMITTED', id)
  }

  return NextResponse.json(updated)
}
