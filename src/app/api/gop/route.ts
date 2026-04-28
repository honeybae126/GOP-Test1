import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditEntry } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const postGopSchema = z.object({
  patientId:              z.string().min(1, 'patientId is required'),
  insurerId:              z.string().min(1, 'insurerId is required'),
  assignedSurgeonId:      z.string().optional().nullable(),
  assignedAnaesthetistId: z.string().optional().nullable(),
  formData:               z.any().optional(),
})

function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: 'Validation failed', issues: error.issues },
    { status: 400 }
  )
}

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  const userId = session.user.id as string

  const where = role === 'DOCTOR'
    ? { OR: [{ assignedSurgeonId: userId }, { assignedAnaesthetistId: userId }] }
    : {}

  const requests = await prisma.gOPRequest.findMany({
    where,
    include: { insurer: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role as string
  if (role !== 'INSURANCE_STAFF' && role !== 'IT_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parse = postGopSchema.safeParse(await request.json())
  if (!parse.success) return validationError(parse.error)
  const body = parse.data

  const created = await prisma.gOPRequest.create({
    data: {
      ...body,
      status: 'DRAFT',
    },
    include: { insurer: true },
  })

  await createAuditEntry(
    session.user.id as string,
    role === 'IT_ADMIN' ? 'ADMIN' : 'STAFF',
    'REQUEST_CREATED',
    created.id
  )

  await createNotification(
    session.user.id as string,
    role === 'IT_ADMIN' ? 'ADMIN' : 'INSURANCE_STAFF',
    'REQUEST_CREATED',
    created.id
  )

  return NextResponse.json(created, { status: 201 })
}
