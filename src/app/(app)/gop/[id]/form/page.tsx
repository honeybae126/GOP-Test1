'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
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
import type { HisPatient, HisInsurance, HisAdmission, HisDiagnosis } from '@/lib/his'
import { ArrowLeft, FileDown, SlidersHorizontal, Search, Database } from 'lucide-react'
import { toast } from 'sonner'

// ─── HIS patient search + pre-fill types ─────────────────────────────────────

interface HisSearchResult { patientId: string; fullName: string; dob: string; nric: string }

interface HisData {
  patient:   HisPatient
  insurance: HisInsurance | null
  admission: HisAdmission | null
  diagnosis: HisDiagnosis[] | null
}

// Subtle "from patient record" badge rendered next to HIS-sourced field labels
function HisBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em',
      padding: '1px 6px', borderRadius: 9999,
      background: 'rgba(59,130,246,0.08)', color: '#1D4ED8',
      border: '1px solid rgba(59,130,246,0.2)',
      verticalAlign: 'middle', marginLeft: 6,
    }}>
      <Database style={{ width: 8, height: 8 }} />
      patient record
    </span>
  )
}

// Single editable HIS field with change-tracking for audit
function HisField({
  label, value, onChange, canEdit, originalValue,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  canEdit: boolean
  originalValue: string
}) {
  const changed = value !== originalValue
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center' }}>
        {label}
        <HisBadge />
        {changed && (
          <span style={{ marginLeft: 6, fontSize: '0.625rem', color: '#92400E', fontWeight: 600 }}>
            edited
          </span>
        )}
      </label>
      {canEdit ? (
        <input
          className="form-input"
          style={{ height: 32, fontSize: '0.875rem' }}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value || '—'}</p>
      )}
    </div>
  )
}

