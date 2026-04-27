'use client'

/**
 * Billing / Quotation — clean wireframe layout.
 *
 * ALL state, handlers, and API calls are preserved unchanged.
 * Only layout/visual structure is updated.
 *
 * New UI-only additions:
 *   Toggle        — visual toggle switch (replaces checkbox, same state)
 *   SectionCard   — consistent card wrapper
 *   FormField     — vertical label + input pair for 2-col grids
 *   GOPSelect     — unchanged from previous version
 *   StatusBadge   — unchanged from previous version
 *   itemQuery     — local state for client-side item table filter
 *   handleFinalise — wires existing /finalise endpoint to Sticky bar
 *   finalising    — loading flag for handleFinalise
 *   totalAmount / totalDiscount — derived from existing rows state (no new API)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, Search, Plus, Trash2, ArrowRight,
  User, Upload, FileText, Stethoscope, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types (unchanged) ────────────────────────────────────────────────────────
interface Opt       { id: string; name: string }
interface HisDoctor { id: string; name: string; specialty: string | null }
interface HisProc   { code: string; name: string }
interface HisDiag   { code: string; description: string }
interface PriceItem { code: string; description: string; unitPrice: number; type: string | null; department: string | null }
interface CpiResult { patientId: string; fullName: string; dob: string; nric: string }

interface QuoteRow {
  _k: string
  department: string; type: string; code: string; description: string
  unit: number; price: number; amount: number; discount: number; netAmount: number
}

// ─── Design tokens — SynthCare visual language ────────────────────────────────
// Filled inputs (SynthCare --input: #F3F4F6), hover lift on buttons, Poppins-style headings
const F  = 'w-full h-10 px-4 text-sm text-gray-800 bg-gray-100 rounded-lg border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-400'
const RO = 'w-full h-10 px-4 text-sm text-gray-500 bg-gray-100 rounded-lg border-0 cursor-not-allowed opacity-80'
const BTN_PRIMARY   = 'inline-flex items-center gap-2 px-5 h-10 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
const BTN_SECONDARY = 'inline-flex items-center gap-2 px-5 h-10 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all disabled:opacity-50 bg-white shadow-sm'
const BTN_GHOST     = 'inline-flex items-center gap-2 px-4 h-9 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white'
const BTN_OUTLINE   = 'inline-flex items-center gap-2 px-4 h-9 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors'
const LABEL = 'block text-sm font-medium text-gray-500 mb-1.5'

// ─── UI-only sub-components ───────────────────────────────────────────────────

/** Toggle switch — SynthCare style: smooth pill, shadow thumb */
function Toggle({ checked, onChange, disabled, label, id }: {
  checked: boolean; onChange: (v: boolean) => void
  disabled?: boolean; label: string; id: string
}) {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1 ${checked ? 'bg-primary-600' : 'bg-gray-200'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

/** SectionCard — SynthCare card style: white, subtle shadow, Poppins heading */
function SectionCard({ title, icon, children, className = '' }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        {icon && <span className="text-primary-600">{icon}</span>}
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

/** FormField — vertical label-above-input layout for modern 2-col grids */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  )
}

/** GOPSelect — filled-input select with chevron (SynthCare style) */
function GOPSelect({ value, onChange, options, placeholder = '', loading = false, disabled = false }: {
  value: string; onChange: (id: string, name: string) => void
  options: Opt[]; placeholder?: string; loading?: boolean; disabled?: boolean
}) {
  return (
    <div className="relative w-full">
      <select
        className={`${F} appearance-none pr-10 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        value={value}
        disabled={disabled || loading}
        onChange={e => {
          const o = options.find(x => x.id === e.target.value)
          onChange(e.target.value, o?.name ?? '')
        }}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {!loading && options.length === 0 && <option disabled value="">No items found</option>}
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  )
}

/** StatusBadge — pill per quote status (unchanged) */
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'DRAFT'       ? 'bg-gray-100 text-gray-600' :
    status === 'FINALISED'   ? 'bg-primary-50 text-primary-700' :
    status === 'GOP_CREATED' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BillingForm() {
  const { data: session } = useSession()
  const router = useRouter()

  // ── Quote metadata (unchanged)
  const [quoteId,   setQuoteId]   = useState<string | null>(null)
  const [quoteNum,  setQuoteNum]  = useState('')
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quoteStat, setQuoteStat] = useState<'DRAFT'|'FINALISED'|'GOP_CREATED'>('DRAFT')

  // ── Patient fields (unchanged)
  const [cpiRaw,  setCpiRaw]  = useState('')
  const [cpiId,   setCpiId]   = useState('')
  const [patName, setPatName] = useState('')
  const [dob,     setDob]     = useState('')
  const [gender,  setGender]  = useState('')
  const [phone,   setPhone]   = useState('')

  // ── Clinical fields (unchanged)
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

  // ── Pricing / insurance fields (unchanged)
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

  // ── HIS dropdowns (unchanged)
  const [depts,     setDepts]     = useState<Opt[]>([])
  const [doctors,   setDoctors]   = useState<HisDoctor[]>([])
  const [procs,     setProcs]     = useState<HisProc[]>([])
  const [orderSets, setOrderSets] = useState<Opt[]>([])
  const [employers, setEmployers] = useState<Opt[]>([])
  const [insurers,  setInsurers]  = useState<Opt[]>([])
  const [discPkgs,  setDiscPkgs]  = useState<Opt[]>([])
  const [mktPkgs,   setMktPkgs]   = useState<Opt[]>([])
  const [dropLoading, setDropLoading] = useState(true)

  // ── CPI search (unchanged)
  const [cpiResults, setCpiResults] = useState<CpiResult[]>([])
  const [showCpi,    setShowCpi]    = useState(false)
  const [cpiLoading, setCpiLoading] = useState(false)
  const cpiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Quote items (unchanged)
  const [rows,  setRows]  = useState<QuoteRow[]>([])
  const keyRef = useRef(0)

  // ── Bottom list (unchanged)
  const [listFrom,    setListFrom]    = useState(() => new Date().toISOString().slice(0, 10))
  const [listTo,      setListTo]      = useState(() => new Date().toISOString().slice(0, 10))
  const [listRows,    setListRows]    = useState<Record<string, string>[]>([])
  const [listCount,   setListCount]   = useState(0)
  const [listLoading, setListLoading] = useState(false)

  // ── Op states (unchanged + new finalising)
  const [applying,   setApplying]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [gopBusy,    setGopBusy]    = useState(false)
  const [finalising, setFinalising] = useState(false)

  // ── UI-only: item table search filter
  const [itemQuery, setItemQuery] = useState('')

  // ── Derived values (all from existing state — no new API)
  const readOnly      = quoteStat !== 'DRAFT'
  const age           = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : ''
  const isGopEligible = ['AIA','ASSURNET'].some(n => insName.toUpperCase().includes(n))
  const userName      = session?.user?.name ?? session?.user?.email ?? ''
  const totalNet      = rows.reduce((s, r) => s + r.netAmount, 0)
  const totalAmount   = rows.reduce((s, r) => s + r.amount,    0)   // derived, no new API
  const totalDiscount = rows.reduce((s, r) => s + r.discount,  0)   // derived, no new API
  const filteredRows  = itemQuery
    ? rows.filter(r =>
        r.description.toLowerCase().includes(itemQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(itemQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(itemQuery.toLowerCase())
      )
    : rows

  // ── All handlers unchanged from previous version ──────────────────────────

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

  useEffect(() => {
    if (!deptId) { setProcs([]); return }
    hisFetch(`/api/his/procedures?department=${encodeURIComponent(deptId)}`)
      .then(r => { if (r) setProcs(r as HisProc[]) })
  }, [deptId, hisFetch])

  const handleCpiSearch = useCallback((q: string) => {
    setCpiRaw(q); setShowCpi(true)
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

  /** Wires the existing /finalise endpoint — only UI entry point changed */
  const handleFinalise = async () => {
    setFinalising(true)
    try {
      let id = quoteId
      if (!id) {
        const body = buildBody()
        const r = await fetch('/api/billing/quotes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setQuoteId(d.id); setQuoteNum(d.quoteNumber); id = d.id
      }
      const r = await fetch(`/api/billing/quotes/${id}/finalise`, { method: 'PATCH' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuoteStat('FINALISED')
      toast.success('Quote finalised.')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed.') }
    finally { setFinalising(false) }
  }

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

  const handleOpenQuote = async (id: string) => {
    try {
      const r = await fetch(`/api/billing/quotes/${id}`)
      const d = await r.json()
      setQuoteId(d.id); setQuoteNum(d.quoteNumber ?? ''); setQuoteStat(d.status ?? 'DRAFT')
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

  const resetForm = () => {
    setQuoteId(null); setQuoteNum(''); setQuoteStat('DRAFT')
    setQuoteDate(new Date().toISOString().slice(0, 10))
    setCpiRaw(''); setCpiId(''); setPatName(''); setDob(''); setGender(''); setPhone('')
    setDeptId(''); setDeptName(''); setDoctorId(''); setDoctorName('')
    setLos(''); setProcCode(''); setProcName(''); setDiagCode(''); setDiagDesc(''); setDiagInput('')
    setProvDiag(''); setOrderSetId(''); setOrderSetNm('')
    setNormalPricing(true); setDiffPricingId(''); setEmployerId(''); setEmployerNm('')
    setInsId(''); setInsName(''); setDiscPkgId(''); setDiscPkgNm(''); setMktPkgId(''); setMktPkgNm('')
    setRows([]); setItemQuery('')
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full font-sans" style={{ background: 'linear-gradient(to bottom right, #F0F4FF 0%, #ffffff 60%)' }}>

      {/* ── Scrollable content (bottom-padded so sticky bar doesn't overlap) ── */}
      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-6 space-y-5">

        {/* Page header — SynthCare style: white card, Poppins heading */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Billing / Quotation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage patient billing quotes</p>
          </div>
          <div className="flex items-center gap-3">
            {quoteNum && (
              <>
                <span className="text-xs text-gray-400">Active:</span>
                <span className="text-sm font-semibold text-primary-600 font-mono bg-primary-50 px-3 py-1 rounded-lg">{quoteNum}</span>
                <StatusBadge status={quoteStat} />
              </>
            )}
            <button onClick={resetForm} className={BTN_GHOST}>
              <Plus className="h-4 w-4" /> New Quote
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────
            SECTION 1 — Patient Information
        ──────────────────────────────────────────────────────────────── */}
        <SectionCard title="Patient Information" icon={<User className="h-4 w-4" />}>

          {/* CPI search — full width */}
          <div className="mb-6">
            <span className={LABEL}>CPI — Patient Lookup</span>
            <div className="flex gap-3 max-w-lg relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  className={`${F} pl-10`}
                  value={cpiRaw}
                  onChange={e => handleCpiSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCpiSearch(cpiRaw)}
                  onFocus={() => cpiResults.length && setShowCpi(true)}
                  onBlur={() => setTimeout(() => setShowCpi(false), 200)}
                  placeholder="Enter CPI number or patient name…"
                  disabled={readOnly}
                />
                {/* CPI dropdown */}
                {showCpi && cpiResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {cpiResults.map(p => (
                      <div
                        key={p.patientId}
                        onMouseDown={() => handleCpiSelect(p)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{p.fullName}</div>
                          <div className="text-xs text-gray-400 font-mono">{p.nric} · DOB: {p.dob}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCpiSearch(cpiRaw)}
                disabled={readOnly}
                className={BTN_PRIMARY}
              >
                {cpiLoading ? '…' : <><Search className="h-4 w-4" /> Search</>}
              </button>
            </div>
          </div>

          {/* Patient fields: left fields + right photo placeholder */}
          <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <FormField label="Patient Name">
                <input className={readOnly ? RO : F} value={patName} onChange={e => setPatName(e.target.value)} readOnly={readOnly} placeholder="Auto-filled from CPI lookup" />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" className={readOnly ? RO : F} value={dob} onChange={e => setDob(e.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Gender">
                {readOnly
                  ? <input className={RO} value={gender} readOnly />
                  : <div className="relative">
                      <select className={`${F} appearance-none pr-10`} value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Select gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                }
              </FormField>
              <FormField label="Age (auto-calculated)">
                <input className={RO} value={age !== '' ? `${age} years` : ''} readOnly placeholder="—" />
              </FormField>
              <FormField label="Phone Number">
                <input className={readOnly ? RO : F} value={phone} onChange={e => setPhone(e.target.value)} readOnly={readOnly} placeholder="Contact number" />
              </FormField>
              <FormField label="Department">
                {readOnly
                  ? <input className={RO} value={deptName} readOnly />
                  : <GOPSelect value={deptId} options={depts} loading={dropLoading}
                      onChange={(id, nm) => { setDeptId(id); setDeptName(nm) }} placeholder="Select department…" />
                }
              </FormField>
            </div>

            {/* Patient photo placeholder */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-28 h-36 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-300">
                <User className="h-10 w-10" />
              </div>
              <span className="text-xs text-gray-400">Patient Photo</span>
            </div>
          </div>
        </SectionCard>

        {/* ────────────────────────────────────────────────────────────────
            SECTION 2 — Clinical Details
        ──────────────────────────────────────────────────────────────── */}
        <SectionCard title="Clinical Details" icon={<Stethoscope className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <FormField label="Attending Doctor">
              {readOnly
                ? <input className={RO} value={doctorName} readOnly />
                : <GOPSelect value={doctorId}
                    options={doctors.map(d => ({ id: d.id, name: d.specialty ? `${d.name} (${d.specialty})` : d.name }))}
                    loading={dropLoading}
                    onChange={(id) => { const d = doctors.find(x => x.id === id); setDoctorId(id); setDoctorName(d?.name ?? '') }} />
              }
            </FormField>
            <FormField label="Length of Stay (days)">
              <input type="number" min={0} className={readOnly ? RO : F} value={los} onChange={e => setLos(e.target.value)} readOnly={readOnly} placeholder="Number of days" />
            </FormField>
            <FormField label="Procedure">
              {readOnly
                ? <input className={RO} value={procName} readOnly />
                : <GOPSelect value={procCode}
                    options={procs.map(p => ({ id: p.code, name: p.name }))}
                    placeholder={deptId ? 'Select procedure…' : 'Select a department first'}
                    onChange={(id, nm) => { setProcCode(id); setProcName(nm) }} />
              }
            </FormField>
            <FormField label="Doctor Order Set">
              {readOnly
                ? <input className={RO} value={orderSetNm} readOnly />
                : <GOPSelect value={orderSetId} options={orderSets} loading={dropLoading}
                    onChange={(id, nm) => { setOrderSetId(id); setOrderSetNm(nm) }} placeholder="Select order set…" />
              }
            </FormField>

            {/* Diagnosis — type-ahead, spans full width conceptually but in 2-col it's one cell */}
            <FormField label="Diagnosis (ICD-10)">
              <div className="relative">
                <input
                  className={readOnly ? RO : F}
                  value={diagInput || (diagCode ? `${diagCode} — ${diagDesc}` : '')}
                  onChange={e => { setDiagInput(e.target.value); setShowDiag(true) }}
                  onFocus={() => setShowDiag(true)}
                  onBlur={() => setTimeout(() => setShowDiag(false), 200)}
                  placeholder="Search by ICD-10 code or description…"
                  readOnly={readOnly}
                />
                {showDiag && diagDrop.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto max-h-52">
                    {diagDrop.map(d => (
                      <div
                        key={d.code}
                        onMouseDown={() => { setDiagCode(d.code); setDiagDesc(d.description); setDiagInput(''); setShowDiag(false) }}
                        className="flex items-baseline gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <span className="text-xs font-mono font-bold text-primary-600 shrink-0 bg-primary-50 px-1.5 py-0.5 rounded">{d.code}</span>
                        <span className="text-sm text-gray-700 truncate">{d.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="Provisional Diagnosis">
              <input className={readOnly ? RO : F} value={provDiag} onChange={e => setProvDiag(e.target.value)} readOnly={readOnly} placeholder="Optional provisional notes" />
            </FormField>
          </div>
        </SectionCard>

        {/* ────────────────────────────────────────────────────────────────
            SECTION 3 — Pricing & Quote
            Three sub-sections: A) Pricing Settings | B) Quote Info | C) Summary
        ──────────────────────────────────────────────────────────────── */}
        <SectionCard title="Pricing &amp; Quote" icon={<DollarSign className="h-4 w-4" />}>
          <div className="grid grid-cols-3 gap-6">

            {/* A — Pricing Settings */}
            <div className="space-y-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing Settings</p>

              {/* Toggle replaces the old checkbox — same normalPricing state */}
              <Toggle
                id="normalPricing"
                label="Normal Pricing"
                checked={normalPricing}
                onChange={setNormalPricing}
                disabled={readOnly}
              />

              {!normalPricing && (
                <FormField label="Different Pricing ID">
                  <input className={readOnly ? RO : F} value={diffPricingId}
                    onChange={e => setDiffPricingId(e.target.value)} placeholder="Pricing code…" readOnly={readOnly} />
                </FormField>
              )}

              <FormField label="Employer">
                {readOnly
                  ? <input className={RO} value={employerNm} readOnly />
                  : <GOPSelect value={employerId} options={employers} loading={dropLoading}
                      onChange={(id, nm) => { setEmployerId(id); setEmployerNm(nm) }} placeholder="None" />
                }
              </FormField>
              <FormField label="Insurance / Sponsor">
                {readOnly
                  ? <input className={RO} value={insName} readOnly />
                  : <GOPSelect value={insId} options={insurers} loading={dropLoading}
                      onChange={(id, nm) => { setInsId(id); setInsName(nm) }} placeholder="Select insurer…" />
                }
              </FormField>
              <FormField label="Discount Package">
                {readOnly
                  ? <input className={RO} value={discPkgNm} readOnly />
                  : <GOPSelect value={discPkgId} options={discPkgs} loading={dropLoading}
                      onChange={(id, nm) => { setDiscPkgId(id); setDiscPkgNm(nm) }} placeholder="None" />
                }
              </FormField>
              <FormField label="Marketing Package">
                {readOnly
                  ? <input className={RO} value={mktPkgNm} readOnly />
                  : <GOPSelect value={mktPkgId} options={mktPkgs} loading={dropLoading}
                      onChange={(id, nm) => { setMktPkgId(id); setMktPkgNm(nm) }} placeholder="None" />
                }
              </FormField>
            </div>

            {/* B — Quote Information */}
            <div className="space-y-5 border-x border-gray-100 px-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quote Information</p>

              <FormField label="Quote Number">
                <input className={`${RO} font-mono`} value={quoteNum || '(auto-generated on save)'} readOnly />
              </FormField>
              <FormField label="Quote Date">
                <input type="date" className={readOnly ? RO : F} value={quoteDate} onChange={e => setQuoteDate(e.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Status">
                <div className="flex items-center h-11">
                  <StatusBadge status={quoteStat} />
                </div>
              </FormField>
              <FormField label="Created By">
                <input className={RO} value={userName} readOnly />
              </FormField>

              {/* Apply button — loads pricing from HIS */}
              {!readOnly && (
                <div className="pt-2">
                  <button onClick={handleApply} disabled={applying} className={`${BTN_PRIMARY} w-full justify-center`}>
                    {applying ? 'Loading HIS pricing…' : <><FileText className="h-4 w-4" /> Apply Pricing</>}
                  </button>
                </div>
              )}
            </div>

            {/* C — Quote Summary — SynthCare gradient card */}
            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'linear-gradient(135deg, #5B5FFF 0%, #6366F1 100%)' }}>
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Quote Summary</p>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Gross Amount</span>
                  <span className="text-sm font-semibold text-white font-mono">{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Discount</span>
                  <span className="text-sm font-semibold text-white/70 font-mono">({totalDiscount.toFixed(2)})</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-white/15 rounded-lg px-3 mt-1">
                  <span className="text-sm font-bold text-white">Total Net Amount</span>
                  <span className="text-xl font-bold text-white font-mono">{totalNet.toFixed(2)}</span>
                </div>
              </div>

              {/* Create GOP — only for AIA / ASSURNET */}
              {isGopEligible && !readOnly && (
                <button onClick={handleCreateGop} disabled={gopBusy}
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full h-10 bg-white text-primary-600 text-sm font-semibold rounded-lg hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50">
                  {gopBusy ? '…' : <><ArrowRight className="h-4 w-4" /> Create GOP Request</>}
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ────────────────────────────────────────────────────────────────
            SECTION 4 — Quote Items (full-width table)
        ──────────────────────────────────────────────────────────────── */}
        <SectionCard title="Quote Items" icon={<FileText className="h-4 w-4" />}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-4 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-400"
                placeholder="Search item / service / code…"
                value={itemQuery}
                onChange={e => setItemQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {!readOnly && (
                <>
                  <button
                    onClick={() => setRows(prev => [...prev, {
                      _k: String(++keyRef.current),
                      department: deptName, type: '', code: '', description: 'Manual item',
                      unit: 1, price: 0, amount: 0, discount: 0, netAmount: 0,
                    }])}
                    className={BTN_OUTLINE}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                  <button
                    onClick={() => toast('Import feature is coming in a future release.')}
                    className={BTN_GHOST}
                  >
                    <Upload className="h-3.5 w-3.5" /> Import
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Department','Type','Code','Description','Unit','Price','Amount','Discount','Net Amount'].map(h => (
                    <th key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap ${['Unit','Price','Amount','Discount','Net Amount'].includes(h) ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                  {!readOnly && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={readOnly ? 9 : 10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No items yet</p>
                        <p className="text-xs text-gray-300">
                          {itemQuery ? 'No items match your search' : 'Click "Apply Pricing" to load from HIS, or add manually'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredRows.map(r => (
                  <tr key={r._k} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="text-sm text-gray-700 px-4 py-3">{r.department || '—'}</td>
                    <td className="text-xs text-gray-400 px-4 py-3">{r.type || '—'}</td>
                    <td className="text-xs font-mono text-gray-500 px-4 py-3">{r.code}</td>
                    <td className="text-sm text-gray-800 px-4 py-3 max-w-[200px] truncate">{r.description}</td>
                    <td className="px-4 py-3 text-right">
                      {readOnly ? (
                        <span className="text-sm text-gray-700">{r.unit}</span>
                      ) : (
                        <input type="number" min={1} value={r.unit}
                          onChange={e => updateRow(r._k, 'unit', e.target.value)}
                          className="w-20 h-8 px-2 text-sm text-right text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      )}
                    </td>
                    <td className="text-sm text-gray-500 px-4 py-3 text-right font-mono">{r.price.toFixed(2)}</td>
                    <td className="text-sm font-medium text-gray-700 px-4 py-3 text-right font-mono">{r.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {readOnly ? (
                        <span className="text-sm text-gray-700">{r.discount.toFixed(2)}</span>
                      ) : (
                        <input type="number" min={0} value={r.discount}
                          onChange={e => updateRow(r._k, 'discount', e.target.value)}
                          className="w-24 h-8 px-2 text-sm text-right text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      )}
                    </td>
                    <td className="text-sm font-bold text-gray-800 px-4 py-3 text-right font-mono">{r.netAmount.toFixed(2)}</td>
                    {!readOnly && (
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => setRows(prev => prev.filter(x => x._k !== r._k))}
                          className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Summary total row */}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={readOnly ? 8 : 9} className="text-sm font-bold text-gray-700 px-4 py-4 text-right">
                    Total Net Amount
                  </td>
                  <td className="text-base font-bold text-primary-600 px-4 py-4 text-right font-mono">
                    {totalNet.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ────────────────────────────────────────────────────────────────
            SECTION 5 — Quote History
        ──────────────────────────────────────────────────────────────── */}
        <SectionCard title="Quote History" icon={<FileText className="h-4 w-4" />}>
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Date:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">From</span>
              <input type="date" value={listFrom} onChange={e => setListFrom(e.target.value)}
                className="h-9 px-3 text-sm text-gray-800 bg-gray-100 rounded-lg border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">To</span>
              <input type="date" value={listTo} onChange={e => setListTo(e.target.value)}
                className="h-9 px-3 text-sm text-gray-800 bg-gray-100 rounded-lg border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <button onClick={handleFilter} disabled={listLoading}
              className="px-5 h-9 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
              {listLoading ? 'Loading…' : 'Filter'}
            </button>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {listCount} record{listCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Results */}
          {listRows.length === 0 && !listLoading ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No records found</p>
              <p className="text-xs text-gray-300 mt-1">Adjust the date range and click Filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Quote Number','Net Amount','Quote Date','CPI','Patient Name','Phone','User','Status',''].map(h => (
                      <th key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-left px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listRows.map(r => (
                    <tr key={r.id as string}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleOpenQuote(r.id as string)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-primary-600 font-mono">{r.quoteNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 font-mono tabular-nums">
                        {Number(r.totalNetAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.quoteDate ? String(r.quoteDate).slice(0, 10) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.cpiId || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{r.patientName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.phoneNumber || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.createdByName || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status as string} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 hover:text-primary-600 transition-colors font-medium">Open →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          STICKY ACTION BAR — SynthCare: white card, gradient total, shadow
      ──────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky bottom-0 bg-white border-t border-gray-100 z-20" style={{ boxShadow: '0 -4px 20px rgba(91,95,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left — live total with SynthCare primary colour */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Net Amount</p>
                <p className="text-xl font-bold font-mono leading-tight" style={{ color: '#5B5FFF' }}>
                  $ {totalNet.toFixed(2)}
                </p>
              </div>
            </div>
            {quoteNum && (
              <div className="pl-5 border-l border-gray-100">
                <p className="text-xs text-gray-400">Quote No.</p>
                <p className="text-sm font-semibold text-gray-700 font-mono">{quoteNum}</p>
              </div>
            )}
          </div>

          {/* Right — action buttons */}
          <div className="flex items-center gap-3">
            <button onClick={resetForm} className={BTN_SECONDARY}>Cancel</button>
            {!readOnly && (
              <>
                <button onClick={() => doSave()} disabled={saving} className={BTN_SECONDARY}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={handleFinalise}
                  disabled={finalising || saving}
                  className="inline-flex items-center gap-2 px-5 h-10 text-white text-sm font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #5B5FFF 0%, #6366F1 100%)' }}
                >
                  {finalising ? 'Finalising…' : <><span>✓</span> Finalize Quote</>}
                </button>
              </>
            )}
            {readOnly && quoteStat === 'FINALISED' && isGopEligible && (
              <button
                onClick={handleCreateGop}
                disabled={gopBusy}
                className="inline-flex items-center gap-2 px-5 h-10 text-white text-sm font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5B5FFF 0%, #6366F1 100%)' }}
              >
                {gopBusy ? '…' : <><ArrowRight className="h-4 w-4" /> Create GOP Request</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
