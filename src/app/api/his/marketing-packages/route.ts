import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/marketing-packages
// ⚠ ASSUMPTION: Table = MarketingPackages, columns = PackageID, PackageName
// ⚠ ASSUMPTION: May also be called MktgPackages or PromoPackages in the actual HIS schema
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'marketing-packages', async (pool) => {
    const res = await pool.request().query(`
      SELECT PackageID   AS id,
             PackageName AS name
      FROM   MarketingPackages
      ORDER  BY PackageName
    `)
    return res.recordset as { id: string; name: string }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
