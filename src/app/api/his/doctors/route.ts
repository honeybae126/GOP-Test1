import { NextResponse } from 'next/server'
import { requireHisPool, hisQuery } from '../_shared'

// GET /api/his/doctors
// ⚠ ASSUMPTION: Table = Doctors, columns = DoctorID, DoctorName, Specialty, Active (BIT)
// ⚠ ASSUMPTION: Active = 1 filters to currently active doctors
export async function GET() {
  const r = await requireHisPool()
  if (r.error) return r.error

  const rows = await hisQuery(r.pool, 'doctors', async (pool) => {
    const res = await pool.request().query(`
      SELECT DoctorID  AS id,
             DoctorName AS name,
             Specialty   AS specialty
      FROM   Doctors
      WHERE  Active = 1
      ORDER  BY DoctorName
    `)
    return res.recordset as { id: string; name: string; specialty: string | null }[]
  })

  if (rows === null) return NextResponse.json({ offline: true, results: [] })
  return NextResponse.json(rows)
}
