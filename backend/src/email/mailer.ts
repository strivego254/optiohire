import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || 'localhost'
const port = Number(process.env.SMTP_PORT || 1025)
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''
const from = process.env.EMAIL_FROM || 'no-reply@hirebit.local'

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user ? { user, pass } : undefined
})

export async function sendEmail(opts: { to: string; subject: string; text?: string; html?: string; attachments?: Array<{ filename: string; content: Buffer }> }) {
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments
  })
}


