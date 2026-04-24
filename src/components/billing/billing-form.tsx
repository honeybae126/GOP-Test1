'use client'

/**
 * HIS Finance / Quotation module — exact layout replica.
 *
 * Visual reference: hospital HIS screenshot.
 * All column names from HIS queries are marked ⚠ ASSUMPTION.
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Design constants (match HIS screenshot) ─────────────────────────────────
const BG      = '#F5F0E8'   // page background
const PANEL   = '#FAF7F3'   // section panel background
const BORDER  = '#C8BFA8'   // border colour
const TEXT    = '#2C2416'   // primary text
const MUTED   = '#6B5E4A'   // secondary text / read-only value
const SBAR_BG = '#E8E2D5'   // status bar background

const F = 12                // base font size px
const INPUT_H = 22          // input/field height px
const ROW_GAP = 3           // vertical gap between rows px

const base: React.CSSProperties = {
  height: INPUT_H,
  fontSize: F,
  fontFamily: 'system-ui,-apple-system,sans-serif',
  color: TEXT,
  border: `1px solid ${BORDER}`,
  borderRadius: 0,
  background: '#FFFFFF',
  padding: '0 4px',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
}
const ro:  React.CSSProperties = { ...base, background: BG, color: MUTED }
const sel: React.CSSProperties = {
  ...base,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4'%3E%3Cpath d='M0 0l4 4 4-4z' fill='%23736357'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 4px center',
  paddingRight: 16,
}
const btn: React.CSSProperties = {
  height: INPUT_H,
  padding: '0 10px',
  fontSize: F,
  fontFamily: 'system-ui,-apple-system,sans-serif',
  border: `1px solid ${BORDER}`,
  borderRadius: 0,
  background: BG,
  color: TEXT,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
const btnPrimary: React.CSSProperties = {
  ...btn,
  background: '#5B4A2E',
  color: '#FFFFFF',
  border: '1px solid #3D3020',
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Opt  { id: string; name: string }
interface Doc  { id: string; name: string; specialty: string | null }
interface Proc { code: string; name: string }
interface Diag { code: string; description: string }
interface PriceItem { code: string; description: string; unitPrice: number; type: string | null; department: string | null }
interface CpiResult { patientId: string; fullName: string; dob: string; nric: string }

interface QuoteRow {
  _k: string
  department: string; type: string; code: string; description: string
  unit: number; price: number; amount: number; discount: number; netAmount: number
}

// ─── Helper components ───────────────────────────────────────────────────────

/** Single form row: fixed-width label + flex content */
function Row({
  label, lw = 120, children,
}: { label: string; lw?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: INPUT_H + 2, gap: 4, marginBottom: ROW_GAP }}>
      <span style={{
        width: lw, minWidth: lw, fontSize: F, color: TEXT,
        textAlign: 'right', paddingRight: 4, flexShrink: 0, lineHeight: '1',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

/** Simple dropdown fed by an array of Opt */
function Dropdown({
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
    <select
      style={{ ...sel, color: value ? TEXT : MUTED, opacity: disabled ? 0.5 : 1 }}
      value={value}
      disabled={disabled}
      onChange={e => {
        const o = options.find(x => x.id === e.target.value)
        onChange(e.target.value, o?.name ?? '')
      }}
    >
      <option value="">{loading ? 'Loading…' : placeholder}</option>
      {!loading && options.length === 0 && <option disabled value="">No items found</option>}
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BillingForm() {
  const { data: session } = useSession()
  const router = useRouter()

  // ── Quote metadata
  const [quoteId,     setQuoteId]     = useState<string | null>(null)
  const [quoteNum,    setQuoteNum]    = useState('')
  const [quoteDate,   setQuoteDate]   = useState(() => new Date().toISOString().slice(0, 10))
  const [quoteStat,   setQuoteStat]   = useState<'DRAFT'|'FINALISED'|'GOP_CREATED'>('DRAFT')

  // ── Patient fields
  const [cpiRaw,      setCpiRaw]      = useState('')    // what the user types
  const [cpiId,       setCpiId]       = useState('')
  const [patName,     setPatName]     = useState('')
  const [dob,         setDob]         = useState('')
  const [gender,      setGender]      = useState('')
  const [phone,       setPhone]       = useState('')

  // ── Clinical fields
  const [deptId,      setDeptId]      = useState('')
  const [deptName,    setDeptName]    = useState('')
  const [doctorId,    setDoctorId]    = useState('')
  const [doctorName,  setDoctorName]  = useState('')
  const [los,         setLos]         = useState('')
  const [procCode,    setProcCode]    = useState('')
  const [procName,    setProcName]    = useState('')
  const [diagCode,    setDiagCode]    = useState('')
  const [diagDesc,    setDiagDesc]    = useState('')
  const [diagInput,   setDiagInput]   = useState('')    // typed text for type-ahead
  const [diagDrop,    setDiagDrop]    = useState<Diag[]>([])
  const [showDiag,    setShowDiag]    = useState(false)
  const [provDiag,    setProvDiag]    = useState('')
  const [orderSetId,  setOrderSetId]  = useState('')
  const [orderSetNm,  setOrderSetNm]  = useState('')

  // ── Pricing / insurance fields
  const [normalPricing, setNormalPricing] = useState(true)
  const [diffPricingId, setDiffPricingId] = useState('')
  const [diffPricingNm, setDiffPricingNm] = useState('')
  const [employerId,  setEmployerId]  = useState('')
  const [employerNm,  setEmployerNm]  = useState('')
  const [discPkgId,   setDiscPkgId]   = useState('')
  const [discPkgNm,   setDiscPkgNm]   = useState('')
  const [insId,       setInsId]       = useState('')
  const [insName,     setInsName]     = useState('')
  const [mktPkgId,    setMktPkgId]    = useState('')
  const [mktPkgNm,    setMktPkgNm]    = useState('')

  // ── HIS dropdown data
  const [depts,     setDepts]     = useState<Opt[]>([])
  const [doctors,   setDoctors]   = useState<Doc[]>([])
  const [procs,     setProcs]     = useState<Proc[]>([])
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
  const [rows,  setRows]  = useState<QuoteRow[]>([])
  const keyRef = useRef(0)
  const totalNet = rows.reduce((s, r) => s + r.netAmount, 0)

  // ── Bottom list panel
  const [listFrom,   setListFrom]   = useState(() => new Date().toISOString().slice(0, 10))
  const [listTo,     setListTo]     = useState(() => new Date().toISOString().slice(0, 10))
  const [listRows,   setListRows]   = useState<Record<string, string>[]>([])
  const [listCount,  setListCount]  = useState(0)
  const [listLoading, setListLoading] = useState(false)

  // ── Op loading states
  const [applying, setApplying] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [gopBusy,  setGopBusy]  = useState(false)

  const readOnly  = quoteStat !== 'DRAFT'
  const age       = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : ''
  const isGopEligible = ['AIA','ASSURNET'].some(n => insName.toUpperCase().includes(n))
  const userName  = session?.user?.name ?? session?.user?.email ?? ''

  // ── Timeout-safe HIS fetch
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

  // ── Load all static dropdowns on mount
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
      if (dc)   setDoctors(dc as Doc[])
      if (os)   setOrderSets(os as Opt[])
      if (em)   setEmployers(em as Opt[])
      if (ins)  setInsurers(ins as Opt[])
      if (disc) setDiscPkgs(disc as Opt[])
      if (mkt)  setMktPkgs(mkt as Opt[])
      setDropLoading(false)
    }
    load()
  }, [hisFetch])

  // ── Reload procedures when department changes
  useEffect(() => {
    if (!deptId) { setProcs([]); return }
    hisFetch(`/api/his/procedures?department=${encodeURIComponent(deptId)}`)
      .then(r => { if (r) setProcs(r as Proc[]) })
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

  const handleCpiKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCpiSearch(cpiRaw)
  }

  const handleCpiSelect = async (pt: CpiResult) => {
    setCpiRaw(pt.fullName)
    setCpiId(pt.patientId)
    setPatName(pt.fullName)
    setDob(pt.dob)
    setShowCpi(false)
    // Also fetch insurance data to pre-fill insurer field
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 5000)
    try {
      const r = await fetch(`/api/his/patient?nric=${encodeURIComponent(pt.nric)}`, { signal: ctrl.signal })
      const d = await r.json()
      if (d.found) {
        if (d.patient?.contactNumber) setPhone(d.patient.contactNumber)
        if (d.patient?.gender) setGender(d.patient.gender)
        if (d.insurance?.insurerCode) {
          const match = insurers.find(i => i.name.toUpperCase().includes(d.insurance.insurerCode.toUpperCase()))
          if (match) { setInsId(match.id); setInsName(match.name) }
        }
      }
    } catch { /* silent — patient fields already filled */ }
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

  // ── Apply — load pricing items from HIS
  const handleApply = async () => {
    setApplying(true)
    try {
      const p = new URLSearchParams({
        type:  normalPricing ? 'normal' : 'different',
        ...(insId    ? { insurerId:     insId    } : {}),
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
        type:        it.type ?? '',
        code:        it.code,
        description: it.description,
        unit: 1, price: it.unitPrice, amount: it.unitPrice, discount: 0, netAmount: it.unitPrice,
      }))
      setRows(prev => [...prev, ...newRows])
      toast.success(`${newRows.length} item${newRows.length !== 1 ? 's' : ''} loaded from HIS.`)
      // Auto-save
      await doSave([...rows, ...newRows])
    } catch { toast.error('Failed to load pricing from HIS.') }
    finally { setApplying(false) }
  }

  // ── Row updates (unit / discount editable)
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

  // ── Save quote
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
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.')
    } finally { setSaving(false) }
  }

  // ── Create GOP from quote
  const handleCreateGop = async () => {
    await doSave()
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

  // ── Load bottom list panel
  const handleFilter = useCallback(async () => {
    setListLoading(true)
    try {
      const p = new URLSearchParams({ dateFrom: listFrom, dateTo: listTo })
      const r = await fetch(`/api/billing/quotes?${p}`)
      const d = await r.json()
      const arr = Array.isArray(d) ? d : []
      setListRows(arr)
      setListCount(arr.length)
    } catch { toast.error('Could not load quotes.') }
    finally { setListLoading(false) }
  }, [listFrom, listTo])

  // Load on mount
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

  // ── Reset form (new quote)
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

  // ── Shared table cell style
  const th: React.CSSProperties = {
    padding: '2px 6px', fontSize: 11, fontWeight: 600, textAlign: 'left',
    background: '#EDE8DC', border: `1px solid ${BORDER}`, whiteSpace: 'nowrap',
    color: TEXT,
  }
  const td: React.CSSProperties = {
    padding: '2px 6px', fontSize: F, border: `1px solid #E0D8CC`,
    color: TEXT, height: INPUT_H, verticalAlign: 'middle',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: BG, fontFamily: 'system-ui,-apple-system,sans-serif',
      fontSize: F, color: TEXT, overflow: 'hidden',
    }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* ── SECTION 1: CPI search bar ─────────────────────────────── */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: '5px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: F, flexShrink: 0 }}>CPI:</span>
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <input
                style={{ ...base, paddingRight: 28 }}
                value={cpiRaw}
                onChange={e => handleCpiSearch(e.target.value)}
                onKeyDown={handleCpiKey}
                onFocus={() => cpiResults.length && setShowCpi(true)}
                onBlur={() => setTimeout(() => setShowCpi(false), 200)}
                placeholder=""
                disabled={readOnly}
              />
              {/* HIS-style ? search button */}
              <button
                onClick={() => handleCpiSearch(cpiRaw)}
                disabled={readOnly}
                style={{
                  position: 'absolute', right: 0, top: 0,
                  height: INPUT_H, width: INPUT_H,
                  border: `1px solid ${BORDER}`, borderLeft: 'none', borderRadius: 0,
                  background: '#D8D0C0', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#5B4A2E',
                }}
              >
                {cpiLoading ? '…' : '?'}
              </button>
              {/* CPI results dropdown */}
              {showCpi && cpiResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: INPUT_H, left: 0, right: 0, zIndex: 100,
                  background: '#FFFFFF', border: `1px solid ${BORDER}`,
                  maxHeight: 180, overflowY: 'auto',
                  boxShadow: '2px 2px 6px rgba(44,36,22,0.15)',
                }}>
                  {cpiResults.map(p => (
                    <div
                      key={p.patientId}
                      onMouseDown={() => handleCpiSelect(p)}
                      style={{ padding: '3px 8px', cursor: 'pointer', fontSize: F, borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EDE8DC')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                    >
                      <strong>{p.fullName}</strong>
                      <span style={{ marginLeft: 8, color: MUTED, fontFamily: 'monospace' }}>{p.nric}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: 3-column form ───────────────────────────────── */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: '6px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr',
          gap: 0,
        }}>

          {/* LEFT COLUMN — Patient Information */}
          <div style={{ padding: '0 8px', borderRight: `1px solid ${BORDER}` }}>
            <Row label="Patient Name:" lw={92}>
              <input style={readOnly ? ro : base} value={patName} onChange={e => setPatName(e.target.value)} readOnly={readOnly} />
            </Row>
            <Row label="DOB:" lw={92}>
              <input type="date" style={readOnly ? ro : base} value={dob} onChange={e => setDob(e.target.value)} readOnly={readOnly} />
            </Row>
            <Row label="Gender:" lw={92}>
              {readOnly
                ? <input style={ro} value={gender} readOnly />
                : <select style={sel} value={gender} onChange={e => setGender(e.target.value)}>
                    <option value=""/>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
              }
            </Row>
            <Row label="Age:" lw={92}>
              <input style={ro} value={age !== '' ? `${age}` : ''} readOnly />
            </Row>
            <Row label="Phone No.:" lw={92}>
              <input style={readOnly ? ro : base} value={phone} onChange={e => setPhone(e.target.value)} readOnly={readOnly} />
            </Row>
            <Row label="Department:" lw={92}>
              {readOnly
                ? <input style={ro} value={deptName} readOnly />
                : <Dropdown value={deptId} options={depts} loading={dropLoading}
                    onChange={(id, nm) => { setDeptId(id); setDeptName(nm) }} />
              }
            </Row>
          </div>

          {/* MIDDLE COLUMN — Clinical Details */}
          <div style={{ padding: '0 8px', borderRight: `1px solid ${BORDER}` }}>
            <Row label="Attending Doctor:" lw={130}>
              {readOnly
                ? <input style={ro} value={doctorName} readOnly />
                : <Dropdown value={doctorId}
                    options={doctors.map(d => ({ id: d.id, name: d.specialty ? `${d.name} (${d.specialty})` : d.name }))}
                    loading={dropLoading}
                    onChange={(id) => {
                      const d = doctors.find(x => x.id === id)
                      setDoctorId(id); setDoctorName(d?.name ?? '')
                    }} />
              }
            </Row>
            <Row label="Length of Stay:" lw={130}>
              <input type="number" min={0} style={readOnly ? ro : base} value={los} onChange={e => setLos(e.target.value)} readOnly={readOnly} placeholder="Days" />
            </Row>
            <Row label="Procedure:" lw={130}>
              {readOnly
                ? <input style={ro} value={procName} readOnly />
                : <Dropdown value={procCode}
                    options={procs.map(p => ({ id: p.code, name: p.name }))}
                    placeholder={deptId ? 'Select…' : 'Select dept first'}
                    onChange={(id, nm) => { setProcCode(id); setProcName(nm) }} />
              }
            </Row>
            {/* Diagnosis — type-ahead */}
            <Row label="Diagnosis:" lw={130}>
              <div style={{ position: 'relative' }}>
                <input
                  style={readOnly ? ro : base}
                  value={diagInput || (diagCode ? `${diagCode} — ${diagDesc}` : '')}
                  onChange={e => { setDiagInput(e.target.value); setShowDiag(true) }}
                  onFocus={() => setShowDiag(true)}
                  onBlur={() => setTimeout(() => setShowDiag(false), 200)}
                  placeholder="Code or description…"
                  readOnly={readOnly}
                />
                {showDiag && diagDrop.length > 0 && (
                  <div style={{
                    position: 'absolute', top: INPUT_H, left: 0, right: 0, zIndex: 100,
                    background: '#FFFFFF', border: `1px solid ${BORDER}`,
                    maxHeight: 160, overflowY: 'auto',
                    boxShadow: '2px 2px 6px rgba(44,36,22,0.15)',
                  }}>
                    {diagDrop.map(d => (
                      <div
                        key={d.code}
                        onMouseDown={() => {
                          setDiagCode(d.code); setDiagDesc(d.description)
                          setDiagInput(''); setShowDiag(false)
                        }}
                        style={{ padding: '3px 8px', cursor: 'pointer', fontSize: F, borderBottom: `1px solid ${BORDER}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#EDE8DC')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <span style={{ fontFamily: 'monospace', color: '#1D4E89', marginRight: 6 }}>{d.code}</span>
                        {d.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Row>
            <Row label="Provisional Diagnosis:" lw={130}>
              <input style={readOnly ? ro : base} value={provDiag} onChange={e => setProvDiag(e.target.value)} readOnly={readOnly} />
            </Row>
            <Row label="Doctor Order Set:" lw={130}>
              {readOnly
                ? <input style={ro} value={orderSetNm} readOnly />
                : <Dropdown value={orderSetId} options={orderSets} loading={dropLoading}
                    onChange={(id, nm) => { setOrderSetId(id); setOrderSetNm(nm) }} />
              }
            </Row>
          </div>

          {/* RIGHT COLUMN — split into pricing (left) and quote meta (right) */}
          <div style={{
            padding: '0 8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 12px',
          }}>
            {/* Pricing left sub-column */}
            <div>
              {/* Normal Pricing checkbox row */}
              <div style={{ display: 'flex', alignItems: 'center', minHeight: INPUT_H + 2, gap: 4, marginBottom: ROW_GAP }}>
                <input
                  type="checkbox"
                  id="normalPricing"
                  checked={normalPricing}
                  onChange={e => setNormalPricing(e.target.checked)}
                  disabled={readOnly}
                  style={{ marginLeft: 4, cursor: readOnly ? 'default' : 'pointer', accentColor: '#5B4A2E' }}
                />
                <label htmlFor="normalPricing" style={{ fontSize: F, color: TEXT, cursor: readOnly ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                  Normal Pricing
                </label>
              </div>
              <Row label="Different Pricing:" lw={124}>
                {readOnly || normalPricing
                  ? <input style={ro} value={diffPricingNm} readOnly />
                  : <input style={base} value={diffPricingId}
                      onChange={e => { setDiffPricingId(e.target.value); setDiffPricingNm(e.target.value) }}
                      placeholder="Pricing code…" />
                }
              </Row>
              <Row label="Employer:" lw={124}>
                {readOnly
                  ? <input style={ro} value={employerNm} readOnly />
                  : <Dropdown value={employerId} options={employers} loading={dropLoading}
                      onChange={(id, nm) => { setEmployerId(id); setEmployerNm(nm) }} placeholder="None" />
                }
              </Row>
              <Row label="Discount Package/Membership:" lw={184}>
                {readOnly
                  ? <input style={ro} value={discPkgNm} readOnly />
                  : <Dropdown value={discPkgId} options={discPkgs} loading={dropLoading}
                      onChange={(id, nm) => { setDiscPkgId(id); setDiscPkgNm(nm) }} placeholder="None" />
                }
              </Row>
              <Row label="Insurance/Company/Sponsor:" lw={172}>
                {readOnly
                  ? <input style={ro} value={insName} readOnly />
                  : <Dropdown value={insId} options={insurers} loading={dropLoading}
                      onChange={(id, nm) => { setInsId(id); setInsName(nm) }} />
                }
              </Row>
              {/* Marketing Package row — also has Apply and Create GOP buttons */}
              <div style={{ display: 'flex', alignItems: 'center', minHeight: INPUT_H + 2, gap: 4, marginBottom: ROW_GAP }}>
                <span style={{
                  width: 124, minWidth: 124, fontSize: F, color: TEXT, textAlign: 'right', paddingRight: 4, flexShrink: 0,
                }}>
                  Marketing Package:
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {readOnly
                    ? <input style={ro} value={mktPkgNm} readOnly />
                    : <Dropdown value={mktPkgId} options={mktPkgs} loading={dropLoading}
                        onChange={(id, nm) => { setMktPkgId(id); setMktPkgNm(nm) }} placeholder="None" />
                  }
                </div>
              </div>
            </div>

            {/* Quote meta right sub-column */}
            <div>
              <Row label="Quote Number:" lw={104}>
                <input style={ro} value={quoteNum || '(auto)'} readOnly />
              </Row>
              <Row label="Quote Date:" lw={104}>
                <input type="date" style={readOnly ? ro : base} value={quoteDate} onChange={e => setQuoteDate(e.target.value)} readOnly={readOnly} />
              </Row>
              <Row label="Status:" lw={104}>
                <input style={ro} value={quoteStat} readOnly />
              </Row>
              <Row label="User:" lw={104}>
                <input style={ro} value={userName} readOnly />
              </Row>
              <Row label="Total Net Amt.:" lw={104}>
                <input style={{ ...ro, fontWeight: 600 }} value={totalNet.toFixed(2)} readOnly />
              </Row>
              {/* Action buttons row — right-aligned, matches HIS "Apply" position */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                {!readOnly && (
                  <>
                    <button style={btn} onClick={resetForm}>New</button>
                    <button style={btn} onClick={() => doSave()} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button style={btn} onClick={handleApply} disabled={applying}>
                      {applying ? '…' : 'Apply'}
                    </button>
                    {isGopEligible && (
                      <button style={btnPrimary} onClick={handleCreateGop} disabled={gopBusy}>
                        {gopBusy ? '…' : 'Create GOP'}
                      </button>
                    )}
                  </>
                )}
                {readOnly && (
                  <button style={btn} onClick={resetForm}>New Quote</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Quote Items Table ───────────────────────────── */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div style={{ padding: '3px 8px', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, fontSize: F }}>
            Quote Items
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: F, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 28, textAlign: 'center' }}> </th>
                  {['Department','Type','Code','Unit','Price','Amount','Discount','Net Amount'].map(h => (
                    <th key={h} style={{ ...th, textAlign: ['Unit','Price','Amount','Discount','Net Amount'].includes(h) ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                  {!readOnly && <th style={{ ...th, width: 24 }} />}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={readOnly ? 9 : 10} style={{ ...td, height: 48, textAlign: 'center', color: MUTED, fontStyle: 'italic' }}>
                      No items — click Apply to load from HIS, or add rows manually
                    </td>
                  </tr>
                )}
                {rows.map((r, idx) => (
                  <tr key={r._k} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8F4EE' }}>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <input type="checkbox" style={{ accentColor: '#5B4A2E' }} />
                    </td>
                    <td style={td}>{r.department}</td>
                    <td style={{ ...td, color: MUTED, fontSize: 11 }}>{r.type}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{r.code}</td>
                    <td style={{ ...td, textAlign: 'right', width: 52 }}>
                      {readOnly ? r.unit : (
                        <input type="number" min={1} value={r.unit}
                          onChange={e => updateRow(r._k, 'unit', e.target.value)}
                          style={{ ...base, width: 44, textAlign: 'right', height: 20 }}
                        />
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.price.toFixed(2)}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.amount.toFixed(2)}</td>
                    <td style={{ ...td, textAlign: 'right', width: 72 }}>
                      {readOnly ? r.discount.toFixed(2) : (
                        <input type="number" min={0} value={r.discount}
                          onChange={e => updateRow(r._k, 'discount', e.target.value)}
                          style={{ ...base, width: 64, textAlign: 'right', height: 20 }}
                        />
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.netAmount.toFixed(2)}</td>
                    {!readOnly && (
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button
                          onClick={() => setRows(prev => prev.filter(x => x._k !== r._k))}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, lineHeight: 1, padding: 0 }}
                        >×</button>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Add row button */}
                {!readOnly && (
                  <tr>
                    <td colSpan={10} style={{ ...td, padding: '2px 6px' }}>
                      <button
                        onClick={() => setRows(prev => [...prev, {
                          _k: String(++keyRef.current),
                          department: deptName, type: '', code: '', description: 'Manual item',
                          unit: 1, price: 0, amount: 0, discount: 0, netAmount: 0,
                        }])}
                        style={{ ...btn, fontSize: 11, height: 20, padding: '0 8px' }}
                      >
                        + Add Row
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 4: Bottom list panel ───────────────────────────── */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          {/* Filter row — exact HIS pattern */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: F, color: TEXT }}>Date:</span>
            <span style={{ fontSize: F, color: TEXT }}>From</span>
            <input type="date" value={listFrom} onChange={e => setListFrom(e.target.value)}
              style={{ ...base, width: 120 }} />
            <span style={{ fontSize: F, color: TEXT }}>To</span>
            <input type="date" value={listTo} onChange={e => setListTo(e.target.value)}
              style={{ ...base, width: 120 }} />
            <button style={btn} onClick={handleFilter} disabled={listLoading}>
              {listLoading ? '…' : 'Filter'}
            </button>
          </div>

          {/* Results table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: F, minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 24 }}> </th>
                  <th style={th}>Quote Number</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total Net Amt.</th>
                  <th style={th}>Quote Date ↓</th>
                  <th style={th}>CPI</th>
                  <th style={th}>Patient Name</th>
                  <th style={th}>Phone #</th>
                  <th style={th}>User</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {listRows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...td, height: 48, textAlign: 'center', color: MUTED, fontStyle: 'italic' }}>
                      No records — click Filter to search
                    </td>
                  </tr>
                )}
                {listRows.map((r, idx) => (
                  <tr
                    key={r.id as string}
                    onClick={() => handleOpenQuote(r.id as string)}
                    style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8F4EE', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EDE8DC')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#F8F4EE')}
                  >
                    <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" style={{ accentColor: '#5B4A2E' }} readOnly /></td>
                    <td style={{ ...td, fontFamily: 'monospace', color: '#1D4E89', fontWeight: 600 }}>{r.quoteNumber}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(r.totalNetAmount).toFixed(2)}</td>
                    <td style={td}>{r.quoteDate ? String(r.quoteDate).slice(0, 10) : '—'}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{r.cpiId || '—'}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{r.patientName}</td>
                    <td style={{ ...td, color: MUTED }}>{r.phoneNumber || '—'}</td>
                    <td style={{ ...td, color: MUTED }}>{r.createdByName || '—'}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '0 6px',
                        fontSize: 11, fontWeight: 600,
                        background:
                          r.status === 'DRAFT'       ? '#E0DDD8' :
                          r.status === 'FINALISED'   ? '#D4E2F2' :
                          r.status === 'GOP_CREATED' ? '#D4EDDA' : '#E0DDD8',
                        color:
                          r.status === 'DRAFT'       ? '#4A4240' :
                          r.status === 'FINALISED'   ? '#1D4E89' :
                          r.status === 'GOP_CREATED' ? '#2D6A4F' : '#4A4240',
                        border: `1px solid ${BORDER}`,
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR — pinned to bottom, matches HIS chrome ─────────── */}
      <div style={{
        flexShrink: 0, height: 24, background: SBAR_BG,
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', padding: '0 8px',
        fontSize: 11, color: MUTED, gap: 0, userSelect: 'none',
      }}>
        {/* Left: search icon + status */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke={MUTED} strokeWidth="1.2"/>
            <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke={MUTED} strokeWidth="1.2"/>
          </svg>
          None
        </span>
        <span style={{ margin: '0 8px', width: 1, height: 14, background: BORDER, display: 'inline-block' }} />
        <span>{listCount} Record{listCount !== 1 ? 's' : ''}</span>

        {/* Right: user | system | datetime */}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="4" r="2.2" stroke={MUTED} strokeWidth="1"/>
              <path d="M1 10c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke={MUTED} strokeWidth="1" fill="none"/>
            </svg>
            {userName || '—'}
          </span>
          <span style={{ width: 1, height: 12, background: BORDER, display: 'inline-block' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="1" y="2" width="9" height="8" rx="1" stroke={MUTED} strokeWidth="1"/>
              <line x1="3" y1="1" x2="3" y2="3" stroke={MUTED} strokeWidth="1"/>
              <line x1="8" y1="1" x2="8" y2="3" stroke={MUTED} strokeWidth="1"/>
            </svg>
            GOP Automation
          </span>
          <span style={{ width: 1, height: 12, background: BORDER, display: 'inline-block' }} />
          <StatusClock />
        </span>
      </div>
    </div>
  )
}

/** Live clock in the status bar */
function StatusClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setT(d.toLocaleDateString('en-GB',{ day:'2-digit', month:'2-digit', year:'numeric' }) +
          ' ' + d.toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit' }))
    }
    fmt(); const id = setInterval(fmt, 10000); return () => clearInterval(id)
  }, [])
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke="#6B5E4A" strokeWidth="1"/>
        <line x1="5.5" y1="3" x2="5.5" y2="5.5" stroke="#6B5E4A" strokeWidth="1"/>
        <line x1="5.5" y1="5.5" x2="7.5" y2="7" stroke="#6B5E4A" strokeWidth="1"/>
      </svg>
      {t}
    </span>
  )
}
