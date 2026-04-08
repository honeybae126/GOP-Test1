'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGopStore } from '@/lib/gop-store'
import { PageHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { DoctorVerification } from '@/components/gop/doctor-verification'
import {
  getQuestionnaireById,
  getPatientById,
  getEncounterById,
  getCostEstimateByEncounterId,
  MOCK_PREFILL_RESPONSE,
} from '@/lib/mock-data'
import { ArrowLeft } from 'lucide-react'

export default function DoctorVerificationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))

  const role = session?.user?.role ?? ''

  // Insurance Staff don't have this feature — send them back silently
  useEffect(() => {
    if (role === 'INSURANCE_STAFF') router.replace(`/gop/${id}`)
  }, [role, id, router])

  if (role === 'INSURANCE_STAFF') return null

  if (!req) notFound()

  const questionnaire  = getQuestionnaireById(req.questionnaireId)
  const patient        = getPatientById(req.patientId)
  const encounter      = getEncounterById(req.encounterId)
  const estimate       = getCostEstimateByEncounterId(req.encounterId)
  const prefillAnswers = MOCK_PREFILL_RESPONSE[req.id] ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Physician Verification"
        description={`Review and verify the AI-prefilled clinical section for ${req.patientName}`}
      >
        <Link href={`/gop/${req.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3 mr-1" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <DoctorVerification
        request={req}
        questionnaire={questionnaire ?? null}
        patient={patient ?? null}
        encounter={encounter ?? null}
        estimate={estimate ?? null}
        prefillAnswers={prefillAnswers}
        doctorName={session?.user?.name ?? ''}
      />
    </div>
  )
}
