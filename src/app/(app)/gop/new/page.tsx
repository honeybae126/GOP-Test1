import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { NewGOPWizard } from '@/components/gop/new-gop-wizard'
import { MOCK_PATIENTS, MOCK_COVERAGES, MOCK_ENCOUNTERS, MOCK_COST_ESTIMATES } from '@/lib/mock-data'

export default async function NewGOPPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (session.user?.role === 'FINANCE') redirect('/gop')

  const { patientId } = await searchParams

  return (
    <div className="p-[24px] max-w-[1200px]">
      <Card className="overflow-hidden">
        <NewGOPWizard
          patients={MOCK_PATIENTS}
          coverages={MOCK_COVERAGES}
          encounters={MOCK_ENCOUNTERS}
          estimates={MOCK_COST_ESTIMATES || []}
          preselectedPatientId={patientId}
        />
      </Card>
    </div>
  )
}
