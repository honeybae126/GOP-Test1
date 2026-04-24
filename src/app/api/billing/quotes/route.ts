import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF']

// ── Quote number generator: Q-YYYYMMDD-XXXX ──────────────────────────────────
async function generateQuoteNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  // Count quotes already created today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay   = new Date(startOfDay.getTime() + 86400000)

  const count = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*) AS cnt FROM billing_quotes
    WHERE "createdAt" >= ${startOfDay} AND "createdAt" < ${endOfDay}
  `
  const seq = (Number(count[0].cnt) + 1).toString().padStart(4, '0')
  return `Q-${dateStr}-${seq}`
}

// GET /api/billing/quotes?dateFrom=&dateTo=&status=&cpi=&patientName=
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp          = req.nextUrl.searchParams
  const dateFrom    = sp.get('dateFrom')
  const dateTo      = sp.get('dateTo')
  const status      = sp.get('status')
  const cpi         = sp.get('cpi')
  const patientName = sp.get('patientName')

  const conditions: Prisma.Sql[] = []
  if (dateFrom)    conditions.push(Prisma.sql`"quoteDate" >= ${new Date(dateFrom)}`)
  if (dateTo)      conditions.push(Prisma.sql`"quoteDate" <= ${new Date(dateTo + 'T23:59:59')}`)
  if (status)      conditions.push(Prisma.sql`"status" = ${status}::"BillingStatus"`)
  if (cpi)         conditions.push(Prisma.sql`"cpiId" ILIKE ${`%${cpi}%`}`)
  if (patientName) conditions.push(Prisma.sql`"patientName" ILIKE ${`%${patientName}%`}`)

  const where = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.sql``

  const rows = await prisma.$queryRaw<{
    id: string; quoteNumber: string; patientName: string; cpiId: string;
    quoteDate: Date; totalNetAmount: string; phoneNumber: string | null;
    status: string; createdByName: string; insurerName: string;
  }[]>`
    SELECT id, "quoteNumber", "patientName", "cpiId", "quoteDate",
           "totalNetAmount", "phoneNumber", status::text, "createdByName", "insurerName"
    FROM billing_quotes
    ${where}
    ORDER BY "createdAt" DESC
    LIMIT 200
  `

  return NextResponse.json(rows.map(r => ({
    ...r,
    totalNetAmount: parseFloat(r.totalNetAmount),
    quoteDate: r.quoteDate.toISOString().slice(0, 10),
  })))
}

// POST /api/billing/quotes — create a new DRAFT quote
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const quoteNumber = await generateQuoteNumber()

  const {
    cpiId = '', patientName = '', dob, gender, phoneNumber,
    departmentId, departmentName, attendingDoctorId, attendingDoctorName,
    lengthOfStay, procedureCode, procedureName,
    diagnosisCode, diagnosisDescription, provisionalDiagnosis,
    doctorOrderSetId, doctorOrderSetName,
    pricingType = 'NORMAL', differentPricingId,
    employerId, employerName, insurerId = '', insurerName = '',
    discountPackageId, discountPackageName,
    marketingPackageId, marketingPackageName,
    quoteDate, totalNetAmount = 0,
    items = [],
  } = body

  // Insert quote
  await prisma.$executeRaw`
    INSERT INTO billing_quotes (
      id, "quoteNumber", "cpiId", "patientName", dob, gender, "phoneNumber",
      "departmentId", "departmentName", "attendingDoctorId", "attendingDoctorName",
      "lengthOfStay", "procedureCode", "procedureName",
      "diagnosisCode", "diagnosisDescription", "provisionalDiagnosis",
      "doctorOrderSetId", "doctorOrderSetName",
      "pricingType", "differentPricingId",
      "employerId", "employerName",
      "insurerId", "insurerName",
      "discountPackageId", "discountPackageName",
      "marketingPackageId", "marketingPackageName",
      "quoteDate", status, "totalNetAmount",
      "createdBy", "createdByName", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      ${quoteNumber}, ${cpiId}, ${patientName},
      ${dob ? new Date(dob) : null}, ${gender ?? null}, ${phoneNumber ?? null},
      ${departmentId ?? null}, ${departmentName ?? null},
      ${attendingDoctorId ?? null}, ${attendingDoctorName ?? null},
      ${lengthOfStay ?? null}, ${procedureCode ?? null}, ${procedureName ?? null},
      ${diagnosisCode ?? null}, ${diagnosisDescription ?? null}, ${provisionalDiagnosis ?? null},
      ${doctorOrderSetId ?? null}, ${doctorOrderSetName ?? null},
      ${pricingType}, ${differentPricingId ?? null},
      ${employerId ?? null}, ${employerName ?? null},
      ${insurerId}, ${insurerName},
      ${discountPackageId ?? null}, ${discountPackageName ?? null},
      ${marketingPackageId ?? null}, ${marketingPackageName ?? null},
      ${quoteDate ? new Date(quoteDate) : new Date()},
      'DRAFT'::"BillingStatus", ${totalNetAmount},
      ${session.user.id ?? session.user.email ?? ''}, ${session.user.name ?? ''},
      NOW(), NOW()
    )
  `

  // Fetch the newly created quote ID
  const created = await prisma.$queryRaw<[{ id: string }]>`
    SELECT id FROM billing_quotes WHERE "quoteNumber" = ${quoteNumber} LIMIT 1
  `
  const quoteId = created[0]?.id

  // Insert items
  if (quoteId && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      await prisma.$executeRaw`
        INSERT INTO billing_quote_items
          (id, "quoteId", department, type, code, description, unit, price, amount, discount, "netAmount", "sortOrder")
        VALUES (
          gen_random_uuid()::text, ${quoteId},
          ${it.department ?? ''}, ${it.type ?? ''}, ${it.code ?? ''}, ${it.description ?? ''},
          ${it.unit ?? 1}, ${it.price ?? 0}, ${it.amount ?? 0}, ${it.discount ?? 0}, ${it.netAmount ?? 0}, ${i}
        )
      `
    }
  }

  // Audit entry
  await prisma.$executeRaw`
    INSERT INTO audit_entries (id, "actorId", "actorRole", action, metadata, "createdAt")
    VALUES (
      gen_random_uuid()::text,
      ${session.user.id ?? null},
      'STAFF'::"AuditActorRole",
      'BILLING_QUOTE_CREATED'::"AuditAction",
      ${JSON.stringify({ quoteId, quoteNumber, patientName })}::jsonb,
      NOW()
    )
  `

  return NextResponse.json({ id: quoteId, quoteNumber }, { status: 201 })
}
