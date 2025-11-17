import type { Request, Response } from 'express'
import { CandidateRepository } from '../repositories/candidateRepository.js'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { EmailService } from '../services/emailService.js'
import { logger } from '../utils/logger.js'
import { z } from 'zod'

const scheduleSchema = z.object({
  candidate_id: z.string().uuid(),
  interview_date_time: z.string().datetime()
})

export async function scheduleInterview(req: Request, res: Response) {
  try {
    const validation = scheduleSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors
      })
    }

    const { candidate_id, interview_date_time } = validation.data

    const candidateRepo = new CandidateRepository()
    const jobPostingRepo = new JobPostingRepository()
    const companyRepo = new CompanyRepository()
    const emailService = new EmailService()

    // Get candidate
    const candidate = await candidateRepo.findById(candidate_id)
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' })
    }

    // Get job posting
    const job = await jobPostingRepo.findById(candidate.job_posting_id)
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' })
    }

    if (!job.meeting_link) {
      return res.status(400).json({ error: 'Meeting link not set for this job posting' })
    }

    // Get company
    const company = await companyRepo.findById(candidate.company_id)
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Schedule interview
    const updated = await candidateRepo.scheduleInterview({
      id: candidate_id,
      interview_date_time,
      interview_link: job.meeting_link
    })

    // Send emails
    const interviewDate = new Date(interview_date_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })

    // Email candidate
    await emailService.sendEmail({
      to: candidate.email,
      subject: `Interview Scheduled - ${job.job_title}`,
      html: `
        <h2>Interview Scheduled</h2>
        <p>Hi ${candidate.candidate_name || 'Candidate'},</p>
        <p>Your interview for <strong>${job.job_title}</strong> has been scheduled.</p>
        <p><strong>Date & Time:</strong> ${interviewDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${job.meeting_link}">${job.meeting_link}</a></p>
        <p>Best regards,<br>${company.company_name} Team</p>
      `,
      text: `
Interview Scheduled

Hi ${candidate.candidate_name || 'Candidate'},

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
      subject: `Interview Scheduled - ${candidate.candidate_name} for ${job.job_title}`,
      html: `
        <h2>Interview Scheduled</h2>
        <p>An interview has been scheduled:</p>
        <p><strong>Candidate:</strong> ${candidate.candidate_name} (${candidate.email})</p>
        <p><strong>Job:</strong> ${job.job_title}</p>
        <p><strong>Date & Time:</strong> ${interviewDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${job.meeting_link}">${job.meeting_link}</a></p>
      `,
      text: `
Interview Scheduled

Candidate: ${candidate.candidate_name} (${candidate.email})
Job: ${job.job_title}
Date & Time: ${interviewDate}
Meeting Link: ${job.meeting_link}
      `
    })

    logger.info(`Interview scheduled for candidate ${candidate_id} at ${interview_date_time}`)

    return res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      candidate: updated
    })
  } catch (error: any) {
    logger.error('Failed to schedule interview:', error)
    return res.status(500).json({
      error: 'Failed to schedule interview',
      details: error.message
    })
  }
}

