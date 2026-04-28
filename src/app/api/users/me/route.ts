import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma/enums'
import { z } from 'zod'

const patchUserSchema = z.object({
  displayName: z.string().optional(),
  preferences: z.any().optional(),
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

  const entraObjectId = session.user.id as string

  try {
    let user = await prisma.userMetadata.findFirst({ where: { entraObjectId } })

    if (!user) {
      const roleStr = (session.user.role as string) ?? 'INSURANCE_STAFF'
      user = await prisma.userMetadata.create({
        data: {
          entraObjectId,
          displayName: session.user.name ?? '',
          role: roleStr as Role,
        },
      })
    }

    return NextResponse.json(user)
  } catch (e) {
    return NextResponse.json({ error: 'Database unavailable - demo mode' }, { status: 503 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entraObjectId = session.user.id as string
  const parse = patchUserSchema.safeParse(await request.json())
  if (!parse.success) return validationError(parse.error)
  const { displayName, preferences } = parse.data

  const user = await prisma.userMetadata.findFirst({ where: { entraObjectId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.userMetadata.update({
    where: { id: user.id },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(preferences !== undefined ? { preferences } : {}),
    },
  })

  return NextResponse.json(updated)
}
