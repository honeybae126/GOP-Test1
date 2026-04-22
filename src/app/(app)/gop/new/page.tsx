import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">New GOP Request</h1>
          <p className="text-body mt-1.5">
            Create a new pre-authorisation request
            {patientId && ' for pre-selected patient'}
          </p>
        </div>
      </div>

      {/* Wizard card */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        <NewGOPWizard
          patients={MOCK_PATIENTS}
          coverages={MOCK_COVERAGES}
          encounters={MOCK_ENCOUNTERS}
          estimates={MOCK_COST_ESTIMATES || []}
          preselectedPatientId={patientId}
        />
      </div>
    </div>
  )
}
