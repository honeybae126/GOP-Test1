'use client'

/**
 * Billing / Quotation form — GOP System design language.
 * Tailwind classes from tailwind.config.ts only; no inline styles.
 *
 * Sub-components (all new, defined in this file):
 *   FieldRow   — label + input row with configurable label width
 *   GOPSelect  — styled <select> with chevron overlay
 *   StatusBadge — pill badge for quote status
 *
 * All HIS query column names are marked ⚠ ASSUMPTION.
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, Plus, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Opt        { id: string; name: string }
interface HisDoctor  { id: string; name: string; specialty: string | null }
interface HisProc    { code: string; name: string }
interface HisDiag    { code: string; description: string }
interface PriceItem  { code: string; description: string; unitPrice: number; type: string | null; department: string | null }
interface CpiResult  { patientId: string; fullName: string; dob: string; nric: string }

interface QuoteRow {
  _k: string
  department: string; type: string; code: string; description: string
  unit: number; price: number; amount: number; discount: number; netAmount: number
}

// ─── Shared Tailwind class strings ───────────────────────────────────────────
const INPUT  = 'w-full h-9 px-3 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white transition-colors'
const INPUT_RO = 'w-full h-9 px-3 text-sm text-gray-800 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed'
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 h-9 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_OUTLINE = 'inline-flex items-center gap-2 px-3 h-8 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50'
const BTN_GHOST   = 'inline-flex items-center gap-2 px-3 h-9 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
const TH = 'text-xs font-semibold text-gray-500 uppercase tracking-wide text-left pb-3 px-3 whitespace-nowrap'
const TD = 'text-sm text-gray-800 py-3 px-3'

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * FieldRow — label aligned right + flex content (input/select/etc.)
 * labelW: Tailwind width class for the label, e.g. 'w-36'
 */
