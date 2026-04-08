import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
import { PatientSearchList } from '@/components/patients/patient-search-list'
import { MOCK_PATIENTS, MOCK_COVERAGES } from '@/lib/mock-data'

export default async function PatientsPage() {
  const session = await auth()
  if (session?.user?.role === 'DOCTOR') redirect('/gop')

  return (
    <div>
      <PageHeader
        title="Patient Search"
        description="Search for patients and initiate GOP pre-authorisation requests."
      />
      <PatientSearchList patients={MOCK_PATIENTS} coverages={MOCK_COVERAGES} />
    </div>
  )
}
