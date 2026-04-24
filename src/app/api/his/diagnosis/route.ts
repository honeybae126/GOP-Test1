import { type NextRequest, NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'
import sql from 'mssql'

// GET /api/his/diagnosis?q={searchTerm}
// Type-ahead search — requires at least 2 characters.
// ⚠ ASSUMPTION: Table = Diagnosis (may be ICD10 or AdmitDiagnosis master table)
// ⚠ ASSUMPTION: Columns = DiagCode (ICD-10), DiagDesc
// ⚠ ASSUMPTION: This is a master diagnosis list, NOT the patient-specific AdmitDiagnosis table
export async function GET(req: NextRequest) {
  const r = await requireHisPool()
  if (r.error) return r.error

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json([])

  const rows = await hisQuery(r.pool, `diagnosis:${q}`, async (pool) => {
    const res = await pool.request()
      .input('q', sql.VarChar, `%${q}%`)
      .query(`
        SELECT TOP 20
          DiagCode AS code,
          DiagDesc AS description
        FROM  Diagnosis
        WHERE DiagDesc LIKE @q
           OR DiagCode  LIKE @q
        ORDER BY DiagDesc
      `)
    return res.recordset as { code: string; description: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
