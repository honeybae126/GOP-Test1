import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DoctorPatientList } from '@/components/patients/doctor-patient-list'
import {
  MOCK_PATIENTS,
  MOCK_ENCOUNTERS,
  MOCK_COVERAGES,
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
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>
          {greeting()}, {session.user.name?.split(' ').slice(0, 2).join(' ') ?? 'Doctor'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Your current patient list. Initiate GOP requests directly from each patient card.
        </p>
      </div>
      <DoctorPatientList
        patients={MOCK_PATIENTS}
        encounters={MOCK_ENCOUNTERS}
        coverages={MOCK_COVERAGES}
      />
    </div>
  )
}
