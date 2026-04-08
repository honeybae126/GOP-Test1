import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getNotifications } from '@/lib/notifications'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await getNotifications(session.user.id as string)
  return NextResponse.json(notifications)
}
