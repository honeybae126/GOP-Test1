import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/departments
// ⚠ ASSUMPTION: Table = Departments, columns = DeptID (PK), DeptName, Active (BIT)
// ⚠ ASSUMPTION: Active = 1 filters to active departments only; remove if no such column
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'departments', async (pool) => {
    const res = await pool.request().query(`
      SELECT DeptID AS id, DeptName AS name
      FROM   Departments
      WHERE  Active = 1
      ORDER  BY DeptName
    `)
    return res.recordset as { id: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
