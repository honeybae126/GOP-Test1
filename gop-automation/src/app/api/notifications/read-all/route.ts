import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await prisma.notification.updateMany({
    where: { recipientId: session.user.id as string, readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ count: result.count })
}
