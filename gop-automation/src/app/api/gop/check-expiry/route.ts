import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'

const SYSTEM_DETAIL = 'Auto-expired after 30 days without insurer response'

export async function GET() {
  const now = new Date()
  const expiredIds: string[] = []

  try {
    // Find all SUBMITTED DB records whose expiresAt has passed
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
      ).catch(() => {}) // non-fatal if audit write fails

      expiredIds.push(id)
    }
  } catch {
    // DB may be unavailable in dev — return empty result, client handles Zustand update
    return NextResponse.json({ expired: [] })
  }

  return NextResponse.json({ expired: expiredIds })
}
