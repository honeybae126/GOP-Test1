import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'
import type { Role, NotificationEvent } from '@/generated/prisma/client'

const SYSTEM_DETAIL = 'Auto-expired after 30 days without insurer response'

export async function GET() {
  const now = new Date()
  const expiredIds: string[] = []
  const warnedIds: string[] = []

  try {
    // 1. Existing expiry logic
    const overdue = await prisma.gOPRequest.findMany({
      where: {
        status: 'SUBMITTED',
        expiresAt: { lt: now },
      },
      select: { id: true },
    })

    for (const { id } of overdue) {
      await prisma.gOPRequest.update({
        where: { id },
        data: { status: 'EXPIRED', expiredAt: now },
      })

      await createAuditEntry(
        null,
        'SYSTEM',
        'REQUEST_EXPIRED',
        id,
        { status: 'SUBMITTED' },
        { status: 'EXPIRED' },
        { detail: SYSTEM_DETAIL }
      ).catch(() => {})

      expiredIds.push(id)
    }

    // 2. New warning logic: SUBMITTED expiresAt now ~ now+5days, no prior EXPIRY_WARNING_SENT
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const warningCandidates = await prisma.gOPRequest.findMany({
      where: {
        status: 'SUBMITTED',
        expiresAt: {
          gte: now,
          lte: fiveDaysFromNow,
        },
      },
      include: {
        auditEntries: {
          where: {
            action: 'EXPIRY_WARNING_SENT',
          },
        },
      },
    })

    for (const req of warningCandidates) {
      if (req.auditEntries.length > 0) continue // Already warned

      // Find insurance staff users
      const staffUsers = await prisma.userMetadata.findMany({
        where: {
          role: 'INSURANCE_STAFF',
        },
        select: {
          id: true,
          displayName: true,
        },
        take: 5, // Limit notifications
      })

      for (const user of staffUsers) {
        await createNotification(
          user.id,
          'INSURANCE_STAFF',
          'REQUEST_EXPIRED', // Reuse or add EXPIRY_WARNING
          req.id,
          {
            title: 'GOP expiring soon',
            message: `Request ${req.id} for ${req.patientId} expires in ${(new Date(req.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)} days. Resubmit or follow up.`,
          }
        ).catch(() => {})
      }

      // Create audit entry
      await createAuditEntry(
        null,
        'SYSTEM',
        'EXPIRY_WARNING_SENT',
        req.id,
        null,
        null,
        { daysRemaining: Math.ceil((new Date(req.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }
      ).catch(() => {})

      warnedIds.push(req.id)
    }
  } catch {
    // DB may be unavailable in dev — return empty result, client handles Zustand update
    return NextResponse.json({ expired: [], warned: [] })
  }

  return NextResponse.json({ expired: expiredIds, warned: warnedIds })
}

