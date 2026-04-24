'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HisOption { id: string; name: string }
interface HisDoctor { id: string; name: string; specialty: string | null }
interface HisProcedure { code: string; name: string }
interface HisDiagnosis { code: string; description: string }
interface HisPriceItem { code: string; description: string; unitPrice: number; type: string | null; department: string | null }

interface QuoteItem {
  _key: string
  department: string
  type: string
  code: string
  description: string
  unit: number
  price: number
  amount: number
  discount: number
  netAmount: number
}

interface PatientResult { patientId: string; fullName: string; dob: string; nric: string }

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormRow({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', minHeight: 28,
      background: highlight ? 'rgba(59,130,246,0.05)' : undefined,
      padding: '1px 0',
    }}>
      <label style={{
        width: 140, minWidth: 140, fontSize: '0.75rem', fontWeight: 500,
        color: 'var(--muted-foreground)', textAlign: 'right', paddingRight: 8,
        flexShrink: 0, lineHeight: 1.3,
      }}>
        {label}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 26, padding: '0 6px',
  border: '1px solid var(--border)', borderRadius: 2,
  fontSize: '0.8125rem', background: 'var(--input)',
  color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: 20,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
  appearance: 'none', WebkitAppearance: 'none',
}
const readonlyStyle: React.CSSProperties = {
  ...inputStyle, background: 'var(--secondary)', color: 'var(--muted-foreground)', cursor: 'default',
}

function Sel({ value, onChange, options, placeholder = 'Select…', loading = false }: {
  value: string; onChange: (v: string, label?: string) => void
  options: HisOption[]; placeholder?: string; loading?: boolean
}) {
  return (
    <select
      style={selectStyle}
      value={value}
      onChange={e => {
        const opt = options.find(o => o.id === e.target.value)
        onChange(e.target.value, opt?.name)
      }}
    >
      <option value="">{loading ? 'Loading…' : placeholder}</option>
      {!loading && options.length === 0 && <option disabled>No items found</option>}
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  )
}

