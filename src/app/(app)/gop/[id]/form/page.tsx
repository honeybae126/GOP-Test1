'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGopStore } from '@/lib/gop-store'
import { PageHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { QuestionnaireRenderer } from '@/components/gop/questionnaire-renderer'
import {
  getQuestionnaireById,
  getCostEstimateByEncounterId,
  getCoverageByPatientId,
  MOCK_PREFILL_RESPONSE,
} from '@/lib/mock-data'
import { ArrowLeft, FileDown } from 'lucide-react'

export default function GOPFormPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  const role = session?.user?.role ?? ''

  // Doctors don't have this feature — send them back silently
  useEffect(() => {
    if (role === 'DOCTOR') router.replace(`/gop/${id}`)
  }, [role, id, router])

  if (role === 'DOCTOR') return null

  if (!req) notFound()

  const questionnaire = getQuestionnaireById(req.questionnaireId)
  if (!questionnaire) notFound()

  const estimate       = getCostEstimateByEncounterId(req.encounterId)
  const coverage       = getCoverageByPatientId(req.patientId)
  const prefillAnswers = MOCK_PREFILL_RESPONSE[req.id] ?? []

  const prefillMap: Record<string, { value: string | boolean | number; aiPrefilled: boolean; humanVerified: boolean }> = {}
  prefillAnswers.forEach(a => {
    prefillMap[a.linkId] = { value: a.answer, aiPrefilled: a.aiPrefilled, humanVerified: a.humanVerified }
  })

  if (estimate) {
    prefillMap['total-estimate']  = { value: estimate.total,       aiPrefilled: false, humanVerified: true }
    prefillMap['total-cost']      = { value: estimate.total,       aiPrefilled: false, humanVerified: true }
    prefillMap['estimated-cost']  = { value: estimate.total,       aiPrefilled: false, humanVerified: true }
    prefillMap['copay-amount']    = { value: estimate.coPayAmount, aiPrefilled: false, humanVerified: true }
  }
  if (coverage) {
    prefillMap['policy-number']  = prefillMap['policy-number']  ?? { value: coverage.policyNumber,        aiPrefilled: false, humanVerified: true }
    prefillMap['membership-id']  = prefillMap['membership-id']  ?? { value: coverage.membershipId,        aiPrefilled: false, humanVerified: true }
    prefillMap['plan-name']      = { value: coverage.planName,       aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-start'] = { value: coverage.coverageDates.start, aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-end']   = { value: coverage.coverageDates.end,   aiPrefilled: false, humanVerified: true }
    prefillMap['policy-no']      = prefillMap['policy-no'] ?? { value: coverage.policyNumber, aiPrefilled: false, humanVerified: true }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={questionnaire.title}
        description={`GOP Request #${req.id} · ${req.patientName}`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/print/gop/${req.id}/form`, '_blank')}
          >
            <FileDown className="size-3 mr-1" />
            Print Form PDF
          </Button>
          <Link href={`/gop/${req.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-3 mr-1" />
              Back to Request
            </Button>
          </Link>
        </div>
      </PageHeader>

      <QuestionnaireRenderer
        questionnaire={questionnaire}
        prefillMap={prefillMap}
        gopStatus={req.status}
        hasAiPrefill={req.hasAiPrefill}
      />
    </div>
  )
}
