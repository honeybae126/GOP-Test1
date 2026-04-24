import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF']

// GET /api/billing/quotes/:id — fetch single quote with items
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const quotes = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM billing_quotes WHERE id = ${id} LIMIT 1
  `
  if (!quotes.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM billing_quote_items WHERE "quoteId" = ${id} ORDER BY "sortOrder"
  `

  return NextResponse.json({ ...quotes[0], items })
}

// PATCH /api/billing/quotes/:id — update a DRAFT quote
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Verify quote is still DRAFT
  const existing = await prisma.$queryRaw<[{ status: string }]>`
    SELECT status::text FROM billing_quotes WHERE id = ${id} LIMIT 1
  `
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT quotes can be updated' }, { status: 409 })
  }

  const body = await req.json()
  const {
    cpiId, patientName, dob, gender, phoneNumber,
    departmentId, departmentName, attendingDoctorId, attendingDoctorName,
    lengthOfStay, procedureCode, procedureName,
    diagnosisCode, diagnosisDescription, provisionalDiagnosis,
    doctorOrderSetId, doctorOrderSetName,
    pricingType, differentPricingId,
    employerId, employerName, insurerId, insurerName,
    discountPackageId, discountPackageName,
    marketingPackageId, marketingPackageName,
    quoteDate, totalNetAmount, items,
  } = body

  await prisma.$executeRaw`
    UPDATE billing_quotes SET
      "cpiId"                = COALESCE(${cpiId ?? null}, "cpiId"),
      "patientName"          = COALESCE(${patientName ?? null}, "patientName"),
      dob                    = ${dob ? new Date(dob) : null},
      gender                 = COALESCE(${gender ?? null}, gender),
      "phoneNumber"          = COALESCE(${phoneNumber ?? null}, "phoneNumber"),
      "departmentId"         = ${departmentId ?? null},
      "departmentName"       = ${departmentName ?? null},
      "attendingDoctorId"    = ${attendingDoctorId ?? null},
      "attendingDoctorName"  = ${attendingDoctorName ?? null},
      "lengthOfStay"         = ${lengthOfStay ?? null},
      "procedureCode"        = ${procedureCode ?? null},
      "procedureName"        = ${procedureName ?? null},
      "diagnosisCode"        = ${diagnosisCode ?? null},
      "diagnosisDescription" = ${diagnosisDescription ?? null},
      "provisionalDiagnosis" = ${provisionalDiagnosis ?? null},
      "doctorOrderSetId"     = ${doctorOrderSetId ?? null},
      "doctorOrderSetName"   = ${doctorOrderSetName ?? null},
      "pricingType"          = COALESCE(${pricingType ?? null}, "pricingType"),
      "differentPricingId"   = ${differentPricingId ?? null},
      "employerId"           = ${employerId ?? null},
      "employerName"         = ${employerName ?? null},
      "insurerId"            = COALESCE(${insurerId ?? null}, "insurerId"),
      "insurerName"          = COALESCE(${insurerName ?? null}, "insurerName"),
      "discountPackageId"    = ${discountPackageId ?? null},
      "discountPackageName"  = ${discountPackageName ?? null},
      "marketingPackageId"   = ${marketingPackageId ?? null},
      "marketingPackageName" = ${marketingPackageName ?? null},
      "quoteDate"            = COALESCE(${quoteDate ? new Date(quoteDate) : null}, "quoteDate"),
      "totalNetAmount"       = COALESCE(${totalNetAmount ?? null}, "totalNetAmount"),
      "updatedAt"            = NOW()
    WHERE id = ${id}
  `

  // Replace items if provided
  if (Array.isArray(items)) {
    await prisma.$executeRaw`DELETE FROM billing_quote_items WHERE "quoteId" = ${id}`
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      await prisma.$executeRaw`
        INSERT INTO billing_quote_items
          (id, "quoteId", department, type, code, description, unit, price, amount, discount, "netAmount", "sortOrder")
        VALUES (
          gen_random_uuid()::text, ${id},
          ${it.department ?? ''}, ${it.type ?? ''}, ${it.code ?? ''}, ${it.description ?? ''},
          ${it.unit ?? 1}, ${it.price ?? 0}, ${it.amount ?? 0}, ${it.discount ?? 0}, ${it.netAmount ?? 0}, ${i}
        )
      `
    }
  }

  // Audit
  await prisma.$executeRaw`
    INSERT INTO audit_entries (id, "actorId", "actorRole", action, metadata, "createdAt")
    VALUES (
      gen_random_uuid()::text, ${session.user.id ?? null},
      'STAFF'::"AuditActorRole", 'BILLING_QUOTE_UPDATED'::"AuditAction",
      ${JSON.stringify({ quoteId: id })}::jsonb, NOW()
    )
  `

  return NextResponse.json({ success: true })
}
