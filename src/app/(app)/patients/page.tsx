import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PatientSearchList } from '@/components/patients/patient-search-list'
import { MOCK_PATIENTS, MOCK_COVERAGES } from '@/lib/mock-data'

export default async function PatientsPage() {
  const session = await auth()
  if (session?.user?.role === 'DOCTOR') redirect('/gop')
  if (session?.user?.role === 'FINANCE') redirect('/gop')

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Patient Search</h1>
          <p className="header-subtitle">Search for patients and initiate GOP pre-authorisation requests.</p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)' }}>
        <PatientSearchList patients={MOCK_PATIENTS} coverages={MOCK_COVERAGES} />
      </div>
    </div>
  )
}
