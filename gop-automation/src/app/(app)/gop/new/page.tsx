import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
import { NewGOPWizard } from '@/components/gop/new-gop-wizard'
import { MOCK_PATIENTS, MOCK_COVERAGES, MOCK_ENCOUNTERS, MOCK_COST_ESTIMATES } from '@/lib/mock-data'

export default async function NewGOPPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/signin')

  const { patientId } = await searchParams

  return (
    <div>
      <PageHeader
        title="New GOP Request"
        description="Create a new Guarantee of Payment pre-authorisation request."
      />
      <NewGOPWizard
        patients={MOCK_PATIENTS}
        coverages={MOCK_COVERAGES}
        encounters={MOCK_ENCOUNTERS}
        estimates={MOCK_COST_ESTIMATES}
        preselectedPatientId={patientId}
      />
    </div>
  )
}