function BtnSmall({ onClick, children, variant = 'secondary', disabled = false }: {
  onClick?: () => void; children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean
}) {
  const bg = variant === 'primary' ? 'var(--primary)' : variant === 'danger' ? '#8B2500' : 'var(--secondary)'
  const color = variant === 'secondary' ? 'var(--foreground)' : '#FFFFFF'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 26, padding: '0 12px', borderRadius: 2, fontSize: '0.8125rem',
        fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer',
        background: bg, color, border: `1px solid ${variant === 'secondary' ? 'var(--border)' : bg}`,
        opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 4,
        transition: 'background 0.12s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─── Quote Items Table ─────────────────────────────────────────────────────────

function QuoteItemsTable({
  items, onUpdate, onDelete, onAdd, readOnly,
}: {
  items: QuoteItem[]
  onUpdate: (key: string, field: 'unit' | 'discount', value: number) => void
  onDelete: (key: string) => void
  onAdd: () => void
  readOnly: boolean
}) {
  const total = items.reduce((s, r) => s + r.netAmount, 0)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 3, background: '#FFF', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
              {['Department','Type','Code','Description','Unit','Price','Amount','Discount','Net Amount'].map(h => (
                <th key={h} style={{
                  padding: '4px 8px', textAlign: h === 'Unit' || h === 'Price' || h === 'Amount' || h === 'Discount' || h === 'Net Amount' ? 'right' : 'left',
                  fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderRight: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
              {!readOnly && <th style={{ padding: '4px 6px', width: 28 }} />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                  No items — click Apply to load pricing from HIS, or Add Item to enter manually.
                </td>
              </tr>
            )}
            {items.map((row, idx) => (
              <tr key={row._key} style={{ background: idx % 2 === 1 ? 'var(--secondary)' : undefined, borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0' }}>{row.department || '—'}</td>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{row.type || '—'}</td>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{row.code}</td>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0' }}>{row.description}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', borderRight: '1px solid #f0f0f0', width: 60 }}>
                  {readOnly ? row.unit : (
                    <input
                      type="number" min={1} value={row.unit}
                      onChange={e => onUpdate(row._key, 'unit', Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ ...inputStyle, width: 52, textAlign: 'right', height: 22 }}
                    />
                  )}
                </td>
                <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #f0f0f0', fontVariantNumeric: 'tabular-nums' }}>
                  {row.price.toFixed(2)}
                </td>
                <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #f0f0f0', fontVariantNumeric: 'tabular-nums' }}>
                  {row.amount.toFixed(2)}
                </td>
                <td style={{ padding: '3px 4px', textAlign: 'right', borderRight: '1px solid #f0f0f0', width: 80 }}>
                  {readOnly ? row.discount.toFixed(2) : (
                    <input
                      type="number" min={0} value={row.discount}
                      onChange={e => onUpdate(row._key, 'discount', Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ ...inputStyle, width: 72, textAlign: 'right', height: 22 }}
                    />
                  )}
                </td>
                <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {row.netAmount.toFixed(2)}
                </td>
                {!readOnly && (
                  <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                    <button onClick={() => onDelete(row._key)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1 }}
                    >×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--secondary)', borderTop: '2px solid var(--border)' }}>
              <td colSpan={8} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, fontSize: '0.8125rem' }}>
                Total Net Amount
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>
                {total.toFixed(2)}
              </td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
      {!readOnly && (
        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <BtnSmall onClick={onAdd}>
            <i className="fas fa-plus" style={{ fontSize: '0.625rem' }} /> Add Item
          </BtnSmall>
        </div>
      )}
    </div>
  )
}

// ─── Bottom list panel ─────────────────────────────────────────────────────────

function QuoteListPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [statusF, setStatusF]     = useState('')
  const [cpiF, setCpiF]           = useState('')
  const [rows, setRows]           = useState<Record<string, string>[]>([])
  const [loading, setLoading]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (dateFrom) sp.set('dateFrom', dateFrom)
      if (dateTo)   sp.set('dateTo', dateTo)
      if (statusF)  sp.set('status', statusF)
      if (cpiF)     sp.set('cpi', cpiF)
      const res = await fetch(`/api/billing/quotes?${sp}`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch { toast.error('Could not load quotes.') }
    finally { setLoading(false) }
  }, [dateFrom, dateTo, statusF, cpiF])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const STATUS_BADGE: Record<string, string> = {
    DRAFT: '#6B6B6B', FINALISED: '#1D4E89', GOP_CREATED: '#2D6A4F',
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 3, background: '#FFF', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '8px 12px', background: 'var(--secondary)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>From</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ height: 24, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8125rem', width: 128 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>To</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ height: 24, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8125rem', width: 128 }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ ...selectStyle, height: 24, width: 120 }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINALISED">Finalised</option>
          <option value="GOP_CREATED">GOP Created</option>
        </select>
        <input placeholder="CPI / Patient…" value={cpiF} onChange={e => setCpiF(e.target.value)}
          style={{ height: 24, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8125rem', width: 140 }} />
        <BtnSmall onClick={load} variant="primary">
          <i className="fas fa-filter" style={{ fontSize: '0.625rem' }} /> Filter
        </BtnSmall>
        <BtnSmall onClick={() => { setDateFrom(''); setDateTo(''); setStatusF(''); setCpiF(''); setTimeout(load, 0) }}>
          Clear
        </BtnSmall>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          {loading ? 'Loading…' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Results table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
              {['Quote No.','Net Amt.','Quote Date','CPI','Patient Name','Phone','User','Status',''].map(h => (
                <th key={h} style={{
                  padding: '4px 8px', textAlign: 'left', fontSize: '0.6875rem',
                  fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No quotes found. Use the filter above or create a new quote.
              </td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.id as string}
                style={{ background: idx % 2 === 1 ? 'var(--secondary)' : undefined, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => onOpen(r.id as string)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(91,95,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 1 ? 'var(--secondary)' : '')}
              >
                <td style={{ padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, borderRight: '1px solid #f0f0f0' }}>{r.quoteNumber}</td>
                <td style={{ padding: '3px 8px', fontVariantNumeric: 'tabular-nums', fontWeight: 500, borderRight: '1px solid #f0f0f0' }}>{Number(r.totalNetAmount).toFixed(2)}</td>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0', fontSize: '0.75rem' }}>{r.quoteDate ? String(r.quoteDate).slice(0, 10) : '—'}</td>
                <td style={{ padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', borderRight: '1px solid #f0f0f0' }}>{r.cpiId || '—'}</td>
                <td style={{ padding: '3px 8px', fontWeight: 500, borderRight: '1px solid #f0f0f0' }}>{r.patientName}</td>
                <td style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', borderRight: '1px solid #f0f0f0' }}>{r.phoneNumber || '—'}</td>
                <td style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', borderRight: '1px solid #f0f0f0' }}>{r.createdByName || '—'}</td>
                <td style={{ padding: '3px 8px', borderRight: '1px solid #f0f0f0' }}>
                  <span style={{
                    display: 'inline-block', padding: '1px 7px', borderRadius: 2,
                    fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
                    color: '#FFFFFF', background: STATUS_BADGE[r.status as string] ?? '#6B6B6B',
                  }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '3px 6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Open →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main billing form ─────────────────────────────────────────────────────────

export function BillingForm() {
  const { data: session } = useSession()
  const router = useRouter()

  // ── Quote identity
  const [quoteId, setQuoteId]           = useState<string | null>(null)
  const [quoteNumber, setQuoteNumber]   = useState('')
  const [quoteStatus, setQuoteStatus]   = useState<'DRAFT'|'FINALISED'|'GOP_CREATED'>('DRAFT')
  const [quoteDate, setQuoteDate]       = useState(() => new Date().toISOString().slice(0, 10))

  // ── Patient fields
  const [cpiInput, setCpiInput]         = useState('')
  const [cpiId, setCpiId]               = useState('')
  const [patientName, setPatientName]   = useState('')
  const [dob, setDob]                   = useState('')
  const [gender, setGender]             = useState('')
  const [phone, setPhone]               = useState('')

  // ── Clinical fields
  const [deptId, setDeptId]             = useState('')
  const [deptName, setDeptName]         = useState('')
  const [doctorId, setDoctorId]         = useState('')
  const [doctorName, setDoctorName]     = useState('')
  const [los, setLos]                   = useState('')
  const [procCode, setProcCode]         = useState('')
  const [procName, setProcName]         = useState('')
  const [diagCode, setDiagCode]         = useState('')
  const [diagDesc, setDiagDesc]         = useState('')
  const [diagQuery, setDiagQuery]       = useState('')
  const [diagResults, setDiagResults]   = useState<HisDiagnosis[]>([])
  const [showDiagDrop, setShowDiagDrop] = useState(false)
  const [provDiag, setProvDiag]         = useState('')
  const [orderSetId, setOrderSetId]     = useState('')
  const [orderSetName, setOrderSetName] = useState('')

  // ── Pricing fields
  const [pricingType, setPricingType]   = useState<'NORMAL'|'DIFFERENT'>('NORMAL')
  const [diffPricingId, setDiffPricingId] = useState('')
  const [employerId, setEmployerId]     = useState('')
  const [employerName, setEmployerName] = useState('')
  const [insurerId, setInsurerId]       = useState('')
  const [insurerName, setInsurerName]   = useState('')
  const [discPkgId, setDiscPkgId]       = useState('')
  const [discPkgName, setDiscPkgName]   = useState('')
  const [mktPkgId, setMktPkgId]         = useState('')
  const [mktPkgName, setMktPkgName]     = useState('')

  // ── HIS dropdown data
  const [departments, setDepartments]   = useState<HisOption[]>([])
  const [doctors, setDoctors]           = useState<HisDoctor[]>([])
  const [procedures, setProcedures]     = useState<HisProcedure[]>([])
  const [orderSets, setOrderSets]       = useState<HisOption[]>([])
  const [employers, setEmployers]       = useState<HisOption[]>([])
  const [insurers, setInsurers]         = useState<HisOption[]>([])
  const [discPkgs, setDiscPkgs]         = useState<HisOption[]>([])
  const [mktPkgs, setMktPkgs]           = useState<HisOption[]>([])
  const [loading, setLoading]           = useState<Record<string, boolean>>({})

  // ── Quote items
  const [items, setItems]               = useState<QuoteItem[]>([])
  const keyRef                          = useRef(0)

  // ── CPI search state
  const [cpiResults, setCpiResults]     = useState<PatientResult[]>([])
  const [showCpiDrop, setShowCpiDrop]   = useState(false)
  const [cpiLoading, setCpiLoading]     = useState(false)
  const cpiDebounce                     = useRef<ReturnType<typeof setTimeout>|null>(null)

  // ── Async op states
  const [saving, setSaving]             = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [gopLoading, setGopLoading]     = useState(false)

  const readOnly = quoteStatus !== 'DRAFT'
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null
  const totalNet = items.reduce((s, r) => s + r.netAmount, 0)
  const isGopEligible = ['AIA','ASSURNET'].some(n => insurerName.toUpperCase().includes(n))

  // ── Helper: timeout-safe fetch from HIS endpoint
  const hisFetch = useCallback(async (url: string): Promise<unknown[] | null> => {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 5000)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      const data = await res.json()
      if (data.offline) return null
      return Array.isArray(data) ? data : (data.results ?? [])
    } catch { return null }
    finally { clearTimeout(timeout) }
  }, [])

  // ── Load all static dropdowns on mount
  useEffect(() => {
    const load = async () => {
      setLoading(prev => ({ ...prev, all: true }))
      const [depts, docs, sets, emps, ins, disc, mkt] = await Promise.all([
        hisFetch('/api/his/departments'),
        hisFetch('/api/his/doctors'),
        hisFetch('/api/his/doctor-order-sets'),
        hisFetch('/api/his/employers'),
        hisFetch('/api/his/insurers'),
        hisFetch('/api/his/discount-packages'),
        hisFetch('/api/his/marketing-packages'),
      ])
      if (depts) setDepartments(depts as HisOption[])
      if (docs)  setDoctors(docs as HisDoctor[])
      if (sets)  setOrderSets(sets as HisOption[])
      if (emps)  setEmployers(emps as HisOption[])
      if (ins)   setInsurers(ins as HisOption[])
      if (disc)  setDiscPkgs(disc as HisOption[])
      if (mkt)   setMktPkgs(mkt as HisOption[])
      setLoading(prev => ({ ...prev, all: false }))
    }
    load()
  }, [hisFetch])

  // ── Load procedures when department changes
  useEffect(() => {
    if (!deptId) { setProcedures([]); return }
    setLoading(prev => ({ ...prev, procs: true }))
    hisFetch(`/api/his/procedures?department=${encodeURIComponent(deptId)}`)
      .then(r => { if (r) setProcedures(r as HisProcedure[]) })
      .finally(() => setLoading(prev => ({ ...prev, procs: false })))
  }, [deptId, hisFetch])

  // ── CPI debounced search
  const handleCpiInput = (v: string) => {
    setCpiInput(v)
    setShowCpiDrop(true)
    if (cpiDebounce.current) clearTimeout(cpiDebounce.current)
    if (v.length < 2) { setCpiResults([]); return }
    setCpiLoading(true)
    cpiDebounce.current = setTimeout(async () => {
      const ctrl = new AbortController()
      setTimeout(() => ctrl.abort(), 5000)
      try {
        const res = await fetch(`/api/his/patients?q=${encodeURIComponent(v)}`, { signal: ctrl.signal })
        const data = await res.json()
        setCpiResults(Array.isArray(data) ? data : (data.results ?? []))
      } catch { setCpiResults([]) }
      finally { setCpiLoading(false) }
    }, 350)
  }

  const handleCpiSelect = async (pt: PatientResult) => {
    setCpiInput(pt.fullName)
    setCpiId(pt.patientId)
    setPatientName(pt.fullName)
    setDob(pt.dob)
    setShowCpiDrop(false)
    // Load insurance
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 5000)
    try {
      const res = await fetch(`/api/his/patient?nric=${encodeURIComponent(pt.nric)}`, { signal: ctrl.signal })
      const data = await res.json()
      if (data.found) {
        if (data.patient?.contactNumber) setPhone(data.patient.contactNumber)
        if (data.insurance?.policyNumber) {
          // auto-select insurer if code matches
          const code = data.insurance.insurerCode?.toUpperCase() ?? ''
          const match = insurers.find(i => i.name.toUpperCase().includes(code) || code.includes(i.name.toUpperCase()))
          if (match) { setInsurerId(match.id); setInsurerName(match.name) }
        }
      }
    } catch { /* silent */ }
  }

  // ── Diagnosis type-ahead
  useEffect(() => {
    if (diagQuery.length < 2) { setDiagResults([]); return }
    const t = setTimeout(async () => {
      const ctrl = new AbortController()
      setTimeout(() => ctrl.abort(), 5000)
      try {
        const res = await fetch(`/api/his/diagnosis?q=${encodeURIComponent(diagQuery)}`, { signal: ctrl.signal })
        const data = await res.json()
        setDiagResults(Array.isArray(data) ? data : (data.results ?? []))
      } catch { setDiagResults([]) }
    }, 350)
    return () => clearTimeout(t)
  }, [diagQuery])

  // ── Apply — load pricing from HIS and populate items
  const handleApply = async () => {
    setApplyLoading(true)
    try {
      const params = new URLSearchParams({
        type: pricingType.toLowerCase(),
        ...(insurerId ? { insurerId } : {}),
        ...(procCode  ? { procedureCode: procCode } : {}),
        ...(deptId    ? { deptId } : {}),
      })
      const res = await fetch(`/api/his/pricing?${params}`)
      const data = await res.json()
      if (data.offline) {
        toast.error('HIS is offline — pricing cannot be loaded. Please enter items manually.')
        return
      }
      const priceItems: HisPriceItem[] = Array.isArray(data) ? data : []
      if (priceItems.length === 0) {
        toast('No pricing items found for the selected criteria.')
        return
      }
      const newItems: QuoteItem[] = priceItems.map(p => {
        const amt = p.unitPrice
        return {
          _key: String(++keyRef.current),
          department: p.department ?? deptName,
          type:        p.type ?? '',
          code:        p.code,
          description: p.description,
          unit: 1,
          price: p.unitPrice,
          amount: amt,
          discount: 0,
          netAmount: amt,
        }
      })
      setItems(prev => [...prev, ...newItems])
      toast.success(`${newItems.length} pricing item${newItems.length !== 1 ? 's' : ''} loaded from HIS.`)
    } catch {
      toast.error('Failed to load pricing from HIS.')
    } finally { setApplyLoading(false) }
  }

  // ── Update item unit or discount
  const handleItemUpdate = (key: string, field: 'unit' | 'discount', value: number) => {
    setItems(prev => prev.map(r => {
      if (r._key !== key) return r
      const unit     = field === 'unit'     ? value : r.unit
      const discount = field === 'discount' ? value : r.discount
      const amount   = unit * r.price
      return { ...r, unit, discount, amount, netAmount: Math.max(0, amount - discount) }
    }))
  }

  // ── Add blank item manually
  const handleAddItem = () => {
    setItems(prev => [...prev, {
      _key: String(++keyRef.current),
      department: deptName, type: '', code: '', description: 'Manual item',
      unit: 1, price: 0, amount: 0, discount: 0, netAmount: 0,
    }])
  }

  // ── Save Draft
  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        cpiId, patientName, dob: dob || null, gender: gender || null, phoneNumber: phone || null,
        departmentId: deptId || null, departmentName: deptName || null,
        attendingDoctorId: doctorId || null, attendingDoctorName: doctorName || null,
        lengthOfStay: los ? parseInt(los) : null,
        procedureCode: procCode || null, procedureName: procName || null,
        diagnosisCode: diagCode || null, diagnosisDescription: diagDesc || null,
        provisionalDiagnosis: provDiag || null,
        doctorOrderSetId: orderSetId || null, doctorOrderSetName: orderSetName || null,
        pricingType, differentPricingId: diffPricingId || null,
        employerId: employerId || null, employerName: employerName || null,
        insurerId, insurerName,
        discountPackageId: discPkgId || null, discountPackageName: discPkgName || null,
        marketingPackageId: mktPkgId || null, marketingPackageName: mktPkgName || null,
        quoteDate, totalNetAmount: totalNet,
        items: items.map(({ _key, ...rest }) => rest),
      }

      if (quoteId) {
        await fetch(`/api/billing/quotes/${quoteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        toast.success('Quote saved.')
      } else {
        const res  = await fetch('/api/billing/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setQuoteId(data.id)
        setQuoteNumber(data.quoteNumber)
        toast.success(`Quote ${data.quoteNumber} created.`)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save quote.')
    } finally { setSaving(false) }
  }

  // ── Finalise
  const handleFinalise = async () => {
    if (!quoteId) { toast.error('Save the quote first.'); return }
    if (!confirm('Finalise this quote? Items will be locked.')) return
    try {
      const res = await fetch(`/api/billing/quotes/${quoteId}/finalise`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setQuoteStatus('FINALISED')
      toast.success('Quote finalised.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed.') }
  }

  // ── Create GOP
  const handleCreateGop = async () => {
    if (!quoteId) { await handleSave(); return }
    setGopLoading(true)
    try {
      const res  = await fetch(`/api/billing/quotes/${quoteId}/create-gop`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuoteStatus('GOP_CREATED')
      toast.success('GOP request created. Opening form…')
      router.push(`/gop/${data.gopRequestId}/form`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create GOP request.')
    } finally { setGopLoading(false) }
  }

  // ── Open quote from list
  const handleOpenQuote = async (id: string) => {
    try {
      const res  = await fetch(`/api/billing/quotes/${id}`)
      const data = await res.json()
      setQuoteId(data.id); setQuoteNumber(data.quoteNumber)
      setQuoteStatus(data.status); setQuoteDate(data.quoteDate?.slice(0, 10) ?? '')
      setCpiId(data.cpiId ?? ''); setCpiInput(data.patientName ?? '')
      setPatientName(data.patientName ?? ''); setDob(data.dob?.slice(0, 10) ?? '')
      setGender(data.gender ?? ''); setPhone(data.phoneNumber ?? '')
      setDeptId(data.departmentId ?? ''); setDeptName(data.departmentName ?? '')
      setDoctorId(data.attendingDoctorId ?? ''); setDoctorName(data.attendingDoctorName ?? '')
      setLos(data.lengthOfStay != null ? String(data.lengthOfStay) : '')
      setProcCode(data.procedureCode ?? ''); setProcName(data.procedureName ?? '')
      setDiagCode(data.diagnosisCode ?? ''); setDiagDesc(data.diagnosisDescription ?? '')
      setProvDiag(data.provisionalDiagnosis ?? '')
      setOrderSetId(data.doctorOrderSetId ?? ''); setOrderSetName(data.doctorOrderSetName ?? '')
      setPricingType(data.pricingType === 'DIFFERENT' ? 'DIFFERENT' : 'NORMAL')
      setDiffPricingId(data.differentPricingId ?? '')
      setEmployerId(data.employerId ?? ''); setEmployerName(data.employerName ?? '')
      setInsurerId(data.insurerId ?? ''); setInsurerName(data.insurerName ?? '')
      setDiscPkgId(data.discountPackageId ?? ''); setDiscPkgName(data.discountPackageName ?? '')
      setMktPkgId(data.marketingPackageId ?? ''); setMktPkgName(data.marketingPackageName ?? '')
      setItems((data.items ?? []).map((it: Record<string, unknown>, i: number) => ({
        _key: String(++keyRef.current + i),
        department: it.department ?? '', type: it.type ?? '', code: it.code ?? '',
        description: it.description ?? '', unit: Number(it.unit ?? 1),
        price: Number(it.price ?? 0), amount: Number(it.amount ?? 0),
        discount: Number(it.discount ?? 0), netAmount: Number(it.netAmount ?? 0),
      })))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { toast.error('Failed to load quote.') }
  }

  // ── Section divider
  const SectionLabel = ({ label }: { label: string }) => (
    <div style={{
      fontSize: '0.6875rem', fontWeight: 700, color: 'var(--muted-foreground)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4, marginTop: 10,
    }}>
      {label}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Header bar ── */}
      <div style={{
        background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 3,
        padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {quoteNumber ? `Quote: ${quoteNumber}` : 'New Quotation'}
          </span>
          {quoteStatus !== 'DRAFT' && (
            <span style={{
              marginLeft: 10, padding: '1px 8px', borderRadius: 2,
              fontSize: '0.6875rem', fontWeight: 600, color: '#FFF',
              background: quoteStatus === 'FINALISED' ? '#1D4E89' : '#2D6A4F',
            }}>
              {quoteStatus.replace('_', ' ')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {readOnly ? (
            <BtnSmall onClick={() => { setQuoteId(null); setQuoteNumber(''); setQuoteStatus('DRAFT'); setItems([]) }}>
              New Quote
            </BtnSmall>
          ) : (
            <>
              <BtnSmall onClick={handleApply} disabled={applyLoading}>
                {applyLoading ? '…' : <><i className="fas fa-bolt" style={{ fontSize: '0.625rem' }} /> Apply</>}
              </BtnSmall>
              <BtnSmall onClick={handleSave} variant="secondary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Draft'}
              </BtnSmall>
              {quoteId && (
                <BtnSmall onClick={handleFinalise} variant="primary">
                  Finalise
                </BtnSmall>
              )}
              {isGopEligible && (
                <BtnSmall onClick={handleCreateGop} variant="primary" disabled={gopLoading}>
                  {gopLoading ? '…' : <><i className="fas fa-file-medical" style={{ fontSize: '0.625rem' }} /> Create GOP Request</>}
                </BtnSmall>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Top form (3 columns) ── */}
      <div style={{
        background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 3,
        padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px',
      }}>

        {/* LEFT COLUMN */}
        <div>
          <SectionLabel label="Patient Information" />

          {/* CPI with search */}
          <FormRow label="CPI">
            <div style={{ display: 'flex', position: 'relative' }}>
              <input
                style={{ ...inputStyle, borderRadius: '2px 0 0 2px', borderRight: 'none', flex: 1 }}
                value={cpiInput}
                onChange={e => handleCpiInput(e.target.value)}
                onFocus={() => setShowCpiDrop(true)}
                onBlur={() => setTimeout(() => setShowCpiDrop(false), 200)}
                placeholder="CPI or name…"
                disabled={readOnly}
              />
              <button
                style={{ height: 26, padding: '0 8px', border: '1px solid var(--border)', borderRadius: '0 2px 2px 0', background: 'var(--secondary)', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => cpiInput.length >= 2 && handleCpiInput(cpiInput)}
                disabled={readOnly}
              >
                {cpiLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
              </button>
              {showCpiDrop && cpiResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#FFF', border: '1px solid var(--border)', borderRadius: 2, boxShadow: 'var(--shadow-md)',
                  maxHeight: 180, overflowY: 'auto',
                }}>
                  {cpiResults.map(pt => (
                    <div key={pt.patientId}
                      onMouseDown={() => handleCpiSelect(pt)}
                      style={{ padding: '5px 8px', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid var(--border)' }}
                    >
                      <span style={{ fontWeight: 500 }}>{pt.fullName}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{pt.nric}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>
          <FormRow label="Patient Name"><input style={readOnly ? readonlyStyle : inputStyle} value={patientName} onChange={e => setPatientName(e.target.value)} readOnly={readOnly} /></FormRow>
          <FormRow label="Date of Birth"><input type="date" style={readOnly ? readonlyStyle : inputStyle} value={dob} onChange={e => setDob(e.target.value)} readOnly={readOnly} /></FormRow>
          <FormRow label="Gender">
            {readOnly ? <input style={readonlyStyle} value={gender} readOnly /> : (
              <select style={selectStyle} value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select…</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            )}
          </FormRow>
          <FormRow label="Age"><input style={readonlyStyle} value={age !== null ? `${age} yrs` : ''} readOnly /></FormRow>
          <FormRow label="Phone No."><input style={readOnly ? readonlyStyle : inputStyle} value={phone} onChange={e => setPhone(e.target.value)} readOnly={readOnly} /></FormRow>
          <FormRow label="Department">
            {readOnly ? <input style={readonlyStyle} value={deptName} readOnly /> : (
              <Sel value={deptId} options={departments} loading={loading.all}
                onChange={(id, name) => { setDeptId(id); setDeptName(name ?? '') }} />
            )}
          </FormRow>
        </div>

        {/* MIDDLE COLUMN */}
        <div>
          <SectionLabel label="Clinical Details" />
          <FormRow label="Attending Doctor">
            {readOnly ? <input style={readonlyStyle} value={doctorName} readOnly /> : (
              <Sel value={doctorId} options={doctors.map(d => ({ id: d.id, name: d.specialty ? `${d.name} (${d.specialty})` : d.name }))}
                loading={loading.all}
                onChange={(id, name) => {
                  setDoctorId(id)
                  const d = doctors.find(x => x.id === id)
                  setDoctorName(d?.name ?? name ?? '')
                }} />
            )}
          </FormRow>
          <FormRow label="Length of Stay"><input style={readOnly ? readonlyStyle : inputStyle} type="number" min={0} value={los} onChange={e => setLos(e.target.value)} readOnly={readOnly} placeholder="Days" /></FormRow>
          <FormRow label="Procedure">
            {readOnly ? <input style={readonlyStyle} value={procName} readOnly /> : (
              <Sel value={procCode}
                options={procedures.map(p => ({ id: p.code, name: p.name }))}
                loading={loading.procs}
                placeholder={deptId ? 'Select procedure…' : 'Select department first'}
                onChange={(id, name) => { setProcCode(id); setProcName(name ?? '') }} />
            )}
          </FormRow>

          {/* Diagnosis type-ahead */}
          <FormRow label="Diagnosis">
            <div style={{ position: 'relative' }}>
              <input
                style={readOnly ? readonlyStyle : inputStyle}
                value={diagQuery || (diagCode ? `${diagCode} — ${diagDesc}` : '')}
                onChange={e => { setDiagQuery(e.target.value); setShowDiagDrop(true) }}
                onFocus={() => setShowDiagDrop(true)}
                onBlur={() => setTimeout(() => setShowDiagDrop(false), 200)}
                placeholder="Type ICD-10 code or description…"
                readOnly={readOnly}
              />
              {showDiagDrop && diagResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#FFF', border: '1px solid var(--border)', borderRadius: 2, boxShadow: 'var(--shadow-md)',
                  maxHeight: 180, overflowY: 'auto',
                }}>
                  {diagResults.map(d => (
                    <div key={d.code}
                      onMouseDown={() => { setDiagCode(d.code); setDiagDesc(d.description); setDiagQuery(''); setShowDiagDrop(false) }}
                      style={{ padding: '5px 8px', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid var(--border)' }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginRight: 8 }}>{d.code}</span>
                      {d.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>
          <FormRow label="Provisional Diag."><input style={readOnly ? readonlyStyle : inputStyle} value={provDiag} onChange={e => setProvDiag(e.target.value)} readOnly={readOnly} /></FormRow>
          <FormRow label="Doctor Order Set">
            {readOnly ? <input style={readonlyStyle} value={orderSetName} readOnly /> : (
              <Sel value={orderSetId} options={orderSets} loading={loading.all}
                onChange={(id, name) => { setOrderSetId(id); setOrderSetName(name ?? '') }} />
            )}
          </FormRow>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <SectionLabel label="Pricing &amp; Insurance" />
          <FormRow label="Pricing Type">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', height: 26 }}>
              {(['NORMAL','DIFFERENT'] as const).map(pt => (
                <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', cursor: readOnly ? 'default' : 'pointer' }}>
                  <input type="radio" name="pricingType" value={pt} checked={pricingType === pt} onChange={() => !readOnly && setPricingType(pt)} disabled={readOnly} style={{ cursor: readOnly ? 'default' : 'pointer' }} />
                  {pt === 'NORMAL' ? 'Normal' : 'Different'}
                </label>
              ))}
            </div>
          </FormRow>
          {pricingType === 'DIFFERENT' && (
            <FormRow label="Different Pricing">
              {readOnly ? <input style={readonlyStyle} value={diffPricingId} readOnly /> : (
                <input style={inputStyle} value={diffPricingId} onChange={e => setDiffPricingId(e.target.value)} placeholder="Pricing ID…" />
              )}
            </FormRow>
          )}
          <FormRow label="Employer">
            {readOnly ? <input style={readonlyStyle} value={employerName} readOnly /> : (
              <Sel value={employerId} options={employers} loading={loading.all}
                onChange={(id, name) => { setEmployerId(id); setEmployerName(name ?? '') }} placeholder="No employer" />
            )}
          </FormRow>
          <FormRow label="Discount Package">
            {readOnly ? <input style={readonlyStyle} value={discPkgName} readOnly /> : (
              <Sel value={discPkgId} options={discPkgs} loading={loading.all}
                onChange={(id, name) => { setDiscPkgId(id); setDiscPkgName(name ?? '') }} placeholder="None" />
            )}
          </FormRow>
          <FormRow label="Insurer / Sponsor" highlight>
            {readOnly ? <input style={readonlyStyle} value={insurerName} readOnly /> : (
              <Sel value={insurerId} options={insurers} loading={loading.all}
                onChange={(id, name) => { setInsurerId(id); setInsurerName(name ?? '') }} />
            )}
          </FormRow>
          <FormRow label="Marketing Package">
            {readOnly ? <input style={readonlyStyle} value={mktPkgName} readOnly /> : (
              <Sel value={mktPkgId} options={mktPkgs} loading={loading.all}
                onChange={(id, name) => { setMktPkgId(id); setMktPkgName(name ?? '') }} placeholder="None" />
            )}
          </FormRow>

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
          <FormRow label="Quote Number"><input style={readonlyStyle} value={quoteNumber || '(auto-generated)'} readOnly /></FormRow>
          <FormRow label="Quote Date"><input type="date" style={readOnly ? readonlyStyle : inputStyle} value={quoteDate} onChange={e => setQuoteDate(e.target.value)} readOnly={readOnly} /></FormRow>
          <FormRow label="Status"><input style={readonlyStyle} value={quoteStatus} readOnly /></FormRow>
          <FormRow label="User"><input style={readonlyStyle} value={session?.user?.name ?? session?.user?.email ?? ''} readOnly /></FormRow>
          <FormRow label="Total Net Amt.">
            <input style={{ ...readonlyStyle, fontWeight: 700, color: 'var(--foreground)' }} value={totalNet.toFixed(2)} readOnly />
          </FormRow>
        </div>
      </div>

      {/* ── Quote Items Table ── */}
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--foreground)' }}>Quote Items</div>
        <QuoteItemsTable
          items={items}
          onUpdate={handleItemUpdate}
          onDelete={key => setItems(prev => prev.filter(r => r._key !== key))}
          onAdd={handleAddItem}
          readOnly={readOnly}
        />
      </div>

      {/* ── Bottom list panel ── */}
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--foreground)' }}>All Quotations</div>
        <QuoteListPanel onOpen={handleOpenQuote} />
      </div>
    </div>
  )
}
