import type { Request, Response } from 'express'
import { ApplicationRepository } from '../repositories/applicationRepository.js'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { EmailService } from '../services/emailService.js'
import { logger } from '../utils/logger.js'
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
      logger.warn('Invalid schedule interview request:', validation.error.errors)
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors
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

    // Send emails
    const interviewDate = new Date(interviewTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })

    // Generate company email for from address
    const companyEmail = emailService.getCompanyEmail(
      company.company_email,
      company.company_domain,
      company.company_name
    )
    
    // Email candidate
    await emailService.sendEmail({
      to: application.email,
      from: companyEmail,
      subject: `Interview Scheduled - ${job.job_title}`,
      html: `
        <h2>Interview Scheduled</h2>
        <p>Hi ${application.candidate_name || 'Candidate'},</p>
        <p>Your interview for <strong>${job.job_title}</strong> has been scheduled.</p>
        <p><strong>Date & Time:</strong> ${interviewDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${job.meeting_link}">${job.meeting_link}</a></p>
        <p>Best regards,<br>${company.company_name} Team</p>
      `,
      text: `
Interview Scheduled

Hi ${application.candidate_name || 'Candidate'},

Your interview for ${job.job_title} has been scheduled.

Date & Time: ${interviewDate}
Meeting Link: ${job.meeting_link}

Best regards,
${company.company_name} Team
      `
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

