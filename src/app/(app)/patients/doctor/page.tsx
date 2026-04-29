import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DoctorPatientSearch } from '@/components/patients/doctor-patient-search'
import {
  MOCK_ENCOUNTERS,
  MOCK_COVERAGES,
} from '@/lib/mock-data'

export default async function DoctorPatientSearchPage() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (session.user?.role !== 'DOCTOR') redirect('/patients')

  const gopRaw = await prisma.gOPRequest.findMany({
    select: {
      id:        true,
      patientId: true,
      status:    true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  const gopRequests = gopRaw.map(r => ({
    id:        r.id,
    patientId: r.patientId,
    status:    r.status as string,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Patient Search</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Search and filter patients by ward, admission date, or assigned physician.
        </p>
      </div>
      {/* patients={[]} — MOCK_PATIENTS removed; DoctorPatientSearch needs encounter API before it can be fully wired */}
      <DoctorPatientSearch
        patients={[]}
        encounters={MOCK_ENCOUNTERS}
        coverages={MOCK_COVERAGES}
        gopRequests={gopRequests as any}
      />
    </div>
  )
}
