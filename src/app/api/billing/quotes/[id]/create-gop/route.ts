import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF']
const GOP_ELIGIBLE_INSURERS = ['AIA', 'ASSURNET'] // case-insensitive check below

// POST /api/billing/quotes/:id/create-gop
// Creates a GOPRequest from this quote. Maps billing fields to GOP fields.
// Sets quote status to GOP_CREATED and stores the gopRequestId.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Fetch the quote
  const quotes = await prisma.$queryRaw<{
    id: string; quoteNumber: string; status: string;
    cpiId: string; patientName: string; dob: Date | null; gender: string | null; phoneNumber: string | null;
    departmentName: string | null; attendingDoctorId: string | null; attendingDoctorName: string | null;
    lengthOfStay: number | null; procedureCode: string | null; procedureName: string | null;
    diagnosisCode: string | null; diagnosisDescription: string | null; provisionalDiagnosis: string | null;
    pricingType: string; employerId: string | null; employerName: string | null;
    insurerId: string; insurerName: string;
    discountPackageId: string | null; marketingPackageId: string | null;
    totalNetAmount: string; gopRequestId: string | null;
  }[]>`
    SELECT * FROM billing_quotes WHERE id = ${id} LIMIT 1
  `
  if (!quotes.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const quote = quotes[0]

  // Only AIA and ASSURNET quotes can create GOP requests
  const insurerUpper = (quote.insurerName ?? '').toUpperCase()
  const isEligible = GOP_ELIGIBLE_INSURERS.some(ins => insurerUpper.includes(ins))
  if (!isEligible) {
    return NextResponse.json({ error: 'GOP requests can only be created for AIA or ASSURNET insurers' }, { status: 422 })
  }

  // If GOP already created, return existing ID
  if (quote.gopRequestId) {
    return NextResponse.json({ gopRequestId: quote.gopRequestId, alreadyExists: true })
  }

  // Find or upsert an InsurerConfig record for this insurer
  const existingInsurer = await prisma.insurerConfig.findFirst({
    where: { name: { equals: quote.insurerName, mode: 'insensitive' } },
  })
  let insurerConfigId: string
  if (existingInsurer) {
    insurerConfigId = existingInsurer.id
  } else {
    const newIns = await prisma.insurerConfig.create({
      data: { name: quote.insurerName },
    })
    insurerConfigId = newIns.id
  }

  // Create GOPRequest in Prisma
  const gopRequest = await prisma.gOPRequest.create({
    data: {
      status: 'DRAFT',
      patientId: quote.cpiId || `cpi-${Date.now()}`,
      insurerId: insurerConfigId,
      formData: {
        patientName:          quote.patientName,
        cpiId:                quote.cpiId,
        dob:                  quote.dob?.toISOString().slice(0, 10) ?? null,
        gender:               quote.gender,
        phoneNumber:          quote.phoneNumber,
        attendingDoctorId:    quote.attendingDoctorId,
        attendingDoctorName:  quote.attendingDoctorName,
        departmentName:       quote.departmentName,
        lengthOfStay:         quote.lengthOfStay,
        procedureCode:        quote.procedureCode,
        procedureName:        quote.procedureName,
        diagnosisCode:        quote.diagnosisCode,
        diagnosisDescription: quote.diagnosisDescription,
        provisionalDiagnosis: quote.provisionalDiagnosis,
        pricingType:          quote.pricingType,
        employerId:           quote.employerId,
        employerName:         quote.employerName,
        insurerId:            quote.insurerId,
        insurerName:          quote.insurerName,
        estimatedCost:        parseFloat(quote.totalNetAmount),
        billingQuoteId:       quote.id,
        billingQuoteNumber:   quote.quoteNumber,
        fromBilling:          true,
      },
    },
  })

  // Update quote: set GOP_CREATED and store gopRequestId
  await prisma.$executeRaw`
    UPDATE billing_quotes
    SET status = 'GOP_CREATED'::"BillingStatus",
        "gopRequestId" = ${gopRequest.id},
        "updatedAt"    = NOW()
    WHERE id = ${id}
  `

  // Audit
  await prisma.$executeRaw`
    INSERT INTO audit_entries (id, "actorId", "actorRole", action, metadata, "createdAt")
    VALUES (
      gen_random_uuid()::text, ${session.user.id ?? null},
      'STAFF'::"AuditActorRole", 'BILLING_GOP_CREATED'::"AuditAction",
      ${JSON.stringify({ quoteId: id, gopRequestId: gopRequest.id, patientName: quote.patientName })}::jsonb,
      NOW()
    )
  `

  return NextResponse.json({ gopRequestId: gopRequest.id }, { status: 201 })
}
