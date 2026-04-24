/**
 * Shared helpers for HIS read-only API routes.
 * All HIS queries are read-only — never INSERT/UPDATE/DELETE.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getHisPool } from '@/lib/his-db'
import type { ConnectionPool } from 'mssql'

export const HIS_ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF', 'FINANCE']
export const HIS_TIMEOUT_MS = 5000

/** Authenticate, check role, and return the HIS pool — or an error Response. */
export async function requireHisPool(): Promise<
  { pool: ConnectionPool; error?: never } |
  { pool?: never; error: NextResponse }
> {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!HIS_ALLOWED_ROLES.includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const pool = await getHisPool()
  if (!pool) {
    // HIS offline — return empty list so UI can show "No items found" gracefully
    return { error: NextResponse.json({ offline: true, results: [] }) }
  }
  return { pool }
}

/** Wrap an HIS query with the shared timeout and error handling. */
export async function hisQuery<T>(
  pool: ConnectionPool,
  label: string,
  fn: (pool: ConnectionPool) => Promise<T>,
): Promise<T | null> {
  const timeout = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('HIS query timeout')), HIS_TIMEOUT_MS)
  )
  try {
    return await Promise.race([fn(pool), timeout]) as T
  } catch (err) {
    console.error(`[HIS] ${label} failed:`, err)
    return null
  }
}
