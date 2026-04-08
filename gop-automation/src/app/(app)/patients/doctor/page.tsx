import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
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
    <div className="space-y-6">
      <PageHeader
        title="Patient Search"
        description="Search and filter patients by ward, admission date, or assigned physician."
      />
      <DoctorPatientSearch
        patients={MOCK_PATIENTS}
        encounters={MOCK_ENCOUNTERS}
        coverages={MOCK_COVERAGES}
        gopRequests={MOCK_GOP_REQUESTS}
      />
    </div>
  )
}
