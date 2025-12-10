import type { Request, Response } from 'express'
import { ApplicationRepository } from '../repositories/applicationRepository.js'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { EmailService } from '../services/emailService.js'
import { logger } from '../utils/logger.js'
import { cleanJobTitle } from '../utils/jobTitle.js'
import { z } from 'zod'

const scheduleSchema = z.object({
  applicantId: z.string().uuid(),
  interviewTime: z.string().refine((val) => {
    // Accept ISO datetime strings or any valid date string
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, {
    message: 'Invalid date format. Expected ISO datetime string.'
  })
})

export async function scheduleInterview(req: Request, res: Response) {
  try {
    logger.info('Schedule interview request received:', { body: req.body })
    
    const validation = scheduleSchema.safeParse(req.body)
    if (!validation.success) {
      logger.warn('Invalid schedule interview request:', { errors: validation.error.issues })
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.issues
      })
    }

    const { applicantId, interviewTime } = validation.data
    logger.info('Processing interview schedule:', { applicantId, interviewTime })

    const applicationRepo = new ApplicationRepository()
    const jobPostingRepo = new JobPostingRepository()
    const companyRepo = new CompanyRepository()
    const emailService = new EmailService()

    // Get application
    const application = await applicationRepo.findById(applicantId)
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Check if already shortlisted
    if (application.ai_status !== 'SHORTLIST') {
      return res.status(400).json({ error: 'Only shortlisted candidates can be scheduled for interviews' })
    }

    // Get job posting
    const job = await jobPostingRepo.findById(application.job_posting_id)
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' })
    }

    if (!job.meeting_link) {
      return res.status(400).json({ error: 'Meeting link not set for this job posting' })
    }

    // Get company
    const companyId = application.company_id
    if (!companyId) {
      return res.status(404).json({ error: 'Company not found for this application' })
    }
    const company = await companyRepo.findById(companyId)
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Schedule interview
    const updated = await applicationRepo.scheduleInterview({
      application_id: applicantId,
      interview_time: interviewTime,
      interview_link: job.meeting_link
    })

    // Clean job title for email
    const cleanedJobTitle = cleanJobTitle(job.job_title)

    // Format interview date and time
    const interviewDateObj = new Date(interviewTime)
    const interviewDate = interviewDateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const interviewTimeFormatted = interviewDateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Generate company email for from address
    const companyEmail = emailService.getCompanyEmail(
      company.company_email,
      company.company_domain,
      company.company_name
    )
    
    const hrEmail = company.company_email || company.hr_email || 'hirebitapplications@gmail.com'
    const candidateName = application.candidate_name || '[Candidate\'s Full Name]'
    const companyName = company.company_name || '[Company Name]'
    
    // Email candidate - Final Interview Invitation
    await emailService.sendEmail({
      to: application.email,
      from: companyEmail,
      subject: `Final Interview Invitation – ${cleanedJobTitle} at ${companyName}`,
      html: `
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
    <p><strong>Date:</strong> ${interviewDate}</p>
    <p><strong>Time:</strong> ${interviewTimeFormatted}</p>
    <p><strong>Meeting Link:</strong> <a href="${job.meeting_link}">${job.meeting_link}</a></p>
    
    <p>During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.</p>
    
    <p>If you have any questions before the interview or need to make changes, feel free to contact our HR team at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
    
    <p>We look forward to meeting you and learning more about how you can contribute to our team. Thank you!</p>
    
    <p>Kind regards,<br>
    <strong>Company Name:</strong> ${companyName}<br>
    <strong>Company Email:</strong> ${hrEmail}</p>
  </div>
</body>
</html>
      `,
      text: `Dear ${candidateName},

Congratulations! After reviewing your application for the ${cleanedJobTitle} position at ${companyName}, we are pleased to inform you that you have been shortlisted for the next stage of our recruitment process.

Your final interview has been scheduled as follows:

Interview Details:

Position: ${cleanedJobTitle}

Company: ${companyName}

Date: ${interviewDate}

Time: ${interviewTimeFormatted}

Meeting Link: ${job.meeting_link}

During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.

If you have any questions before the interview or need to make changes, feel free to contact our HR team at ${hrEmail}.

We look forward to meeting you and learning more about how you can contribute to our team. Thank you!

Kind regards,

Company Name: ${companyName}

Company Email: ${hrEmail}`
    })

    // Email HR
    await emailService.sendEmail({
      to: company.hr_email,
      from: companyEmail,
      subject: `Interview Scheduled - ${application.candidate_name} for ${job.job_title}`,
      html: `
        <h2>Interview Scheduled</h2>
        <p>An interview has been scheduled:</p>
        <p><strong>Candidate:</strong> ${application.candidate_name} (${application.email})</p>
        <p><strong>Job:</strong> ${job.job_title}</p>
        <p><strong>Date & Time:</strong> ${interviewDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${job.meeting_link}">${job.meeting_link}</a></p>
      `,
      text: `
Interview Scheduled

Candidate: ${application.candidate_name} (${application.email})
Job: ${job.job_title}
Date & Time: ${interviewDate}
Meeting Link: ${job.meeting_link}
      `
    })

    logger.info(`Interview scheduled for application ${applicantId} at ${interviewTime}`)

    return res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      application: updated
    })
  } catch (error: any) {
    logger.error('Failed to schedule interview:', error)
    return res.status(500).json({
      error: 'Failed to schedule interview',
      details: error.message
    })
  }
}

