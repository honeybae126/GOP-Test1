import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
import { DoctorPatientList } from '@/components/patients/doctor-patient-list'
import {
  MOCK_PATIENTS,
  MOCK_ENCOUNTERS,
  MOCK_COVERAGES,
  MOCK_GOP_REQUESTS,
} from '@/lib/mock-data'

export default async function DoctorDashboardPage() {
  const session = await auth()
  if (!session || session.user?.role !== 'DOCTOR') redirect('/')

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${session.user.name?.split(' ').slice(0, 2).join(' ') ?? 'Doctor'}`}
        description="Your current patient list. Initiate GOP requests directly from each patient card."
      />
      <DoctorPatientList
        patients={MOCK_PATIENTS}
        encounters={MOCK_ENCOUNTERS}
        coverages={MOCK_COVERAGES}
        gopRequests={MOCK_GOP_REQUESTS}
      />
    </div>
  )
}
