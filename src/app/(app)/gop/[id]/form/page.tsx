'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGopStore } from '@/lib/gop-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionnaireRenderer } from '@/components/gop/questionnaire-renderer'
import {
  getQuestionnaireById,
  getCoverageByPatientId,
  MOCK_PREFILL_RESPONSE,
} from '@/lib/mock-data'
import { ArrowLeft, FileDown, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

export default function GOPFormPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req              = useGopStore((s) => s.requests.find((r) => r.id === id))
  const setCPI           = useGopStore((s) => s.setCPI)
  const setPricingType   = useGopStore((s) => s.setPricingType)
  const setMarketingPackage = useGopStore((s) => s.setMarketingPackage)

  const role     = session?.user?.role ?? ''
  const isStaff  = role === 'INSURANCE_STAFF' || role === 'IT_ADMIN'
  const canEdit  = isStaff && req?.status === 'DRAFT'

  // Local controlled state for pricing fields
  const [cpiInput, setCpiInput]           = useState<string>('')
  const [pricingType, setPricingTypeLocal] = useState<'NORMAL' | 'DIFFERENT'>('NORMAL')
  const [pricingUnit, setPricingUnit]      = useState<string>('')
  const [marketingPkg, setMarketingPkg]   = useState<string>('')
  const [pricingSaved, setPricingSaved]   = useState(false)

  // Sync state from req when it loads
  useEffect(() => {
    if (!req) return
    setCpiInput(String(req.cpi ?? 1))
    setPricingTypeLocal(req.pricingType ?? 'NORMAL')
    setPricingUnit(req.pricingUnit ?? '')
    setMarketingPkg(req.marketingPackage ?? '')
  }, [req?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect roles that shouldn't access this page
  useEffect(() => {
    if (role === 'DOCTOR' || role === 'FINANCE') router.replace(`/gop/${id}`)
  }, [role, id, router])

  // Redirect staff away from non-DRAFT requests (form editing only valid on DRAFT)
  useEffect(() => {
    if (req && req.status !== 'DRAFT' && (role === 'INSURANCE_STAFF' || role === 'IT_ADMIN')) {
      router.replace(`/gop/${id}`)
    }
  }, [req?.status, role, id, router])

  if (role === 'DOCTOR' || role === 'FINANCE') return null
  if (!req) notFound()

  const questionnaire = getQuestionnaireById(req.questionnaireId)
  if (!questionnaire) notFound()

  const coverage       = getCoverageByPatientId(req.patientId)
  const prefillAnswers = MOCK_PREFILL_RESPONSE[req.id] ?? []

  const prefillMap: Record<string, { value: string | boolean | number; aiPrefilled: boolean; humanVerified: boolean }> = {}
  prefillAnswers.forEach(a => {
    prefillMap[a.linkId] = { value: a.answer, aiPrefilled: a.aiPrefilled, humanVerified: a.humanVerified }
  })

  // Cost fields from req.lineItems (authoritative)
  if (req.lineItems?.length) {
    const lineTotal    = +req.lineItems.reduce((s, i) => s + i.netAmount, 0).toFixed(2)
    const coPayPercent = coverage?.coPayPercent ?? 0
    const coPayAmt     = +((lineTotal * coPayPercent) / 100).toFixed(2)
    prefillMap['total-estimate'] = { value: lineTotal, aiPrefilled: false, humanVerified: true }
    prefillMap['total-cost']     = { value: lineTotal, aiPrefilled: false, humanVerified: true }
    prefillMap['estimated-cost'] = { value: lineTotal, aiPrefilled: false, humanVerified: true }
    prefillMap['copay-amount']   = prefillMap['copay-amount'] ?? { value: coPayAmt, aiPrefilled: false, humanVerified: true }
  }

  if (coverage) {
    prefillMap['policy-number']  = prefillMap['policy-number']  ?? { value: coverage.policyNumber,        aiPrefilled: false, humanVerified: true }
    prefillMap['membership-id']  = prefillMap['membership-id']  ?? { value: coverage.membershipId,        aiPrefilled: false, humanVerified: true }
    prefillMap['plan-name']      = { value: coverage.planName,       aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-start'] = { value: coverage.coverageDates?.start ?? coverage.period?.start ?? '', aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-end']   = { value: coverage.coverageDates?.end   ?? coverage.period?.end   ?? '', aiPrefilled: false, humanVerified: true }
    prefillMap['policy-no']      = prefillMap['policy-no'] ?? { value: coverage.policyNumber, aiPrefilled: false, humanVerified: true }
  }

  const performer = { name: session?.user?.name ?? 'Staff', role }

  const handleSavePricing = () => {
    const cpiNum = parseFloat(cpiInput)
    if (isNaN(cpiNum) || cpiNum < 1 || cpiNum > 10) {
      toast.error('CPI must be a number between 1 and 10.')
      return
    }
    setCPI(req.id, cpiNum, performer)
    setPricingType(req.id, pricingType, pricingType === 'DIFFERENT' ? pricingUnit || null : null, performer)
    setMarketingPackage(req.id, marketingPkg.trim() || null, performer)
    setPricingSaved(true)
    setTimeout(() => setPricingSaved(false), 2000)
    toast.success('Pricing settings saved.')
  }

  return (
<div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">{questionnaire.title}</h1>
          <p className="text-body mt-1.5" style={{ color: '#6B7494' }}>
            GOP Request #{req.id} · {req.patientName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gray-700)' }}>Quote {req.quoteNumber}</span>
            {' · '}{req.quoteDate.split('-').reverse().join('/')}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.open(`/print/gop/${req.id}/form`, '_blank')}>
            <FileDown className="size-4" /> Print PDF
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gop/${req.id}`}><ArrowLeft className="size-4" /> Back</Link>
          </Button>
        </div>
      </div>

      {/* ── Pricing settings ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">Pricing Settings</CardTitle>
            {!canEdit && <Badge variant="secondary" className="text-xs ml-auto">Read-only</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* CPI */}
            <div className="space-y-1.5">
              <Label htmlFor="cpi" className="text-xs">
                CPI
                <span className="text-muted-foreground font-normal ml-1">(1 – 10)</span>
              </Label>
              {canEdit ? (
                <Input
                  id="cpi"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={cpiInput}
                  onChange={e => setCpiInput(e.target.value)}
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm font-semibold">{req.cpi ?? 1}</p>
              )}
            </div>

            {/* Pricing Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Pricing Type</Label>
              {canEdit ? (
                <div className="flex gap-3 pt-1">
                  {(['NORMAL', 'DIFFERENT'] as const).map(pt => (
                    <label key={pt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="pricingType"
                        value={pt}
                        checked={pricingType === pt}
                        onChange={() => setPricingTypeLocal(pt)}
                        className="size-3.5"
                      />
                      {pt === 'NORMAL' ? 'Normal' : 'Different'}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold">{req.pricingType ?? 'NORMAL'}</p>
              )}
            </div>

            {/* Pricing Unit — only when DIFFERENT */}
            {(pricingType === 'DIFFERENT' || req.pricingType === 'DIFFERENT') && (
              <div className="space-y-1.5">
                <Label htmlFor="pricingUnit" className="text-xs">Pricing Unit</Label>
                {canEdit ? (
                  <Input
                    id="pricingUnit"
                    value={pricingUnit}
                    onChange={e => setPricingUnit(e.target.value)}
                    placeholder="e.g. Per procedure"
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm font-semibold">{req.pricingUnit || '—'}</p>
                )}
              </div>
            )}
          </div>

          {/* Marketing Package */}
          <div className="space-y-1.5">
            <Label htmlFor="marketingPkg" className="text-xs">Marketing Package</Label>
            {canEdit ? (
              <Input
                id="marketingPkg"
                value={marketingPkg}
                onChange={e => setMarketingPkg(e.target.value)}
                placeholder="e.g. Laparoscopic Appendectomy Package"
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm font-semibold">{req.marketingPackage || '—'}</p>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSavePricing} variant={pricingSaved ? 'primary' : 'outline'} className="gap-1.5">
                {pricingSaved ? '✓ Saved' : 'Save Pricing'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <QuestionnaireRenderer
        questionnaire={questionnaire}
        prefillMap={prefillMap}
        gopStatus={req.status}
        hasAiPrefill={req.hasAiPrefill}
      />
    </div>
  )
}
