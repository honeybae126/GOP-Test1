import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/employers
// ⚠ ASSUMPTION: Table = Employers, columns = EmployerID, EmployerName
// ⚠ ASSUMPTION: All rows returned (no active filter); add WHERE Active = 1 if applicable
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'employers', async (pool) => {
    const res = await pool.request().query(`
      SELECT EmployerID   AS id,
             EmployerName AS name
      FROM   Employers
      ORDER  BY EmployerName
    `)
    return res.recordset as { id: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
