import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expiryConfig = await prisma.systemConfig.findFirst({
    where: { key: 'request_expiry_days' },
  })
  const expiryDays = expiryConfig ? Number(expiryConfig.value) : 30

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - expiryDays)

  const expiredRequests = await prisma.gOPRequest.findMany({
    where: {
      status: 'SUBMITTED',
      submittedAt: { lt: cutoff },
    },
    include: { insurer: true },
  })

  let expired = 0

  for (const req of expiredRequests) {
    await prisma.gOPRequest.update({
      where: { id: req.id },
      data: { status: 'EXPIRED' },
    })

    await createAuditEntry(null, 'SYSTEM', 'REQUEST_EXPIRED', req.id, null, { status: 'EXPIRED' }, {})

    // Notify all Insurance Staff and Admins
    const recipients = await prisma.userMetadata.findMany({
      where: { role: { in: ['INSURANCE_STAFF', 'ADMIN'] } },
    })
    for (const user of recipients) {
      await createNotification(
        user.id,
        user.role,
        'REQUEST_EXPIRED',
        req.id,
        { insurerName: req.insurer?.name ?? '', requestId: req.id }
      ).catch(() => {})
    }

    expired++
  }

  return NextResponse.json({ expired })
}
