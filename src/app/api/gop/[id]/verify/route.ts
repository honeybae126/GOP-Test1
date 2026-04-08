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
  if (role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { correctionNotes } = await request.json().catch(() => ({}))

  const existing = await prisma.gOPRequest.findUnique({
    where: { id },
    include: { insurer: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (correctionNotes) {
    // Correction request — return to staff
    await createAuditEntry(
      session.user.id as string,
      'DOCTOR',
      'REQUEST_CORRECTION_REQUESTED',
      id,
      null,
      null,
      { correctionNotes }
    )

    // Notify all Insurance Staff (since we don't store createdById yet)
    const staffUsers = await prisma.userMetadata.findMany({
      where: { role: 'INSURANCE_STAFF' },
    })
    for (const staff of staffUsers) {
      await createNotification(staff.id, 'INSURANCE_STAFF', 'REQUEST_CORRECTION_REQUESTED', id, {
        correctionNotes,
        doctorName: session.user.name ?? 'Doctor',
        requestId: id,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, action: 'correction_requested' })
  }

  // Verification — mark as verified in formData
  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: {
      formData: {
        ...(typeof existing.formData === 'object' && existing.formData !== null
          ? (existing.formData as Record<string, unknown>)
          : {}),
        verifiedAt: new Date().toISOString(),
        verifiedBy: session.user.id,
      },
    },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    'DOCTOR',
    'REQUEST_VERIFIED',
    id,
    null,
    { verifiedAt: new Date().toISOString() },
    {}
  )

  // Notify all Insurance Staff
  const staffUsers = await prisma.userMetadata.findMany({
    where: { role: 'INSURANCE_STAFF' },
  })
  for (const staff of staffUsers) {
    await createNotification(staff.id, 'INSURANCE_STAFF', 'REQUEST_VERIFIED', id, {
      doctorName: session.user.name ?? 'Doctor',
      requestId: id,
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
