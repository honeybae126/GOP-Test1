import { type NextRequest, NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'
import sql from 'mssql'

// GET /api/his/procedures?department={deptId}
// ⚠ ASSUMPTION: Table = Procedures (may be ORProcedures or ChargeItems)
// ⚠ ASSUMPTION: Columns = ProcCode, ProcName, DeptID
// ⚠ ASSUMPTION: DeptID column exists and matches the IDs from /api/his/departments
export async function GET(req: NextRequest) {
  const r = await requireHisPool()
  if (r.error) return r.error

  const deptId = req.nextUrl.searchParams.get('department')

  const rows = await hisQuery(r.pool, 'procedures', async (pool) => {
    const request = pool.request()
    let query = `
      SELECT ProcCode AS code, ProcName AS name
      FROM   Procedures
    `
    if (deptId) {
      request.input('deptId', sql.VarChar, deptId)
      query += ' WHERE DeptID = @deptId'
    }
    query += ' ORDER BY ProcName'
    const res = await request.query(query)
    return res.recordset as { code: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
