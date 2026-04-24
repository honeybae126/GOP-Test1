import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF']

// PATCH /api/billing/quotes/:id/finalise — lock the quote (DRAFT → FINALISED)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const existing = await prisma.$queryRaw<[{ status: string; quoteNumber: string }]>`
    SELECT status::text, "quoteNumber" FROM billing_quotes WHERE id = ${id} LIMIT 1
  `
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT quotes can be finalised' }, { status: 409 })
  }

  await prisma.$executeRaw`
    UPDATE billing_quotes
    SET status = 'FINALISED'::"BillingStatus", "updatedAt" = NOW()
    WHERE id = ${id}
  `

  await prisma.$executeRaw`
    INSERT INTO audit_entries (id, "actorId", "actorRole", action, metadata, "createdAt")
    VALUES (
      gen_random_uuid()::text, ${session.user.id ?? null},
      'STAFF'::"AuditActorRole", 'BILLING_QUOTE_FINALISED'::"AuditAction",
      ${JSON.stringify({ quoteId: id, quoteNumber: existing[0].quoteNumber })}::jsonb, NOW()
    )
  `

  return NextResponse.json({ success: true, status: 'FINALISED' })
}
