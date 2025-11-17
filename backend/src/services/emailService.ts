import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com'
    const mailUser = process.env.MAIL_USER
    const mailPass = process.env.MAIL_PASS

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: mailUser && mailPass ? {
        user: mailUser,
        pass: mailPass
      } : undefined
    })
  }

  async sendShortlistEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    interviewLink: string | null
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #2D2DDD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName},</p>
      <p>Great news! You've been shortlisted for the position of <strong>${data.jobTitle}</strong>.</p>
      ${data.interviewLink ? `
      <p>Interview details will be shared soon. Meeting link: <a href="${data.interviewLink}">${data.interviewLink}</a></p>
      ` : ''}
      <p>We'll notify you about the interview time shortly.</p>
      <p>Best regards,<br>${data.companyName} Team</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Congratulations!

Hi ${data.candidateName},

Great news! You've been shortlisted for the position of ${data.jobTitle}.

${data.interviewLink ? `Interview link: ${data.interviewLink}` : 'Interview details will be shared soon.'}

We'll notify you about the interview time shortly.

Best regards,
${data.companyName} Team
    `

    await this.sendEmail({
      to: data.candidateEmail,
      subject: `Congratulations! You've been shortlisted for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendRejectionEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #666; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName},</p>
      <p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position.</p>
      <p>After careful review, we have decided to move forward with other candidates at this time.</p>
      <p>We appreciate your interest and wish you the best in your job search.</p>
      <p>Best regards,<br>${data.companyName} Team</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Application Update

Hi ${data.candidateName},

Thank you for your interest in the ${data.jobTitle} position.

After careful review, we have decided to move forward with other candidates at this time.

We appreciate your interest and wish you the best in your job search.

Best regards,
${data.companyName} Team
    `

    await this.sendEmail({
      to: data.candidateEmail,
      subject: `Application Update - ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendHRNotification(data: {
    hrEmail: string
    candidateName: string
    candidateEmail: string
    jobTitle: string
    companyName: string
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Applicant Received</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>A new application has been received for <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${data.candidateName}</p>
      <p><strong>Email:</strong> ${data.candidateEmail}</p>
      <p>The candidate is being processed and scored. You'll receive updates once the evaluation is complete.</p>
      <p>Best regards,<br>HireBit System</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
New Applicant Received

A new application has been received for ${data.jobTitle}.

Candidate: ${data.candidateName}
Email: ${data.candidateEmail}

The candidate is being processed and scored. You'll receive updates once the evaluation is complete.

Best regards,
HireBit System
    `

    await this.sendEmail({
      to: data.hrEmail,
      subject: `New Applicant Received for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendEmail(data: {
    to: string
    subject: string
    html: string
    text: string
  }) {
    try {
      const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@hirebit.com'
      
      await this.transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text
      })

      logger.info(`Email sent to ${data.to}: ${data.subject}`)
    } catch (error) {
      logger.error(`Failed to send email to ${data.to}:`, error)
      throw error
    }
  }
}

