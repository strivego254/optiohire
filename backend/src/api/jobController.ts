import type { Request, Response } from 'express'
import { JobService } from '../services/jobService.js'
import { logger } from '../utils/logger.js'
import { z } from 'zod'

const createJobSchema = z.object({
  company_name: z.string().min(1),
  company_email: z.string().email(),
  hr_email: z.string().email(),
  job_title: z.string().min(1),
  job_description: z.string().min(1),
  required_skills: z.array(z.string()),
  application_deadline: z.string().datetime().nullable().optional(),
  interview_start_time: z.string().datetime().nullable().optional(),
  meeting_link: z.string().url().nullable().optional()
})

export async function createJob(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = createJobSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.issues
      })
    }

    const data = validation.data

    const jobService = new JobService()
    const result = await jobService.createJob({
      company_name: data.company_name,
      company_email: data.company_email,
      hr_email: data.hr_email,
      job_title: data.job_title,
      job_description: data.job_description,
      required_skills: data.required_skills,
      application_deadline: data.application_deadline || null,
      interview_start_time: data.interview_start_time || null,
      meeting_link: data.meeting_link || null
    })

    return res.status(201).json(result)
  } catch (error: any) {
    logger.error('Failed to create job:', error)
    return res.status(500).json({
      error: 'Failed to create job posting',
      details: error.message
    })
  }
}

