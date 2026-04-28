import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { z } from 'zod'

const patchGopSchema = z.object({
  formData: z.any().optional(),
  status:   z.enum(['DRAFT', 'SUBMITTED', 'DOCTOR_REVIEW', 'SUBMITTED_TO_INSURER', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
})

function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: 'Validation failed', issues: error.issues },
    { status: 400 }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = session.user.role as string
  const userId = session.user.id as string

  const where =
    role === 'DOCTOR'
      ? { id, OR: [{ assignedSurgeonId: userId }, { assignedAnaesthetistId: userId }] }
      : { id }

  const gopRequest = await prisma.gOPRequest.findFirst({
    where,
    include: { insurer: true },
  })

  if (!gopRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(gopRequest)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  if (role !== 'INSURANCE_STAFF' && role !== 'IT_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const parse = patchGopSchema.safeParse(await request.json())
  if (!parse.success) return validationError(parse.error)
  const { formData, status } = parse.data

  const existing = await prisma.gOPRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.gOPRequest.update({
    where: { id },
    data: {
      ...(formData !== undefined ? { formData } : {}),
      ...(status !== undefined ? { status } : {}),
      updatedAt: new Date(),
    },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    role === 'IT_ADMIN' ? 'ADMIN' : 'STAFF',
    'REQUEST_UPDATED',
    id,
    existing as any,
    updated as any
  )

  return NextResponse.json(updated)
}
