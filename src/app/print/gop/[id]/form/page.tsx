'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useGopStore } from '@/lib/gop-store'
import {
  getQuestionnaireById,
  getPatientById,
  getCoverageByPatientId,
  formatPatientName,
  MOCK_PREFILL_RESPONSE,
  type QuestionnaireItem,
} from '@/lib/mock-data'

function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 800)
    return () => clearTimeout(t)
  }, [])
  return null
}

function renderFieldValue(
  item: QuestionnaireItem,
  prefillMap: Record<string, { value: string | boolean | number; aiPrefilled: boolean; humanVerified: boolean }>
): string {
  const entry = prefillMap[item.linkId]
  if (!entry) return '________________________________'
  const val = entry.value
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (val === '' || val === null || val === undefined) return '________________________________'
  return String(val)
}

export default function GOPFormPrintPage() {
  const params = useParams()
  const id = params.id as string
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  useEffect(() => { setGeneratedAt(new Date().toISOString()) }, [])

  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  if (!req) notFound()

  const questionnaire = getQuestionnaireById(req.questionnaireId)
  if (!questionnaire) notFound()

  const patient    = getPatientById(req.patientId)
  const coverage   = getCoverageByPatientId(req.patientId)
  const prefill    = MOCK_PREFILL_RESPONSE[req.id] ?? []

  // Build prefill map
  const prefillMap: Record<string, { value: string | boolean | number; aiPrefilled: boolean; humanVerified: boolean }> = {}
  prefill.forEach(a => {
    prefillMap[a.linkId] = { value: a.answer, aiPrefilled: a.aiPrefilled, humanVerified: a.humanVerified }
  })

  // Patient fields
  if (patient) {
    prefillMap['patient-name'] = prefillMap['patient-name'] ?? { value: formatPatientName(patient), aiPrefilled: false, humanVerified: true }
    prefillMap['patient-dob']  = prefillMap['patient-dob']  ?? { value: patient.birthDate, aiPrefilled: false, humanVerified: true }
    prefillMap['patient-gender'] = prefillMap['patient-gender'] ?? { value: patient.gender, aiPrefilled: false, humanVerified: true }
    const nationalId = patient.identifier.find(i => i.system.includes('national'))
    if (nationalId) prefillMap['patient-national-id'] = prefillMap['patient-national-id'] ?? { value: nationalId.value, aiPrefilled: false, humanVerified: true }
  }

  // Coverage fields
  if (coverage) {
    prefillMap['policy-number']  = prefillMap['policy-number']  ?? { value: coverage.policyNumber,        aiPrefilled: false, humanVerified: true }
    prefillMap['membership-id']  = prefillMap['membership-id']  ?? { value: coverage.membershipId,        aiPrefilled: false, humanVerified: true }
    prefillMap['plan-name']      = { value: coverage.planName,        aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-start'] = { value: coverage.coverageDates?.start ?? coverage.period?.start ?? '', aiPrefilled: false, humanVerified: true }
    prefillMap['coverage-end']   = { value: coverage.coverageDates?.end   ?? coverage.period?.end   ?? '', aiPrefilled: false, humanVerified: true }
    prefillMap['policy-no']      = prefillMap['policy-no'] ?? { value: coverage.policyNumber, aiPrefilled: false, humanVerified: true }
  }

  // Cost fields — derived from req.lineItems (authoritative source)
  if (req.lineItems?.length) {
    const lineTotal    = +req.lineItems.reduce((s, i) => s + i.netAmount, 0).toFixed(2)
    const coPayPercent = coverage?.coPayPercent ?? 0
    const coPayAmt     = +((lineTotal * coPayPercent) / 100).toFixed(2)
    prefillMap['total-estimate'] = { value: lineTotal, aiPrefilled: false, humanVerified: true }
    prefillMap['total-cost']     = { value: lineTotal, aiPrefilled: false, humanVerified: true }
    prefillMap['copay-amount']   = prefillMap['copay-amount'] ?? { value: coPayAmt, aiPrefilled: false, humanVerified: true }
  }

  const fmt = (d: string) => {
    if (!d || d === '________________________________') return d
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return d
    }
  }

  const fmtValue = (item: QuestionnaireItem, val: string) => {
    if (item.type === 'date' && val !== '________________________________') return fmt(val)
    if (item.type === 'decimal' && val !== '________________________________') {
      const n = parseFloat(val)
      if (!isNaN(n) && (item.linkId.includes('cost') || item.linkId.includes('estimate') || item.linkId.includes('copay'))) {
        return '$' + n.toLocaleString()
      }
    }
    return val
  }

  return (
    <>
      <PrintTrigger />
      <style>{`
        @media print {
          @page { margin: 20mm; size: A4; }
          body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px; max-width: 800px; margin: 0 auto; }
        .print-btn { position: fixed; top: 16px; right: 16px; padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .header-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #111; }
        .logo { font-size: 14px; font-weight: bold; color: #444; }
        h1 { font-size: 18px; font-weight: bold; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .section-header { background: #f5f5f5; padding: 8px 12px; font-size: 12px; font-weight: 700; color: #333; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 8px; }
        .section-body { padding: 8px 12px; }
        .field-row { display: grid; grid-template-columns: 220px 1fr; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: start; }
        .field-row:last-child { border-bottom: none; }
        .field-label { font-size: 11px; color: #666; padding-top: 1px; }
        .field-label .req { color: #dc2626; margin-left: 2px; }
        .field-value { font-size: 12px; font-weight: 500; border-bottom: 1px solid #999; min-height: 20px; padding: 0 2px 1px; }
        .field-value.blank { color: transparent; }
        .field-value.filled { color: #111; }
        .ai-tag { display: inline-block; font-size: 9px; font-weight: 700; background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; border-radius: 99px; padding: 0 4px; margin-left: 4px; vertical-align: middle; }
        .verified-tag { display: inline-block; font-size: 9px; font-weight: 700; background: #dcfce7; color: #166534; border: 1px solid #86efac; border-radius: 99px; padding: 0 4px; margin-left: 4px; vertical-align: middle; }
        .pending-tag { display: inline-block; font-size: 9px; font-weight: 700; background: #fef9c3; color: #854d0e; border: 1px solid #fde047; border-radius: 99px; padding: 0 4px; margin-left: 4px; vertical-align: middle; }
        .sign-block { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 32px; padding-top: 16px; border-top: 2px solid #ddd; }
        .sign-field { text-align: center; }
        .sign-line { border-top: 1px solid #333; margin-bottom: 4px; height: 40px; }
        .sign-label { font-size: 10px; color: #666; }
        .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 99px; font-size: 10px; font-weight: 600; }
        .badge-approved { background: #dcfce7; color: #166534; }
        .badge-submitted { background: #dbeafe; color: #1e40af; }
        .badge-draft { background: #fef9c3; color: #854d0e; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
      `}</style>

      <button className="print-btn no-print" onClick={() => window.print()}>Print / Save PDF</button>

      {/* Header */}
      <div className="header-bar">
        <div>
          <div className="logo">Intercare Hospital</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>GOP Automation System — Phase 1</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#888' }}>Reference</div>
          <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: 13 }}>
            GOP ${req.id.toUpperCase()}
            <br />
            <span style={{ fontSize: 12, fontFamily: 'monospace' }}>Quote Number: ${req.quoteNumber} | Quote Date: ${req.quoteDate.split('-').reverse().join('/')}</span>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Generated {generatedAt ? fmt(generatedAt) : ''}</div>
        </div>
      </div>

      <h1>{questionnaire.title}</h1>
      <div className="meta">
        Insurer: <strong>{req.insurer}</strong> &nbsp;·&nbsp;
        Version: {questionnaire.version} &nbsp;·&nbsp;
        Status: <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span> &nbsp;·&nbsp;
        Patient: <strong>{req.patientName}</strong>
        {req.doctorVerified && <> &nbsp;·&nbsp; <span style={{ color: '#166534' }}>✓ Physician Verified</span></>}
      </div>

      {/* Questionnaire Sections */}
      {questionnaire.item.map((section) => (
        <div className="section" key={section.linkId}>
          <div className="section-header">
            {section.text}
          </div>
          <div className="section-body">
            {(section.item ?? []).map((field) => {
              const raw = renderFieldValue(field, prefillMap)
              const display = fmtValue(field, raw)
              const entry = prefillMap[field.linkId]
              const isAi = entry?.aiPrefilled ?? false
              const isVerified = entry?.humanVerified ?? false
              const hasValue = raw !== '________________________________'
              return (
                <div className="field-row" key={field.linkId}>
                  <div className="field-label">
                    {field.text}
                    {field.required && <span className="req">*</span>}
                  </div>
                  <div>
                    <div className={`field-value ${hasValue ? 'filled' : 'blank'}`}>
                      {display}
                    </div>
                    {hasValue && (
                      <div style={{ marginTop: 2 }}>
                        {isAi && <span className="ai-tag">AI</span>}
                        {isAi && (isVerified
                          ? <span className="verified-tag">Verified</span>
                          : <span className="pending-tag">Pending</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Instrument & Operational Components — placeholder section */}
      <div style={{ marginBottom: 20, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ background: '#f5f5f5', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#333', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 8 }}>
          Instrument &amp; Operational Components
          <span style={{ marginLeft: 'auto', display: 'inline-block', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>TBC</span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {/* Amber warning banner */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 4, border: '1px solid #fcd34d', background: '#fffbeb', padding: '6px 10px', marginBottom: 10, fontSize: 11, color: '#92400e' }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
            <span>This section is pending clinical confirmation. Contents may change.</span>
          </div>
          {/* Table */}
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', paddingBottom: 6, color: '#666', fontWeight: 600 }}>Item</th>
                <th style={{ textAlign: 'left', paddingBottom: 6, color: '#666', fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: 'right', paddingBottom: 6, color: '#666', fontWeight: 600 }}>Qty</th>
                <th style={{ textAlign: 'left', paddingBottom: 6, paddingLeft: 12, color: '#666', fontWeight: 600 }}>Unit</th>
                <th style={{ textAlign: 'left', paddingBottom: 6, paddingLeft: 12, color: '#666', fontWeight: 600 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '5px 0' }}>Surgical instrument set</td>
                <td style={{ padding: '5px 0', color: '#666' }}>Instruments</td>
                <td style={{ padding: '5px 0', textAlign: 'right', color: '#666' }}>1</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#666' }}>Set</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#888', fontStyle: 'italic' }}>e.g. laparoscopic kit</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '5px 0' }}>Anaesthesia consumables</td>
                <td style={{ padding: '5px 0', color: '#666' }}>Consumables</td>
                <td style={{ padding: '5px 0', textAlign: 'right', color: '#666' }}>1</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#666' }}>Kit</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#888', fontStyle: 'italic' }}>e.g. breathing circuit</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0' }}>Operating theatre setup</td>
                <td style={{ padding: '5px 0', color: '#666' }}>Operational</td>
                <td style={{ padding: '5px 0', textAlign: 'right', color: '#666' }}>1</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#666' }}>Session</td>
                <td style={{ padding: '5px 0', paddingLeft: 12, color: '#888', fontStyle: 'italic' }}>e.g. room prep fee</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 8, fontSize: 10, color: '#999', fontStyle: 'italic' }}>
            TBC — pending Debbie confirmation. Do not use for actual billing.
          </p>
        </div>
      </div>

      {/* Signature Block */}
      <div className="sign-block">
        <div className="sign-field">
          <div className="sign-line" />
          <div className="sign-label">Attending Physician Signature</div>
          {req.assignedSurgeon && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{req.assignedSurgeon}</div>}
        </div>
        <div className="sign-field">
          <div className="sign-line" />
          <div className="sign-label">Date</div>
        </div>
        <div className="sign-field">
          <div className="sign-line" />
          <div className="sign-label">Hospital Authorised Stamp</div>
        </div>
      </div>

      <div className="footer">
        This form is generated by the Intercare Hospital GOP Automation System (Phase 1 — Demo/Mock Data). Not a legally binding document.
        &nbsp;·&nbsp; {req.id.toUpperCase()} &nbsp;·&nbsp; {generatedAt}
      </div>
    </>
  )
}
