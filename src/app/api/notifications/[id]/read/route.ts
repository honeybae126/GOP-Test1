import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAsRead } from '@/lib/notifications'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await markAsRead(id, session.user.id as string)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
  }
}
