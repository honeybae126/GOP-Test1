import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DoctorPatientSearch } from '@/components/patients/doctor-patient-search'
import {
  MOCK_PATIENTS,
  MOCK_ENCOUNTERS,
  MOCK_COVERAGES,
  MOCK_GOP_REQUESTS,
} from '@/lib/mock-data'

export default async function DoctorPatientSearchPage() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (session.user?.role !== 'DOCTOR') redirect('/patients')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Patient Search</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Search and filter patients by ward, admission date, or assigned physician.
        </p>
      </div>
      <DoctorPatientSearch
        patients={MOCK_PATIENTS}
        encounters={MOCK_ENCOUNTERS}
        coverages={MOCK_COVERAGES}
        gopRequests={MOCK_GOP_REQUESTS}
      />
    </div>
  )
}
