import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/discount-packages
// ⚠ ASSUMPTION: Table = DiscPackages, columns = PackageID, PackageName
// ⚠ ASSUMPTION: May also be called DiscountPackages or MembershipPackages in the actual HIS schema
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'discount-packages', async (pool) => {
    const res = await pool.request().query(`
      SELECT PackageID   AS id,
             PackageName AS name
      FROM   DiscPackages
      ORDER  BY PackageName
    `)
    return res.recordset as { id: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
