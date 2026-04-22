'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import { useGopStore } from '@/lib/gop-store'
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

  const role = useActiveRole()

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
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1">Physician Verification</h1>
          <p className="text-body mt-1.5" >
            Review and verify the AI-prefilled clinical section for {req.patientName}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/gop/${req.id}`}><ArrowLeft className="size-4" /> Back</Link>
        </Button>
      </div>

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