function FieldRow({
  label, labelW = 'w-36', children,
}: { label: string; labelW?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-h-[36px]">
      <span className={`text-sm font-medium text-gray-600 shrink-0 text-right ${labelW}`}>
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

/**
 * GOPSelect — <select> with Tailwind styling and chevron overlay.
 * Reuses no existing UI component (existing Select uses Radix/custom CSS).
 */
function GOPSelect({
  value, onChange, options, placeholder = '', loading = false, disabled = false,
}: {
  value: string
  onChange: (id: string, name: string) => void
  options: Opt[]
  placeholder?: string
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <div className="relative w-full">
      <select
        className={`${INPUT} appearance-none pr-8 ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
        value={value}
        disabled={disabled || loading}
        onChange={e => {
          const o = options.find(x => x.id === e.target.value)
          onChange(e.target.value, o?.name ?? '')
        }}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {!loading && options.length === 0 && (
          <option disabled value="">No items found</option>
        )}
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  )
}

/** StatusBadge — pill with colour per quote status */
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'DRAFT'       ? 'bg-gray-100 text-gray-600' :
    status === 'FINALISED'   ? 'bg-primary-50 text-primary-700' :
    status === 'GOP_CREATED' ? 'bg-success-50 text-success-700' :
                               'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BillingForm() {
  const { data: session } = useSession()
  const router = useRouter()

  // ── Quote metadata
  const [quoteId,   setQuoteId]   = useState<string | null>(null)
  const [quoteNum,  setQuoteNum]  = useState('')
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quoteStat, setQuoteStat] = useState<'DRAFT'|'FINALISED'|'GOP_CREATED'>('DRAFT')

  // ── Patient fields
  const [cpiRaw,   setCpiRaw]   = useState('')
  const [cpiId,    setCpiId]    = useState('')
  const [patName,  setPatName]  = useState('')
  const [dob,      setDob]      = useState('')
  const [gender,   setGender]   = useState('')
  const [phone,    setPhone]    = useState('')

  // ── Clinical fields
  const [deptId,     setDeptId]     = useState('')
  const [deptName,   setDeptName]   = useState('')
  const [doctorId,   setDoctorId]   = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [los,        setLos]        = useState('')
  const [procCode,   setProcCode]   = useState('')
  const [procName,   setProcName]   = useState('')
  const [diagCode,   setDiagCode]   = useState('')
  const [diagDesc,   setDiagDesc]   = useState('')
  const [diagInput,  setDiagInput]  = useState('')
  const [diagDrop,   setDiagDrop]   = useState<HisDiag[]>([])
  const [showDiag,   setShowDiag]   = useState(false)
  const [provDiag,   setProvDiag]   = useState('')
  const [orderSetId, setOrderSetId] = useState('')
  const [orderSetNm, setOrderSetNm] = useState('')

  // ── Pricing / insurance fields
  const [normalPricing, setNormalPricing] = useState(true)
  const [diffPricingId, setDiffPricingId] = useState('')
  const [employerId,    setEmployerId]    = useState('')
  const [employerNm,    setEmployerNm]    = useState('')
  const [discPkgId,     setDiscPkgId]     = useState('')
  const [discPkgNm,     setDiscPkgNm]     = useState('')
  const [insId,         setInsId]         = useState('')
  const [insName,       setInsName]       = useState('')
  const [mktPkgId,      setMktPkgId]      = useState('')
  const [mktPkgNm,      setMktPkgNm]      = useState('')

  // ── HIS dropdown data
  const [depts,     setDepts]     = useState<Opt[]>([])
  const [doctors,   setDoctors]   = useState<HisDoctor[]>([])
  const [procs,     setProcs]     = useState<HisProc[]>([])
  const [orderSets, setOrderSets] = useState<Opt[]>([])
  const [employers, setEmployers] = useState<Opt[]>([])
  const [insurers,  setInsurers]  = useState<Opt[]>([])
  const [discPkgs,  setDiscPkgs]  = useState<Opt[]>([])
  const [mktPkgs,   setMktPkgs]   = useState<Opt[]>([])
  const [dropLoading, setDropLoading] = useState(true)

  // ── CPI search
  const [cpiResults, setCpiResults] = useState<CpiResult[]>([])
  const [showCpi,    setShowCpi]    = useState(false)
  const [cpiLoading, setCpiLoading] = useState(false)
  const cpiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Quote items
  const [rows,    setRows]  = useState<QuoteRow[]>([])
  const keyRef   = useRef(0)
  const totalNet = rows.reduce((s, r) => s + r.netAmount, 0)

  // ── Bottom list
  const [listFrom,    setListFrom]    = useState(() => new Date().toISOString().slice(0, 10))
  const [listTo,      setListTo]      = useState(() => new Date().toISOString().slice(0, 10))
  const [listRows,    setListRows]    = useState<Record<string, string>[]>([])
  const [listCount,   setListCount]   = useState(0)
  const [listLoading, setListLoading] = useState(false)

  // ── Op states
  const [applying, setApplying] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [gopBusy,  setGopBusy]  = useState(false)

  const readOnly      = quoteStat !== 'DRAFT'
  const age           = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : ''
  const isGopEligible = ['AIA','ASSURNET'].some(n => insName.toUpperCase().includes(n))
  const userName      = session?.user?.name ?? session?.user?.email ?? ''

  // ── HIS fetch with 5 s timeout
  const hisFetch = useCallback(async (url: string): Promise<unknown[] | null> => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      const d = await r.json()
      if (d.offline) return null
      return Array.isArray(d) ? d : (d.results ?? [])
    } catch { return null }
    finally { clearTimeout(t) }
  }, [])

  // ── Load static dropdowns on mount
  useEffect(() => {
    const load = async () => {
      setDropLoading(true)
      const [dp, dc, os, em, ins, disc, mkt] = await Promise.all([
        hisFetch('/api/his/departments'),
        hisFetch('/api/his/doctors'),
        hisFetch('/api/his/doctor-order-sets'),
        hisFetch('/api/his/employers'),
        hisFetch('/api/his/insurers'),
        hisFetch('/api/his/discount-packages'),
        hisFetch('/api/his/marketing-packages'),
      ])
      if (dp)   setDepts(dp as Opt[])
      if (dc)   setDoctors(dc as HisDoctor[])
      if (os)   setOrderSets(os as Opt[])
      if (em)   setEmployers(em as Opt[])
      if (ins)  setInsurers(ins as Opt[])
      if (disc) setDiscPkgs(disc as Opt[])
      if (mkt)  setMktPkgs(mkt as Opt[])
      setDropLoading(false)
    }
    load()
  }, [hisFetch])

  // ── Reload procedures when dept changes
  useEffect(() => {
    if (!deptId) { setProcs([]); return }
    hisFetch(`/api/his/procedures?department=${encodeURIComponent(deptId)}`)
      .then(r => { if (r) setProcs(r as HisProc[]) })
  }, [deptId, hisFetch])

  // ── CPI debounced search
  const handleCpiSearch = useCallback((q: string) => {
    setCpiRaw(q)
    setShowCpi(true)
    if (cpiTimer.current) clearTimeout(cpiTimer.current)
    if (q.length < 2) { setCpiResults([]); return }
    setCpiLoading(true)
    cpiTimer.current = setTimeout(async () => {
      const ctrl = new AbortController()
      setTimeout(() => ctrl.abort(), 5000)
      try {
        const r = await fetch(`/api/his/patients?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        const d = await r.json()
        setCpiResults(Array.isArray(d) ? d : (d.results ?? []))
      } catch { setCpiResults([]) }
      finally { setCpiLoading(false) }
    }, 350)
  }, [])

  const handleCpiSelect = async (pt: CpiResult) => {
    setCpiRaw(pt.fullName); setCpiId(pt.patientId)
    setPatName(pt.fullName); setDob(pt.dob); setShowCpi(false)
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 5000)
    try {
      const r = await fetch(`/api/his/patient?nric=${encodeURIComponent(pt.nric)}`, { signal: ctrl.signal })
      const d = await r.json()
      if (d.found) {
        if (d.patient?.contactNumber) setPhone(d.patient.contactNumber)
        if (d.patient?.gender) setGender(d.patient.gender)
        if (d.insurance?.insurerCode) {
          const m = insurers.find(i => i.name.toUpperCase().includes(d.insurance.insurerCode.toUpperCase()))
          if (m) { setInsId(m.id); setInsName(m.name) }
        }
      }
    } catch { /* silent */ }
  }

  // ── Diagnosis type-ahead
  useEffect(() => {
    if (diagInput.length < 2) { setDiagDrop([]); return }
    const t = setTimeout(async () => {
      const ctrl = new AbortController()
      setTimeout(() => ctrl.abort(), 5000)
      try {
        const r = await fetch(`/api/his/diagnosis?q=${encodeURIComponent(diagInput)}`, { signal: ctrl.signal })
        const d = await r.json()
        setDiagDrop(Array.isArray(d) ? d : (d.results ?? []))
      } catch { setDiagDrop([]) }
    }, 350)
    return () => clearTimeout(t)
  }, [diagInput])

  // ── Apply — load pricing from HIS
  const handleApply = async () => {
    setApplying(true)
    try {
      const p = new URLSearchParams({
        type: normalPricing ? 'normal' : 'different',
        ...(insId    ? { insurerId: insId }       : {}),
        ...(procCode ? { procedureCode: procCode } : {}),
        ...(deptId   ? { deptId }                  : {}),
      })
      const r = await fetch(`/api/his/pricing?${p}`)
      const d = await r.json()
      if (d.offline) { toast.error('HIS offline — enter items manually.'); return }
      const items: PriceItem[] = Array.isArray(d) ? d : []
      if (!items.length) { toast('No pricing items found for selected criteria.'); return }
      const newRows: QuoteRow[] = items.map(it => ({
        _k: String(++keyRef.current),
        department: it.department ?? deptName,
        type: it.type ?? '', code: it.code, description: it.description,
        unit: 1, price: it.unitPrice, amount: it.unitPrice, discount: 0, netAmount: it.unitPrice,
      }))
      setRows(prev => [...prev, ...newRows])
      toast.success(`${newRows.length} item${newRows.length !== 1 ? 's' : ''} loaded.`)
      await doSave([...rows, ...newRows])
    } catch { toast.error('Failed to load pricing from HIS.') }
    finally { setApplying(false) }
  }

  // ── Row field edit (unit / discount)
  const updateRow = (k: string, field: 'unit'|'discount', raw: string) => {
    const v = Math.max(0, parseFloat(raw) || 0)
    setRows(prev => prev.map(r => {
      if (r._k !== k) return r
      const unit     = field === 'unit'     ? Math.max(1, v) : r.unit
      const discount = field === 'discount' ? v              : r.discount
      const amount   = unit * r.price
      return { ...r, unit, discount, amount, netAmount: Math.max(0, amount - discount) }
    }))
  }

  // ── Save (create or update)
  const buildBody = (itemOverride?: QuoteRow[]) => ({
    cpiId, patientName: patName,
    dob: dob || null, gender: gender || null, phoneNumber: phone || null,
    departmentId: deptId || null, departmentName: deptName || null,
    attendingDoctorId: doctorId || null, attendingDoctorName: doctorName || null,
    lengthOfStay: los ? parseInt(los) : null,
    procedureCode: procCode || null, procedureName: procName || null,
    diagnosisCode: diagCode || null, diagnosisDescription: diagDesc || null,
    provisionalDiagnosis: provDiag || null,
    doctorOrderSetId: orderSetId || null, doctorOrderSetName: orderSetNm || null,
    pricingType: normalPricing ? 'NORMAL' : 'DIFFERENT',
    differentPricingId: diffPricingId || null,
    employerId: employerId || null, employerName: employerNm || null,
    insurerId: insId, insurerName: insName,
    discountPackageId: discPkgId || null, discountPackageName: discPkgNm || null,
    marketingPackageId: mktPkgId || null, marketingPackageName: mktPkgNm || null,
    quoteDate, totalNetAmount: (itemOverride ?? rows).reduce((s, r) => s + r.netAmount, 0),
    items: (itemOverride ?? rows).map(({ _k, ...rest }) => rest),
  })

  const doSave = async (itemOverride?: QuoteRow[]) => {
    setSaving(true)
    try {
      const body = buildBody(itemOverride)
      if (quoteId) {
        await fetch(`/api/billing/quotes/${quoteId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const r = await fetch('/api/billing/quotes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setQuoteId(d.id); setQuoteNum(d.quoteNumber)
        toast.success(`Quote ${d.quoteNumber} created.`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.')
    } finally { setSaving(false) }
  }

  // ── Create GOP from quote
  const handleCreateGop = async () => {
    if (!quoteId) await doSave()
    if (!quoteId) { toast.error('Could not save quote first.'); return }
    setGopBusy(true)
    try {
      const r = await fetch(`/api/billing/quotes/${quoteId}/create-gop`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuoteStat('GOP_CREATED')
      toast.success('GOP request created — opening form…')
      router.push(`/gop/${d.gopRequestId}/form`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed.') }
    finally { setGopBusy(false) }
  }

  // ── Load quote history (bottom panel)
  const handleFilter = useCallback(async () => {
    setListLoading(true)
    try {
      const p = new URLSearchParams({ dateFrom: listFrom, dateTo: listTo })
      const r = await fetch(`/api/billing/quotes?${p}`)
      const d = await r.json()
      const arr = Array.isArray(d) ? d : []
      setListRows(arr); setListCount(arr.length)
    } catch { toast.error('Could not load quotes.') }
    finally { setListLoading(false) }
  }, [listFrom, listTo])

  useEffect(() => { handleFilter() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open quote from list
  const handleOpenQuote = async (id: string) => {
    try {
      const r = await fetch(`/api/billing/quotes/${id}`)
      const d = await r.json()
      setQuoteId(d.id); setQuoteNum(d.quoteNumber ?? '')
      setQuoteStat(d.status ?? 'DRAFT')
      setQuoteDate(d.quoteDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
      setCpiId(d.cpiId ?? ''); setCpiRaw(d.patientName ?? '')
      setPatName(d.patientName ?? ''); setDob(d.dob?.slice(0, 10) ?? '')
      setGender(d.gender ?? ''); setPhone(d.phoneNumber ?? '')
      setDeptId(d.departmentId ?? ''); setDeptName(d.departmentName ?? '')
      setDoctorId(d.attendingDoctorId ?? ''); setDoctorName(d.attendingDoctorName ?? '')
      setLos(d.lengthOfStay != null ? String(d.lengthOfStay) : '')
      setProcCode(d.procedureCode ?? ''); setProcName(d.procedureName ?? '')
      setDiagCode(d.diagnosisCode ?? ''); setDiagDesc(d.diagnosisDescription ?? '')
      setDiagInput(d.diagnosisCode ? `${d.diagnosisCode} — ${d.diagnosisDescription}` : '')
      setProvDiag(d.provisionalDiagnosis ?? '')
      setOrderSetId(d.doctorOrderSetId ?? ''); setOrderSetNm(d.doctorOrderSetName ?? '')
      setNormalPricing(d.pricingType !== 'DIFFERENT')
      setDiffPricingId(d.differentPricingId ?? '')
      setEmployerId(d.employerId ?? ''); setEmployerNm(d.employerName ?? '')
      setInsId(d.insurerId ?? ''); setInsName(d.insurerName ?? '')
      setDiscPkgId(d.discountPackageId ?? ''); setDiscPkgNm(d.discountPackageName ?? '')
      setMktPkgId(d.marketingPackageId ?? ''); setMktPkgNm(d.marketingPackageName ?? '')
      setRows((d.items ?? []).map((it: Record<string, unknown>, i: number) => ({
        _k: String(++keyRef.current + i),
        department: it.department ?? '', type: it.type ?? '', code: it.code ?? '',
        description: it.description ?? '', unit: Number(it.unit ?? 1),
        price: Number(it.price ?? 0), amount: Number(it.amount ?? 0),
        discount: Number(it.discount ?? 0), netAmount: Number(it.netAmount ?? 0),
      })))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { toast.error('Failed to load quote.') }
  }

  // ── Reset form
  const resetForm = () => {
    setQuoteId(null); setQuoteNum(''); setQuoteStat('DRAFT')
    setQuoteDate(new Date().toISOString().slice(0, 10))
    setCpiRaw(''); setCpiId(''); setPatName(''); setDob(''); setGender(''); setPhone('')
    setDeptId(''); setDeptName(''); setDoctorId(''); setDoctorName('')
    setLos(''); setProcCode(''); setProcName(''); setDiagCode(''); setDiagDesc(''); setDiagInput('')
    setProvDiag(''); setOrderSetId(''); setOrderSetNm('')
    setNormalPricing(true); setDiffPricingId(''); setEmployerId(''); setEmployerNm('')
    setInsId(''); setInsName(''); setDiscPkgId(''); setDiscPkgNm(''); setMktPkgId(''); setMktPkgNm('')
    setRows([])
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 font-sans">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Billing / Quotation</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage patient billing quotes</p>
          </div>
          {/* Active quote badge */}
          {quoteNum && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Active quote:</span>
              <span className="text-sm font-semibold text-primary-600 font-mono">{quoteNum}</span>
              <StatusBadge status={quoteStat} />
            </div>
          )}
        </div>
        <div className="border-b border-gray-200 mt-4" />
      </div>

      {/* ── Card 1: CPI Search ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600 shrink-0 w-8">CPI:</label>
          <div className="relative flex-1 max-w-md">
            <input
              className={`${INPUT} pr-10`}
              value={cpiRaw}
              onChange={e => handleCpiSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCpiSearch(cpiRaw)}
              onFocus={() => cpiResults.length && setShowCpi(true)}
              onBlur={() => setTimeout(() => setShowCpi(false), 200)}
              placeholder="Enter CPI number or patient name…"
              disabled={readOnly}
            />
            <button
              onClick={() => handleCpiSearch(cpiRaw)}
              disabled={readOnly}
              className="absolute right-0 inset-y-0 px-3 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-r-lg transition-colors disabled:opacity-50"
            >
              {cpiLoading
                ? <span className="text-xs">…</span>
                : <Search className="h-4 w-4" />
              }
            </button>
            {/* CPI dropdown */}
            {showCpi && cpiResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                {cpiResults.map(p => (
                  <div
                    key={p.patientId}
                    onMouseDown={() => handleCpiSelect(p)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-gray-800">{p.fullName}</span>
                    <span className="text-xs text-gray-400 font-mono">{p.nric}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* New / save actions next to CPI */}
          <div className="flex items-center gap-2 ml-auto">
            {!readOnly && (
              <>
                <button onClick={resetForm} className={BTN_GHOST}>
                  New Quote
                </button>
                <button onClick={() => doSave()} disabled={saving} className={BTN_GHOST}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
              </>
            )}
            {readOnly && (
              <button onClick={resetForm} className={BTN_GHOST}>New Quote</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Card 2: Form fields (3-column) ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient &amp; Quote Details</h2>

        <div className="grid grid-cols-3 gap-x-8">

          {/* ── LEFT COLUMN: Patient Information ── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Patient</p>

            <FieldRow label="Patient Name:">
              <input className={readOnly ? INPUT_RO : INPUT} value={patName} onChange={e => setPatName(e.target.value)} readOnly={readOnly} />
            </FieldRow>
            <FieldRow label="DOB:">
              <input type="date" className={readOnly ? INPUT_RO : INPUT} value={dob} onChange={e => setDob(e.target.value)} readOnly={readOnly} />
            </FieldRow>
            <FieldRow label="Gender:">
              {readOnly
                ? <input className={INPUT_RO} value={gender} readOnly />
                : <div className="relative w-full">
                    <select className={`${INPUT} appearance-none pr-8`} value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="" />
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
              }
            </FieldRow>
            <FieldRow label="Age:">
              <input className={INPUT_RO} value={age !== '' ? `${age} yrs` : ''} readOnly />
            </FieldRow>
            <FieldRow label="Phone No.:">
              <input className={readOnly ? INPUT_RO : INPUT} value={phone} onChange={e => setPhone(e.target.value)} readOnly={readOnly} />
            </FieldRow>
            <FieldRow label="Department:">
              {readOnly
                ? <input className={INPUT_RO} value={deptName} readOnly />
                : <GOPSelect value={deptId} options={depts} loading={dropLoading}
                    onChange={(id, nm) => { setDeptId(id); setDeptName(nm) }} />
              }
            </FieldRow>
          </div>

          {/* ── MIDDLE COLUMN: Clinical Details ── */}
          <div className="flex flex-col gap-3 border-l border-gray-100 pl-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Clinical</p>

            <FieldRow label="Attending Doctor:" labelW="w-40">
              {readOnly
                ? <input className={INPUT_RO} value={doctorName} readOnly />
                : <GOPSelect value={doctorId}
                    options={doctors.map(d => ({ id: d.id, name: d.specialty ? `${d.name} (${d.specialty})` : d.name }))}
                    loading={dropLoading}
                    onChange={(id) => {
                      const d = doctors.find(x => x.id === id)
                      setDoctorId(id); setDoctorName(d?.name ?? '')
                    }} />
              }
            </FieldRow>
            <FieldRow label="Length of Stay:" labelW="w-40">
              <input type="number" min={0} className={readOnly ? INPUT_RO : INPUT} value={los} onChange={e => setLos(e.target.value)} readOnly={readOnly} placeholder="Days" />
            </FieldRow>
            <FieldRow label="Procedure:" labelW="w-40">
              {readOnly
                ? <input className={INPUT_RO} value={procName} readOnly />
                : <GOPSelect value={procCode}
                    options={procs.map(p => ({ id: p.code, name: p.name }))}
                    placeholder={deptId ? 'Select procedure…' : 'Select department first'}
                    onChange={(id, nm) => { setProcCode(id); setProcName(nm) }} />
              }
            </FieldRow>
            {/* Diagnosis — type-ahead */}
            <FieldRow label="Diagnosis:" labelW="w-40">
              <div className="relative w-full">
                <input
                  className={readOnly ? INPUT_RO : INPUT}
                  value={diagInput || (diagCode ? `${diagCode} — ${diagDesc}` : '')}
                  onChange={e => { setDiagInput(e.target.value); setShowDiag(true) }}
                  onFocus={() => setShowDiag(true)}
                  onBlur={() => setTimeout(() => setShowDiag(false), 200)}
                  placeholder="ICD-10 code or description…"
                  readOnly={readOnly}
                />
                {showDiag && diagDrop.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-md overflow-auto max-h-48">
                    {diagDrop.map(d => (
                      <div
                        key={d.code}
                        onMouseDown={() => { setDiagCode(d.code); setDiagDesc(d.description); setDiagInput(''); setShowDiag(false) }}
                        className="flex items-baseline gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-xs font-mono text-primary-600 shrink-0">{d.code}</span>
                        <span className="text-sm text-gray-700 truncate">{d.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FieldRow>
            <FieldRow label="Provisional Diag.:" labelW="w-40">
              <input className={readOnly ? INPUT_RO : INPUT} value={provDiag} onChange={e => setProvDiag(e.target.value)} readOnly={readOnly} />
            </FieldRow>
            <FieldRow label="Doctor Order Set:" labelW="w-40">
              {readOnly
                ? <input className={INPUT_RO} value={orderSetNm} readOnly />
                : <GOPSelect value={orderSetId} options={orderSets} loading={dropLoading}
                    onChange={(id, nm) => { setOrderSetId(id); setOrderSetNm(nm) }} />
              }
            </FieldRow>
          </div>

          {/* ── RIGHT COLUMN: Pricing + Quote meta (2 sub-columns) ── */}
          <div className="border-l border-gray-100 pl-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pricing &amp; Quote</p>

            <div className="grid grid-cols-2 gap-x-6">

              {/* Pricing sub-column */}
              <div className="flex flex-col gap-3">
                {/* Normal Pricing checkbox */}
                <div className="flex items-center gap-2 min-h-[36px]">
                  <input
                    type="checkbox"
                    id="normalPricing"
                    checked={normalPricing}
                    onChange={e => setNormalPricing(e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label htmlFor="normalPricing" className="text-sm font-medium text-gray-600 cursor-pointer">
                    Normal Pricing
                  </label>
                </div>
                <FieldRow label="Diff. Pricing:" labelW="w-28">
                  {readOnly || normalPricing
                    ? <input className={INPUT_RO} value={diffPricingId} readOnly />
                    : <input className={INPUT} value={diffPricingId} onChange={e => setDiffPricingId(e.target.value)} placeholder="Pricing code…" />
                  }
                </FieldRow>
                <FieldRow label="Employer:" labelW="w-28">
                  {readOnly
                    ? <input className={INPUT_RO} value={employerNm} readOnly />
                    : <GOPSelect value={employerId} options={employers} loading={dropLoading}
                        onChange={(id, nm) => { setEmployerId(id); setEmployerNm(nm) }} placeholder="None" />
                  }
                </FieldRow>
                <FieldRow label="Discount Pkg:" labelW="w-28">
                  {readOnly
                    ? <input className={INPUT_RO} value={discPkgNm} readOnly />
                    : <GOPSelect value={discPkgId} options={discPkgs} loading={dropLoading}
                        onChange={(id, nm) => { setDiscPkgId(id); setDiscPkgNm(nm) }} placeholder="None" />
                  }
                </FieldRow>
                <FieldRow label="Insurer:" labelW="w-28">
                  {readOnly
                    ? <input className={INPUT_RO} value={insName} readOnly />
                    : <GOPSelect value={insId} options={insurers} loading={dropLoading}
                        onChange={(id, nm) => { setInsId(id); setInsName(nm) }} />
                  }
                </FieldRow>
                <FieldRow label="Mkt Package:" labelW="w-28">
                  {readOnly
                    ? <input className={INPUT_RO} value={mktPkgNm} readOnly />
                    : <GOPSelect value={mktPkgId} options={mktPkgs} loading={dropLoading}
                        onChange={(id, nm) => { setMktPkgId(id); setMktPkgNm(nm) }} placeholder="None" />
                  }
                </FieldRow>
              </div>

              {/* Quote meta sub-column */}
              <div className="flex flex-col gap-3">
                <FieldRow label="Quote No.:" labelW="w-28">
                  <input className={INPUT_RO} value={quoteNum || '(auto)'} readOnly />
                </FieldRow>
                <FieldRow label="Quote Date:" labelW="w-28">
                  <input type="date" className={readOnly ? INPUT_RO : INPUT} value={quoteDate} onChange={e => setQuoteDate(e.target.value)} readOnly={readOnly} />
                </FieldRow>
                <FieldRow label="Status:" labelW="w-28">
                  <input className={INPUT_RO} value={quoteStat} readOnly />
                </FieldRow>
                <FieldRow label="User:" labelW="w-28">
                  <input className={INPUT_RO} value={userName} readOnly />
                </FieldRow>
                <FieldRow label="Total Net Amt.:" labelW="w-28">
                  <input className={`${INPUT_RO} font-semibold text-primary-600`} value={totalNet.toFixed(2)} readOnly />
                </FieldRow>

                {/* Action buttons — right-aligned, matches HIS "Apply" position */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {!readOnly && (
                    <>
                      <button onClick={handleApply} disabled={applying} className={BTN_PRIMARY}>
                        {applying ? 'Loading…' : 'Apply'}
                      </button>
                      {isGopEligible && (
                        <button onClick={handleCreateGop} disabled={gopBusy} className={BTN_PRIMARY}>
                          {gopBusy ? '…' : <>Create GOP <ArrowRight className="h-4 w-4" /></>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 3: Quote Items ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quote Items</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Department','Type','Code','Description','Unit','Price','Amount','Discount','Net Amount'].map(h => (
                  <th key={h} className={`${TH} ${['Unit','Price','Amount','Discount','Net Amount'].includes(h) ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
                {!readOnly && <th className={TH} />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 9 : 10} className="py-12 text-center">
                    <p className="text-sm text-gray-400">No items</p>
                    <p className="text-xs text-gray-300 mt-1">Click Apply to load from HIS, or add rows manually</p>
                  </td>
                </tr>
              )}
              {rows.map(r => (
                <tr key={r._k} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className={TD}>{r.department || '—'}</td>
                  <td className={`${TD} text-gray-400 text-xs`}>{r.type || '—'}</td>
                  <td className={`${TD} font-mono text-xs text-gray-500`}>{r.code}</td>
                  <td className={TD}>{r.description}</td>
                  <td className={`${TD} text-right`}>
                    {readOnly ? r.unit : (
                      <input type="number" min={1} value={r.unit}
                        onChange={e => updateRow(r._k, 'unit', e.target.value)}
                        className="w-20 h-8 px-2 text-sm text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-right"
                      />
                    )}
                  </td>
                  <td className="text-sm text-gray-500 py-3 px-3 text-right font-mono">{r.price.toFixed(2)}</td>
                  <td className="text-sm font-medium text-gray-800 py-3 px-3 text-right font-mono">{r.amount.toFixed(2)}</td>
                  <td className={`${TD} text-right`}>
                    {readOnly ? r.discount.toFixed(2) : (
                      <input type="number" min={0} value={r.discount}
                        onChange={e => updateRow(r._k, 'discount', e.target.value)}
                        className="w-20 h-8 px-2 text-sm text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-right"
                      />
                    )}
                  </td>
                  <td className="text-sm font-semibold text-gray-800 py-3 px-3 text-right font-mono">{r.netAmount.toFixed(2)}</td>
                  {!readOnly && (
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => setRows(prev => prev.filter(x => x._k !== r._k))}
                        className="text-gray-300 hover:text-danger-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t-2 border-gray-200">
                <td colSpan={readOnly ? 8 : 9} className="text-sm font-semibold text-gray-800 py-3 px-3 text-right">
                  Total Net Amount:
                </td>
                <td className="text-base font-bold text-primary-600 py-3 px-3 text-right font-mono">
                  {totalNet.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <button
            onClick={() => setRows(prev => [...prev, {
              _k: String(++keyRef.current),
              department: deptName, type: '', code: '', description: 'Manual item',
              unit: 1, price: 0, amount: 0, discount: 0, netAmount: 0,
            }])}
            className={`${BTN_OUTLINE} mt-3`}
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        )}
      </div>

      {/* ── Card 4: Quote History ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quote History</h2>

        {/* Filter row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Date:</span>
          <span className="text-sm text-gray-500">From</span>
          <input type="date" value={listFrom} onChange={e => setListFrom(e.target.value)}
            className="h-9 px-3 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          <span className="text-sm text-gray-500">To</span>
          <input type="date" value={listTo} onChange={e => setListTo(e.target.value)}
            className="h-9 px-3 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          <button onClick={handleFilter} disabled={listLoading}
            className="px-4 h-9 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
            {listLoading ? 'Loading…' : 'Filter'}
          </button>
          <span className="ml-auto text-xs text-gray-400">{listCount} record{listCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Results table */}
        {listRows.length === 0 && !listLoading ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No records found</p>
            <p className="text-xs text-gray-300 mt-1">Adjust the date range and click Filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Quote Number','Total Net Amt.','Quote Date','CPI','Patient Name','Phone #','User','Status',''].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listRows.map(r => (
                  <tr key={r.id as string}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleOpenQuote(r.id as string)}
                  >
                    <td className="py-3 px-3">
                      <span className="text-sm font-medium text-primary-600 hover:text-primary-700 font-mono">
                        {r.quoteNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-800 font-mono text-right tabular-nums">
                      {Number(r.totalNetAmount).toFixed(2)}
                    </td>
                    <td className={TD}>{r.quoteDate ? String(r.quoteDate).slice(0, 10) : '—'}</td>
                    <td className="py-3 px-3 text-xs text-gray-500 font-mono">{r.cpiId || '—'}</td>
                    <td className="py-3 px-3 text-sm font-medium text-gray-800">{r.patientName}</td>
                    <td className="py-3 px-3 text-sm text-gray-500">{r.phoneNumber || '—'}</td>
                    <td className="py-3 px-3 text-sm text-gray-500">{r.createdByName || '—'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={r.status as string} />
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-400 hover:text-gray-600">Open →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
