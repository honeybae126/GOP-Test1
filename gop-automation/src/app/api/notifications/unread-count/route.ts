import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ count: 0 })

  try {
    const count = await getUnreadCount(session.user.id as string)
    return NextResponse.json({ count })
  } catch {
    // DB not available yet (e.g. no connection) — return 0 gracefully
    return NextResponse.json({ count: 0 })
  }
}