export default function GOPFormPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const req              = useGopStore((s) => s.requests.find((r) => r.id === id))
  const setCPI           = useGopStore((s) => s.setCPI)
  const setPricingType   = useGopStore((s) => s.setPricingType)
  const setMarketingPackage = useGopStore((s) => s.setMarketingPackage)

  const role     = useActiveRole()
  const isStaff  = role === 'INSURANCE_STAFF' || role === 'IT_ADMIN'
  const canEdit  = isStaff && req?.status === 'DRAFT'

  // ── HIS patient search state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('')
  const [searchResults, setSearchResults]   = useState<HisSearchResult[]>([])
  const [searchLoading, setSearchLoading]   = useState(false)
  const [searchOffline, setSearchOffline]   = useState(false)
  const [showDropdown, setShowDropdown]     = useState(false)
  const [hisData, setHisData]               = useState<HisData | null>(null)
  const [hisLoading, setHisLoading]         = useState(false)
  const searchRef                           = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced patient search — fires after 350ms idle
  const handleSearchInput = (q: string) => {
    setSearchQuery(q)
    setShowDropdown(true)
    if (searchRef.current) clearTimeout(searchRef.current)
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    searchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/his/patients?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.offline) { setSearchOffline(true); setSearchResults([]) }
        else { setSearchOffline(false); setSearchResults(Array.isArray(data) ? data : []) }
      } catch {
        setSearchOffline(true); setSearchResults([])
      } finally { setSearchLoading(false) }
    }, 350)
  }

  // Select a patient from the dropdown → fetch full HIS data
  const handleSelectPatient = async (result: HisSearchResult) => {
    setSearchQuery(result.fullName)
    setShowDropdown(false)
    setHisLoading(true)
    try {
      const res  = await fetch(`/api/his/patient?nric=${encodeURIComponent(result.nric)}`)
      const data = await res.json()
      if (data.found) {
        setHisData(data as HisData)
        // Initialise editable HIS fields from fetched data
        setHisFields({
          fullName:      data.patient?.fullName      ?? '',
          dob:           data.patient?.dob           ?? '',
          nric:          data.patient?.nric          ?? '',
          address:       data.patient?.address       ?? '',
          contactNumber: data.patient?.contactNumber ?? '',
          policyNumber:  data.insurance?.policyNumber ?? '',
          memberId:      data.insurance?.memberId    ?? '',
          admissionDate: data.admission?.admissionDate ?? '',
          roomType:      data.admission?.roomType    ?? '',
          diagnosisCode: data.diagnosis?.[0]?.diagnosisCode        ?? '',
          diagnosisDesc: data.diagnosis?.[0]?.diagnosisDescription ?? '',
        })
        setOriginalHisFields({
          fullName:      data.patient?.fullName      ?? '',
          dob:           data.patient?.dob           ?? '',
          nric:          data.patient?.nric          ?? '',
          address:       data.patient?.address       ?? '',
          contactNumber: data.patient?.contactNumber ?? '',
          policyNumber:  data.insurance?.policyNumber ?? '',
          memberId:      data.insurance?.memberId    ?? '',
          admissionDate: data.admission?.admissionDate ?? '',
          roomType:      data.admission?.roomType    ?? '',
          diagnosisCode: data.diagnosis?.[0]?.diagnosisCode        ?? '',
          diagnosisDesc: data.diagnosis?.[0]?.diagnosisDescription ?? '',
        })
        toast.success('Patient record loaded from HIS.')
      } else {
        toast.error('Patient not found in HIS.')
      }
    } catch {
      toast.error('Could not reach HIS. Please fill fields manually.')
    } finally { setHisLoading(false) }
  }

  // Editable HIS fields (staff can override before saving)
  type HisFieldKey = 'fullName'|'dob'|'nric'|'address'|'contactNumber'|'policyNumber'|'memberId'|'admissionDate'|'roomType'|'diagnosisCode'|'diagnosisDesc'
  const emptyFields: Record<HisFieldKey, string> = {
    fullName:'', dob:'', nric:'', address:'', contactNumber:'',
    policyNumber:'', memberId:'', admissionDate:'', roomType:'',
    diagnosisCode:'', diagnosisDesc:'',
  }
  const [hisFields, setHisFields]               = useState(emptyFields)
  const [originalHisFields, setOriginalHisFields] = useState(emptyFields)

  const setHisField = (key: HisFieldKey, val: string) => {
    setHisFields(prev => ({ ...prev, [key]: val }))
  }

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

  // Merge HIS-sourced fields into the questionnaire prefill map (editable values take precedence)
  if (hisData) {
    const his = hisFields
    if (his.fullName)      prefillMap['patient-name']      = { value: his.fullName,      aiPrefilled: false, humanVerified: true }
    if (his.dob)           prefillMap['patient-dob']        = { value: his.dob,           aiPrefilled: false, humanVerified: true }
    if (his.nric)          prefillMap['patient-nric']       = { value: his.nric,          aiPrefilled: false, humanVerified: true }
    if (his.address)       prefillMap['patient-address']    = { value: his.address,       aiPrefilled: false, humanVerified: true }
    if (his.contactNumber) prefillMap['patient-contact']    = { value: his.contactNumber, aiPrefilled: false, humanVerified: true }
    if (his.policyNumber)  prefillMap['policy-number']      = { value: his.policyNumber,  aiPrefilled: false, humanVerified: true }
    if (his.policyNumber)  prefillMap['policy-no']          = { value: his.policyNumber,  aiPrefilled: false, humanVerified: true }
    if (his.memberId)      prefillMap['membership-id']      = { value: his.memberId,      aiPrefilled: false, humanVerified: true }
    if (his.admissionDate) prefillMap['admission-date']     = { value: his.admissionDate, aiPrefilled: false, humanVerified: true }
    if (his.roomType)      prefillMap['room-type']          = { value: his.roomType,      aiPrefilled: false, humanVerified: true }
    if (his.diagnosisCode) prefillMap['diagnosis-code']     = { value: his.diagnosisCode, aiPrefilled: false, humanVerified: true }
    if (his.diagnosisDesc) prefillMap['diagnosis-description'] = { value: his.diagnosisDesc, aiPrefilled: false, humanVerified: true }
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

      {/* ── HIS Patient Search (Task 5) ────────────────────────── */}
      {isStaff && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Look Up Patient in HIS</CardTitle>
              {searchOffline && (
                <Badge variant="secondary" className="text-xs ml-auto" style={{ color: '#92400E', background: '#FEF3C7' }}>
                  HIS offline — manual entry only
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ position: 'relative', maxWidth: 420 }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--muted-foreground)', fontSize: '0.8125rem', pointerEvents: 'none',
                }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 36, height: 38 }}
                  placeholder="Type NRIC or patient name…"
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                />
                {searchLoading && (
                  <i className="fas fa-spinner fa-spin" style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--muted-foreground)', fontSize: '0.8125rem',
                  }} />
                )}
              </div>

              {/* Search dropdown */}
              {showDropdown && (searchResults.length > 0 || searchOffline) && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                }}>
                  {searchOffline && (
                    <div style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                      <i className="fas fa-exclamation-triangle" style={{ marginRight: 6, color: '#D97706' }} />
                      HIS is currently unreachable. Enter patient details manually.
                    </div>
                  )}
                  {searchResults.map(r => (
                    <button
                      key={r.patientId}
                      type="button"
                      onMouseDown={() => handleSelectPatient(r)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.625rem 1rem', background: 'none', border: 'none',
                        cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                        fontSize: '0.875rem',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontWeight: 600 }}>{r.fullName}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                        {r.nric}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        DOB: {r.dob}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hisLoading && (
              <p style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />
                Loading patient record from HIS…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── HIS Pre-populated Fields (Task 3) ──────────────────── */}
      {hisData && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="size-4" style={{ color: '#1D4ED8' }} />
              <CardTitle className="text-sm">Patient Record — from HIS</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto" style={{ background: 'rgba(59,130,246,0.08)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.2)' }}>
                Editable — changes are saved with the form
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <HisField label="Full Name"       value={hisFields.fullName}      onChange={v => setHisField('fullName', v)}      canEdit={canEdit} originalValue={originalHisFields.fullName} />
              <HisField label="Date of Birth"   value={hisFields.dob}           onChange={v => setHisField('dob', v)}           canEdit={canEdit} originalValue={originalHisFields.dob} />
              <HisField label="NRIC"            value={hisFields.nric}          onChange={v => setHisField('nric', v)}          canEdit={canEdit} originalValue={originalHisFields.nric} />
              <HisField label="Contact Number"  value={hisFields.contactNumber} onChange={v => setHisField('contactNumber', v)} canEdit={canEdit} originalValue={originalHisFields.contactNumber} />
              <HisField label="Address"         value={hisFields.address}       onChange={v => setHisField('address', v)}       canEdit={canEdit} originalValue={originalHisFields.address} />
              {hisData.insurance && <>
                <HisField label="Policy Number"  value={hisFields.policyNumber}  onChange={v => setHisField('policyNumber', v)}  canEdit={canEdit} originalValue={originalHisFields.policyNumber} />
                <HisField label="Member ID"      value={hisFields.memberId}      onChange={v => setHisField('memberId', v)}      canEdit={canEdit} originalValue={originalHisFields.memberId} />
              </>}
              {hisData.admission && <>
                <HisField label="Admission Date"  value={hisFields.admissionDate} onChange={v => setHisField('admissionDate', v)} canEdit={canEdit} originalValue={originalHisFields.admissionDate} />
                <HisField label="Room Type"       value={hisFields.roomType}      onChange={v => setHisField('roomType', v)}      canEdit={canEdit} originalValue={originalHisFields.roomType} />
              </>}
              {hisData.diagnosis?.[0] && <>
                <HisField label="Diagnosis Code"  value={hisFields.diagnosisCode} onChange={v => setHisField('diagnosisCode', v)} canEdit={canEdit} originalValue={originalHisFields.diagnosisCode} />
                <HisField label="Diagnosis"       value={hisFields.diagnosisDesc} onChange={v => setHisField('diagnosisDesc', v)} canEdit={canEdit} originalValue={originalHisFields.diagnosisDesc} />
              </>}
            </div>
            {canEdit && Object.keys(hisFields).some(k => hisFields[k as HisFieldKey] !== originalHisFields[k as HisFieldKey]) && (
              <p style={{ marginTop: 12, fontSize: '0.75rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-pencil-alt" style={{ fontSize: '0.625rem' }} />
                You have edited HIS-sourced fields. Changes will be logged when the form is saved.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
