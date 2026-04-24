import { type NextRequest, NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'
import sql from 'mssql'

// GET /api/his/pricing?type={normal|different}&insurerId={id}&procedureCode={code}&deptId={id}
//
// ⚠ ASSUMPTION: Charge items live in table ChargeFees
// ⚠ ASSUMPTION: ChargeFees columns = ChgCode, ChgDesc, UnitPrice, DeptID, ChgType (category/type)
// ⚠ ASSUMPTION: For "different" pricing, a join to a pricing override table may be needed
//   (e.g. InsurancePricing or CorpPricing) — verify the actual join condition with the DBA
// ⚠ ASSUMPTION: insurerId filter maps to an InsurerID column in a pricing join table
//   If no per-insurer pricing table exists, remove that filter and return standard rates
export async function GET(req: NextRequest) {
  const r = await requireHisPool()
  if (r.error) return r.error

  const type          = req.nextUrl.searchParams.get('type') ?? 'normal'
  const insurerId     = req.nextUrl.searchParams.get('insurerId') ?? ''
  const procedureCode = req.nextUrl.searchParams.get('procedureCode') ?? ''
  const deptId        = req.nextUrl.searchParams.get('deptId') ?? ''

  const rows = await hisQuery(r.pool, `pricing:${type}:${deptId}`, async (pool) => {
    const request = pool.request()
    const conditions: string[] = []

    if (deptId) {
      request.input('deptId', sql.VarChar, deptId)
      conditions.push('cf.DeptID = @deptId')
    }
    if (procedureCode) {
      request.input('procCode', sql.VarChar, procedureCode)
      conditions.push('cf.ChgCode = @procCode')
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // For NORMAL pricing: standard ChargeFees rates
    // For DIFFERENT pricing: join to an override table (⚠ table name unconfirmed)
    const res = await request.query(`
      SELECT TOP 100
        cf.ChgCode   AS code,
        cf.ChgDesc   AS description,
        cf.UnitPrice AS unitPrice,
        cf.ChgType   AS type,
        cf.DeptID    AS department
      FROM ChargeFees cf
      ${where}
      ORDER BY cf.ChgDesc
    `)
    return res.recordset as {
      code: string
      description: string
      unitPrice: number
      type: string | null
      department: string | null
    }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
