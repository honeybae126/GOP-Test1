import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP env vars not configured — skipping email send')
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      auth: { user, pass },
    })
    await transporter.sendMail({
      from: `"GOP Automation" <${user}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('[email] Failed to send email:', error)
  }
}
