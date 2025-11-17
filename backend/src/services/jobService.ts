import { CompanyRepository } from '../repositories/companyRepository.js'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { query } from '../db/index.js'
import { logger } from '../utils/logger.js'

export interface CreateJobRequest {
  company_name: string
  company_email: string
  hr_email: string
  job_title: string
  job_description: string
  required_skills: string[]
  application_deadline: string | null
  interview_start_time: string | null
  meeting_link: string | null
}

export interface CreateJobResponse {
  success: boolean
  job_posting_id: string
  company_id: string
}

export class JobService {
  private companyRepo: CompanyRepository
  private jobPostingRepo: JobPostingRepository

  constructor() {
    this.companyRepo = new CompanyRepository()
    this.jobPostingRepo = new JobPostingRepository()
  }

  async createJob(data: CreateJobRequest): Promise<CreateJobResponse> {
    // Use transaction for atomicity
    const client = await (await import('../db/index.js')).pool.connect()
    
    try {
      await client.query('BEGIN')

      // Find or create company
      let company = await this.companyRepo.findByName(data.company_name)
      
      if (!company) {
        // Check by email
        company = await this.companyRepo.findByEmail(data.company_email)
      }

      if (!company) {
        // Create new company
        company = await this.companyRepo.create({
          company_name: data.company_name,
          company_email: data.company_email,
          hr_email: data.hr_email
        })
        logger.info(`Created new company: ${company.company_id} - ${company.company_name}`)
      } else {
        // Update emails if provided
        if (data.company_email !== company.company_email || data.hr_email !== company.hr_email) {
          await client.query(
            `UPDATE companies 
             SET company_email = $1, hr_email = $2 
             WHERE company_id = $3`,
            [data.company_email, data.hr_email, company.company_id]
          )
          company.company_email = data.company_email
          company.hr_email = data.hr_email
        }
      }

      // Create job posting
      const jobPosting = await this.jobPostingRepo.create({
        company_id: company.company_id,
        job_title: data.job_title,
        job_description: data.job_description,
        required_skills: data.required_skills,
        application_deadline: data.application_deadline,
        interview_start_time: data.interview_start_time,
        meeting_link: data.meeting_link
      })

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (action, company_id, job_posting_id, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          'job_created',
          company.company_id,
          jobPosting.job_posting_id,
          JSON.stringify({
            job_title: data.job_title,
            company_name: data.company_name
          })
        ]
      )

      await client.query('COMMIT')

      logger.info(`Job posting created: ${jobPosting.job_posting_id} - ${data.job_title}`)

      return {
        success: true,
        job_posting_id: jobPosting.job_posting_id,
        company_id: company.company_id
      }
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Failed to create job:', error)
      throw error
    } finally {
      client.release()
    }
  }
}

