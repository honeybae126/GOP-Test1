const HOSPITAL_NAME = 'Intercare Hospital — GOP Automation'

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>GOP Automation</title></head>
<body style="font-family:sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin-bottom:4px">${HOSPITAL_NAME}</h2>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:24px"/>
  ${content}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:32px"/>
  <p style="font-size:12px;color:#6b7280">This is an automated message from the GOP Automation System. Do not reply.</p>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `<p style="margin-top:24px">
    <a href="${url}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">${label}</a>
  </p>`
}

export function requestAssignedEmail(data: {
  doctorName: string
  patientName: string
  insurerName: string
  requestId: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `GOP Request Assigned — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.doctorName},</p>
      <p>A GOP request for patient <strong>${data.patientName}</strong> (Insurer: ${data.insurerName}) has been assigned to you for physician verification.</p>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}

export function requestVerifiedEmail(data: {
  staffName: string
  patientName: string
  doctorName: string
  requestId: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `GOP Request Verified — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.staffName},</p>
      <p>Dr. ${data.doctorName} has verified the GOP request for patient <strong>${data.patientName}</strong>. The request is ready for your review and submission.</p>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}

export function requestCorrectionEmail(data: {
  staffName: string
  patientName: string
  doctorName: string
  correctionNotes: string
  requestId: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `Corrections Requested — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.staffName},</p>
      <p>Dr. ${data.doctorName} has requested corrections on the GOP request for patient <strong>${data.patientName}</strong>.</p>
      <p><strong>Correction notes:</strong></p>
      <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151">${data.correctionNotes}</blockquote>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}

export function requestApprovedEmail(data: {
  recipientName: string
  patientName: string
  insurerName: string
  requestId: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `GOP Request Approved — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.recipientName},</p>
      <p>The GOP request for patient <strong>${data.patientName}</strong> has been <strong style="color:#16a34a">approved</strong> by ${data.insurerName}.</p>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}

export function requestRejectedEmail(data: {
  recipientName: string
  patientName: string
  insurerName: string
  rejectionReason: string
  requestId: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `GOP Request Rejected — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.recipientName},</p>
      <p>The GOP request for patient <strong>${data.patientName}</strong> has been <strong style="color:#dc2626">rejected</strong> by ${data.insurerName}.</p>
      <p><strong>Reason:</strong></p>
      <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151">${data.rejectionReason}</blockquote>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}

export function requestExpiredEmail(data: {
  recipientName: string
  patientName: string
  insurerName: string
  requestId: string
  expiredAt: string
  requestUrl: string
}): { subject: string; html: string } {
  return {
    subject: `GOP Request Expired — ${data.patientName}`,
    html: baseLayout(`
      <p>Dear ${data.recipientName},</p>
      <p>The GOP request for patient <strong>${data.patientName}</strong> (Insurer: ${data.insurerName}) has <strong style="color:#d97706">expired</strong>.</p>
      <p>Expired at: ${data.expiredAt}</p>
      <p>Request ID: <code>${data.requestId}</code></p>
      ${ctaButton('View Request', data.requestUrl)}
    `),
  }
}
