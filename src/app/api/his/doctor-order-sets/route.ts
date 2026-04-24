import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/doctor-order-sets
// ⚠ ASSUMPTION: Table = DoctorOrderSets, columns = OrderSetID, OrderSetName
// ⚠ ASSUMPTION: No Active filter; remove or add WHERE Active = 1 if applicable
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'doctor-order-sets', async (pool) => {
    const res = await pool.request().query(`
      SELECT OrderSetID   AS id,
             OrderSetName AS name
      FROM   DoctorOrderSets
      ORDER  BY OrderSetName
    `)
    return res.recordset as { id: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
