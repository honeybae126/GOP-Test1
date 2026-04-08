import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rules = await prisma.notificationRule.findMany({
    where: { userId: session.user.id as string },
  })

  return NextResponse.json(rules)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventType, channel, enabled } = await request.json()
  const userId = session.user.id as string

  const updated = await prisma.notificationRule.upsert({
    where: { userId_eventType_channel: { userId, eventType, channel } },
    create: { userId, eventType, channel, enabled },
    update: { enabled },
  })

  return NextResponse.json(updated)
}
