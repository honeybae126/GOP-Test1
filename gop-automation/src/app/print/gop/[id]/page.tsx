'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  getPatientById,
  getCoverageByPatientId,
  getEncounterById,
  getCostEstimateByEncounterId,
  formatPatientName,
  calculateAge,
  MOCK_PREFILL_RESPONSE,
} from '@/lib/mock-data'
import { useGopStore } from '@/lib/gop-store'
import { notFound } from 'next/navigation'

function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 800)
    return () => clearTimeout(t)
  }, [])
  return null
}

export default function GOPPrintPage() {
  const params = useParams()
  const id = params.id as string
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  useEffect(() => { setGeneratedAt(new Date().toISOString()) }, [])

  const req = useGopStore((s) => s.requests.find((r) => r.id === id))
  if (!req) notFound()

  const patient    = getPatientById(req.patientId)
  const coverage   = getCoverageByPatientId(req.patientId)
  const encounter  = getEncounterById(req.encounterId)
  const estimate   = getCostEstimateByEncounterId(req.encounterId)
  const prefill    = MOCK_PREFILL_RESPONSE[req.id] ?? []

  const isRejected = req.status === 'REJECTED'

  // Find rejection audit entry for timestamp and reason
  const rejectionEntry = req.auditLog
    ?.filter(e => e.action === 'REQUEST_REJECTED')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]

  // Timestamp: audit entry is authoritative; resolvedAt is fallback for legacy data
  const rejectionTimestamp = rejectionEntry?.performedAt ?? req.resolvedAt
  // Reason: audit entry detail is the immutable original reason.
  // req.notes is NOT used — it is mutable and may have been edited after rejection.
  const rejectionReason = rejectionEntry?.detail ?? null

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const fmtFull = (d: string) =>
    new Date(d).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <>
      <PrintTrigger />
      <style>{`
        @media print {
          @page { margin: 20mm; size: A4; }
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 20px; font-weight: bold; margin: 0 0 4px; }
        h2 { font-size: 13px; font-weight: bold; margin: 0 0 8px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .section { margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
        .label { color: #666; }
        .value { font-weight: 500; text-align: right; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 6px 8px; background: #f5f5f5; font-weight: 600; font-size: 11px; color: #555; border-bottom: 2px solid #ddd; }
        th.right, td.right { text-align: right; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        tfoot td { border-top: 2px solid #ddd; font-weight: 600; padding-top: 8px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 99px; font-size: 10px; font-weight: 600; }
        .badge-approved { background: #dcfce7; color: #166534; }
        .badge-submitted { background: #dbeafe; color: #1e40af; }
        .badge-draft { background: #fef9c3; color: #854d0e; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
        .header-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #111; }
        .logo { font-size: 14px; font-weight: bold; color: #444; }
        .print-btn { position: fixed; top: 16px; right: 16px; padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .rejected-banner { background: #dc2626; color: #fff; text-align: center; padding: 10px 16px; margin-bottom: 20px; font-size: 13px; font-weight: bold; letter-spacing: 0.04em; text-transform: uppercase; }
        .rejection-box { background: #fff5f5; border: 1px solid #fca5a5; padding: 12px 16px; margin-bottom: 20px; }
        .rejection-box h2 { color: #991b1b; border-bottom-color: #fca5a5; }
        .rejection-box .row { border-bottom-color: #fecaca; }
        .rejection-box .label { color: #b91c1c; }
        .rejection-box .value { color: #991b1b; }
      `}</style>

      <button className="print-btn no-print" onClick={() => window.print()}>Print / Save PDF</button>

      {/* REJECTED banner — only for rejected requests */}
      {isRejected && (
        <div className="rejected-banner">
          REJECTED — This guarantee of payment request was not approved.
        </div>
      )}

      {/* Header */}
      <div className="header-bar">
        <div>
          <div className="logo">Intercare Hospital</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>GOP Automation System — Phase 1</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#888' }}>Reference</div>
          <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: 13 }}>{req.id.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Generated {generatedAt ? fmt(generatedAt) : '—'}</div>
        </div>
      </div>

      <h1>Guarantee of Payment Request</h1>
      <div className="meta">
        Insurer: <strong>{req.insurer}</strong> &nbsp;·&nbsp;
        Status: <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span> &nbsp;·&nbsp;
        Created: {fmt(req.createdAt)}
        {req.approvedAmount && <> &nbsp;·&nbsp; Approved Amount: <strong>${req.approvedAmount.toLocaleString()}</strong></>}
      </div>

      {/* Rejection details — REJECTED requests only */}
      {isRejected && (
        <div className="rejection-box section">
          <h2>Rejection Details</h2>
          <div className="row">
            <span className="label">Rejection Date</span>
            <span className="value">{rejectionTimestamp ? fmtFull(rejectionTimestamp) : '—'}</span>
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <span className="label">Rejection Reason</span>
            <span className="value" style={{ maxWidth: 420, textAlign: 'right' }}>
              {rejectionReason ?? 'No reason recorded.'}
            </span>
          </div>
        </div>
      )}

      <div className="grid">
        {/* Patient */}
        <div className="section">
          <h2>Patient Information</h2>
          {patient && (
            <>
              <div className="row"><span className="label">Full Name</span><span className="value">{formatPatientName(patient)}</span></div>
              <div className="row"><span className="label">Date of Birth</span><span className="value">{fmt(patient.birthDate)}</span></div>
              <div className="row"><span className="label">Age / Gender</span><span className="value">{calculateAge(patient.birthDate)} yrs · {patient.gender}</span></div>
              {patient.identifier.map(id => (
                <div className="row" key={id.system}>
                  <span className="label">{id.system.includes('national') ? 'National ID' : 'Hospital ID'}</span>
                  <span className="value" style={{ fontFamily: 'monospace' }}>{id.value}</span>
                </div>
              ))}
              {patient.telecom.find(t => t.system === 'phone') && (
                <div className="row"><span className="label">Phone</span><span className="value">{patient.telecom.find(t => t.system === 'phone')?.value}</span></div>
              )}
            </>
          )}
        </div>

        {/* Coverage */}
        <div className="section">
          <h2>Insurance Coverage</h2>
          {coverage ? (
            <>
              <div className="row"><span className="label">Plan</span><span className="value">{coverage.planName}</span></div>
              <div className="row"><span className="label">Policy No.</span><span className="value" style={{ fontFamily: 'monospace' }}>{coverage.policyNumber}</span></div>
              <div className="row"><span className="label">Member ID</span><span className="value" style={{ fontFamily: 'monospace' }}>{coverage.membershipId}</span></div>
              <div className="row"><span className="label">Co-Pay</span><span className="value">{coverage.coPayPercent}%</span></div>
            </>
          ) : <div style={{ color: '#999', fontSize: 11 }}>No coverage data.</div>}
        </div>

        {/* Encounter */}
        <div className="section">
          <h2>Clinical Encounter</h2>
          {encounter ? (
            <>
              <div className="row"><span className="label">Reason</span><span className="value">{encounter.reasonCode?.[0]?.text}</span></div>
              <div className="row"><span className="label">Facility</span><span className="value">{encounter.serviceProvider.display}</span></div>
              <div className="row"><span className="label">Class</span><span className="value">{encounter.class.display}</span></div>
              <div className="row"><span className="label">Date</span><span className="value">{fmt(encounter.period.start)}</span></div>
              <div className="row"><span className="label">Physician</span><span className="value">{encounter.participant[0]?.individual.display}</span></div>
            </>
          ) : <div style={{ color: '#999', fontSize: 11 }}>No encounter data.</div>}
        </div>

        {/* Workflow */}
        <div className="section">
          <h2>Workflow Status</h2>
          <div className="row"><span className="label">Assigned Doctor</span><span className="value">{req.assignedDoctor}</span></div>
          <div className="row"><span className="label">Doctor Verified</span><span className="value">{req.doctorVerified ? 'Yes' : 'No'}</span></div>
          <div className="row"><span className="label">Staff Finalised</span><span className="value">{req.staffFinalised ? 'Yes' : 'No'}</span></div>
          {req.notes && <div className="row"><span className="label">Notes</span><span className="value" style={{ maxWidth: 200, textAlign: 'right' }}>{req.notes}</span></div>}
        </div>
      </div>

      {/* Cost Estimate */}
      {estimate && (
        <div className="section">
          <h2>Cost Estimate (ANZER)</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Code</th>
                <th className="right">Qty</th>
                <th className="right">Unit Price</th>
                <th className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td style={{ fontFamily: 'monospace', color: '#666' }}>{item.code ?? '—'}</td>
                  <td className="right">{item.quantity}</td>
                  <td className="right">${item.unitPrice.toLocaleString()}</td>
                  <td className="right">${item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right' }}>Subtotal</td>
                <td className="right">${estimate.total.toLocaleString()}</td>
              </tr>
              {coverage && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'normal', color: '#666' }}>
                    Patient Co-Pay ({coverage.coPayPercent}%)
                  </td>
                  <td className="right" style={{ fontWeight: 'normal' }}>${estimate.coPayAmount.toLocaleString()}</td>
                </tr>
              )}
              {req.approvedAmount && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right' }}>Approved Amount</td>
                  <td className="right" style={{ color: '#166534' }}>${req.approvedAmount.toLocaleString()}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}

      {/* Form Answers */}
      {prefill.length > 0 && (
        <div className="section">
          <h2>Pre-Authorisation Form Answers</h2>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Answer</th>
                <th>Source</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {prefill.filter(a => a.answer !== '').map(a => (
                <tr key={a.linkId}>
                  <td style={{ textTransform: 'capitalize' }}>{a.linkId.replace(/-/g, ' ')}</td>
                  <td style={{ fontWeight: 500 }}>
                    {typeof a.answer === 'boolean' ? (a.answer ? 'Yes' : 'No') : String(a.answer)}
                  </td>
                  <td>{a.aiPrefilled ? 'AI' : 'Manual'}</td>
                  <td>{a.humanVerified ? 'Yes' : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer">
        This document is generated from the Intercare Hospital GOP Automation System (Phase 1 — Demo/Mock Data).
        It is not a legally binding document. &nbsp;·&nbsp; {req.id.toUpperCase()} &nbsp;·&nbsp; {generatedAt}
      </div>
    </>
  )
}
