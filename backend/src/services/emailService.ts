import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'
import fs from 'fs/promises'
import path from 'path'
import { cleanJobTitle } from '../utils/jobTitle.js'

export class EmailService {
  private transporter: nodemailer.Transporter

  private logFile: string

  constructor() {
    const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
    const mailUser = process.env.MAIL_USER || process.env.SMTP_USER
    const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS
    const mailFrom = 'hirebitapplications@gmail.com'

    // Warn if credentials are missing
    if (!mailUser || !mailPass) {
      logger.warn('Email service initialized without authentication credentials. Emails will fail to send.')
      logger.warn('Please set MAIL_USER/SMTP_USER and MAIL_PASS/SMTP_PASS environment variables.')
      logger.warn('For Gmail, you must use an App Password (not your regular password).')
      logger.warn('Generate one at: https://myaccount.google.com/apppasswords')
    }

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false, // Use TLS
      auth: mailUser && mailPass ? {
        user: mailUser,
        pass: mailPass
      } : undefined,
      // Add connection timeout and retry options
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    })

    // Setup email log file
    this.logFile = path.join(process.cwd(), 'logs', 'email.log')
    this.ensureLogDirectory()

    // Verify connection on startup (non-blocking)
    this.verifyConnection().catch(err => {
      logger.warn('Email service connection verification failed:', err.message)
    })
  }

  /**
   * Verify SMTP connection and authentication
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      logger.info('Email service: SMTP connection verified successfully')
      return true
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      logger.error('Email service: SMTP connection verification failed:', errorMsg)
      
      if (errorMsg?.includes('Authentication Required') || error?.responseCode === 530) {
        logger.error('Gmail requires an App Password. Please:')
        logger.error('1. Enable 2-Step Verification on your Google account')
        logger.error('2. Go to https://myaccount.google.com/apppasswords')
        logger.error('3. Generate an App Password for "Mail"')
        logger.error('4. Set MAIL_PASS or SMTP_PASS environment variable to the 16-character App Password')
      }
      
      return false
    }
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private async logEmail(to: string, subject: string, status: 'sent' | 'failed', error?: string) {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] ${status.toUpperCase()} | To: ${to} | Subject: ${subject}${error ? ` | Error: ${error}` : ''}\n`
      await fs.appendFile(this.logFile, logEntry)
    } catch (error) {
      logger.error('Failed to write email log:', error)
    }
  }

  /**
   * Candidate Acknowledgment Email (SHORTLISTED)
   * sendAcknowledgement(email, jobTitle, meetingLink)
   */
  async sendAcknowledgement(data: {
    email: string
    jobTitle: string
    meetingLink: string | null
    candidateName?: string
    companyName?: string
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
      <p>Hi ${data.candidateName || 'Candidate'},</p>
      <p>Great news! You've been shortlisted for the position of <strong>${data.jobTitle}</strong>.</p>
      ${data.meetingLink ? `
      <p>Meeting link: <a href="${data.meetingLink}" class="button">Join Interview</a></p>
      <p><strong>Note:</strong> Interview time will be shared separately via email.</p>
      ` : '<p>Interview details will be shared soon via email.</p>'}
      <p>Best regards,<br>${data.companyName || 'Hiring Team'}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Congratulations!

Hi ${data.candidateName || 'Candidate'},

Great news! You've been shortlisted for the position of ${data.jobTitle}.

${data.meetingLink ? `Meeting link: ${data.meetingLink}\n\nNote: Interview time will be shared separately via email.` : 'Interview details will be shared soon via email.'}

Best regards,
${data.companyName || 'Hiring Team'}
    `

    await this.sendEmail({
      to: data.email,
      subject: `Congratulations! You've been shortlisted for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendShortlistEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    companyEmail?: string | null
    companyDomain?: string | null
    interviewLink: string | null
    interviewDate?: string | null
    interviewTime?: string | null
  }) {
    const hrEmail = data.companyEmail || 'hirebitapplications@gmail.com'
    const candidateName = data.candidateName || '[Candidate\'s Full Name]'
    const companyName = data.companyName || '[Company Name]'
    const cleanedJobTitle = cleanJobTitle(data.jobTitle || '[Job Title]')

    const subject = `Final Interview Invitation – ${cleanedJobTitle} at ${companyName}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Dear ${candidateName},</p>
    
    <p>Congratulations! After reviewing your application for the <strong>${cleanedJobTitle}</strong> position at <strong>${companyName}</strong>, we are pleased to inform you that you have been shortlisted for the next stage of our recruitment process.</p>
    
    <p>Your final interview has been scheduled as follows:</p>
    
    <p><strong>Interview Details:</strong></p>
    <p><strong>Position:</strong> ${cleanedJobTitle}</p>
    <p><strong>Company:</strong> ${companyName}</p>
    ${data.interviewDate ? `<p><strong>Date:</strong> ${data.interviewDate}</p>` : ''}
    ${data.interviewTime ? `<p><strong>Time:</strong> ${data.interviewTime}</p>` : ''}
    ${data.interviewLink ? `<p><strong>Meeting Link:</strong> <a href="${data.interviewLink}">${data.interviewLink}</a></p>` : ''}
    
    <p>During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.</p>
    
    <p>If you have any questions before the interview or need to make changes, feel free to contact our HR team at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
    
    <p>We look forward to meeting you and learning more about how you can contribute to our team. Thank you!</p>
    
    <p>Kind regards,<br>
    <strong>Company Name:</strong> ${companyName}<br>
    <strong>Company Email:</strong> ${hrEmail}</p>
  </div>
</body>
</html>
    `

    const text = `Dear ${candidateName},

Congratulations! After reviewing your application for the ${cleanedJobTitle} position at ${companyName}, we are pleased to inform you that you have been shortlisted for the next stage of our recruitment process.

Your final interview has been scheduled as follows:

Interview Details:

Position: ${cleanedJobTitle}

Company: ${companyName}

${data.interviewDate ? `Date: ${data.interviewDate}\n` : ''}${data.interviewTime ? `Time: ${data.interviewTime}\n` : ''}${data.interviewLink ? `Meeting Link: ${data.interviewLink}\n` : ''}
During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.

If you have any questions before the interview or need to make changes, feel free to contact our HR team at ${hrEmail}.

We look forward to meeting you and learning more about how you can contribute to our team. Thank you!

Kind regards,

Company Name: ${companyName}

Company Email: ${hrEmail}`

    // Generate from email: use company_email, companyDomain, or fallback
    const fromEmail = this.getCompanyEmail(data.companyEmail, data.companyDomain, data.companyName)
    
    await this.sendEmail({
      to: data.candidateEmail,
      from: fromEmail,
      subject,
      text,
      html: '' // Not used, but required by interface
    })
  }

  async sendRejectionEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    companyEmail?: string | null
    companyDomain?: string | null
  }) {
    const hrEmail = data.companyEmail || 'hirebitapplications@gmail.com'
    const candidateName = data.candidateName || '[Candidate\'s Full Name]'
    const companyName = data.companyName || '[Company Name]'
    const jobTitle = data.jobTitle || '[Job Title]'

    const subject = `Update on Your Application for the ${jobTitle} Position at ${companyName}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Dear ${candidateName},</p>
    
    <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for your interest in joining our team. We truly appreciate the effort you put into your application and the time you invested in the selection process.</p>
    
    <p>After careful consideration and review of all candidates, we regret to inform you that we will not be moving forward with your application at this time. This decision was not easy, as we received a high number of strong applications, including yours.</p>
    
    <p>Although you were not selected for this role, we encourage you to apply for future opportunities that match your skills and experience. Your profile is impressive, and we believe you may be a strong fit for upcoming positions within <strong>${companyName}</strong>.</p>
    
    <p>If you have any questions or would like feedback regarding your application, please feel free to contact us at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
    
    <p>We sincerely appreciate your interest in our company and wish you the very best in your job search and future career endeavors.</p>
    
    <p>Kind regards,<br>
    <strong>Company Name:</strong> ${companyName}<br>
    <strong>Company Email:</strong> ${hrEmail}</p>
  </div>
</body>
</html>
    `

    const text = `Dear ${candidateName},

Thank you for taking the time to apply for the ${jobTitle} position at ${companyName} and for your interest in joining our team. We truly appreciate the effort you put into your application and the time you invested in the selection process.

After careful consideration and review of all candidates, we regret to inform you that we will not be moving forward with your application at this time. This decision was not easy, as we received a high number of strong applications, including yours.

Although you were not selected for this role, we encourage you to apply for future opportunities that match your skills and experience. Your profile is impressive, and we believe you may be a strong fit for upcoming positions within ${companyName}.

If you have any questions or would like feedback regarding your application, please feel free to contact us at ${hrEmail}.

We sincerely appreciate your interest in our company and wish you the very best in your job search and future career endeavors.

Kind regards,

Company Name: ${companyName}
Company Email: ${hrEmail}`

    // Generate from email: use company_email, companyDomain, or fallback
    const fromEmail = this.getCompanyEmail(data.companyEmail, data.companyDomain, data.companyName)
    
    await this.sendEmail({
      to: data.candidateEmail,
      from: fromEmail,
      subject,
      text,
      html: '' // Not used, but required by interface
    })
  }

  /**
   * HR Notification for Every New Applicant
   * sendHRNotification(hr_email, candidate_name, score, status)
   */
  async sendHRNotification(data: {
    hrEmail: string
    candidateName: string
    candidateEmail: string
    jobTitle: string
    companyName: string
    score?: number | null
    status?: string | null
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
      ${data.score !== null && data.score !== undefined ? `<p><strong>Score:</strong> ${data.score}/100</p>` : ''}
      ${data.status ? `<p><strong>Status:</strong> ${data.status}</p>` : ''}
      <p>${data.score !== null && data.score !== undefined ? 'The candidate has been evaluated.' : 'The candidate is being processed and scored. You\'ll receive updates once the evaluation is complete.'}</p>
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
${data.score !== null && data.score !== undefined ? `Score: ${data.score}/100` : ''}
${data.status ? `Status: ${data.status}` : ''}

${data.score !== null && data.score !== undefined ? 'The candidate has been evaluated.' : 'The candidate is being processed and scored. You\'ll receive updates once the evaluation is complete.'}

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

  /**
   * Generate company noreply email address
   * Priority: company_email > noreply@company_domain > noreply@sanitized_company_name.com > env fallback
   */
  getCompanyEmail(companyEmail: string | null | undefined, companyDomain: string | null | undefined, companyName: string): string {
    // If company_email exists, use it
    if (companyEmail) {
      return companyEmail
    }
    
    // If company_domain exists, use noreply@domain
    if (companyDomain) {
      // Remove http://, https://, www. if present
      const cleanDomain = companyDomain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase()
      return `noreply@${cleanDomain}`
    }
    
    // Fallback: generate from company name (sanitized)
    if (companyName) {
      const sanitized = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20)
      return `noreply@${sanitized}.com`
    }
    
    // Final fallback - use hirebitapplications@gmail.com
    return 'hirebitapplications@gmail.com'
  }

  /**
   * Interview Scheduled Email
   * sendInterviewSchedule(candidate_email, jobTitle, meeting_time, meetingLink)
   */
  async sendInterviewSchedule(data: {
    candidate_email: string
    jobTitle: string
    meeting_time: string
    meetingLink: string
    candidateName?: string
    companyName?: string
  }) {
    const meetingDate = new Date(data.meeting_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

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
    .info-box { background: white; padding: 15px; border-left: 4px solid #2D2DDD; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Scheduled</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName || 'Candidate'},</p>
      <p>Your interview for <strong>${data.jobTitle}</strong> has been scheduled.</p>
      <div class="info-box">
        <p><strong>Date & Time:</strong> ${meetingDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}" class="button">Join Interview</a></p>
      </div>
      <p>Please arrive 5 minutes early and have your documents ready.</p>
      <p>Best regards,<br>${data.companyName || 'Hiring Team'}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Interview Scheduled

Hi ${data.candidateName || 'Candidate'},

Your interview for ${data.jobTitle} has been scheduled.

Date & Time: ${meetingDate}
Meeting Link: ${data.meetingLink}

Please arrive 5 minutes early and have your documents ready.

Best regards,
${data.companyName || 'Hiring Team'}
    `

    await this.sendEmail({
      to: data.candidate_email,
      subject: `Interview Scheduled - ${data.jobTitle}`,
      html,
      text
    })
  }

  /**
   * HR Interview Confirmation Email
   * sendHRInterviewConfirmation(hr_email, candidate, time)
   */
  async sendHRInterviewConfirmation(data: {
    hr_email: string
    candidate: {
      name: string
      email: string
    }
    time: string
    jobTitle: string
    meetingLink: string
    companyName?: string
  }) {
    const meetingDate = new Date(data.time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #2D2DDD; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>An interview has been scheduled:</p>
      <div class="info-box">
        <p><strong>Candidate:</strong> ${data.candidate.name} (${data.candidate.email})</p>
        <p><strong>Job:</strong> ${data.jobTitle}</p>
        <p><strong>Date & Time:</strong> ${meetingDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>
      </div>
      <p>Best regards,<br>HireBit System</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Interview Confirmed

An interview has been scheduled:

Candidate: ${data.candidate.name} (${data.candidate.email})
Job: ${data.jobTitle}
Date & Time: ${meetingDate}
Meeting Link: ${data.meetingLink}

Best regards,
HireBit System
    `

    await this.sendEmail({
      to: data.hr_email,
      subject: `Interview Scheduled - ${data.candidate.name} for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendEmail(data: {
    to: string
    subject: string
    html: string
    text: string
    from?: string
  }) {
    try {
      const from = data.from || 'hirebitapplications@gmail.com'
      
      // Verify transporter is configured
      if (!this.transporter) {
        throw new Error('Email transporter not initialized')
      }

      // Verify authentication is configured
      const mailUser = process.env.MAIL_USER || process.env.SMTP_USER
      const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS
      
      if (!mailUser || !mailPass) {
        logger.error('Email authentication not configured. MAIL_USER/SMTP_USER and MAIL_PASS/SMTP_PASS environment variables must be set.')
        throw new Error('Email authentication not configured. Please set MAIL_USER/SMTP_USER and MAIL_PASS/SMTP_PASS environment variables. For Gmail, use an App Password (not your regular password).')
      }
      
      await this.transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text
      })

      logger.info(`Email sent to ${data.to}: ${data.subject}`)
      await this.logEmail(data.to, data.subject, 'sent')
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      logger.error(`Failed to send email to ${data.to}:`, error)
      
      // Provide helpful error message for authentication failures
      if (error?.responseCode === 530 || errorMsg?.includes('Authentication Required')) {
        logger.error('SMTP Authentication Error: Gmail requires an App Password. Please:')
        logger.error('1. Go to https://myaccount.google.com/apppasswords')
        logger.error('2. Generate an App Password for "Mail"')
        logger.error('3. Set MAIL_PASS or SMTP_PASS environment variable to the generated App Password (not your regular password)')
        logger.error('4. Ensure MAIL_USER or SMTP_USER is set to your Gmail address')
      }
      
      await this.logEmail(data.to, data.subject, 'failed', errorMsg)
      throw error
    }
  }
}

