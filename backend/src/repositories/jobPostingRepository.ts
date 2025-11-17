import { query } from '../db/index.js'

export interface JobPosting {
  job_posting_id: string
  company_id: string
  job_title: string
  job_description: string
  required_skills: string[]
  application_deadline: string | null
  interview_start_time: string | null
  meeting_link: string | null
  created_at: string
  updated_at: string
}

export class JobPostingRepository {
  async create(data: {
    company_id: string
    job_title: string
    job_description: string
    required_skills: string[]
    application_deadline: string | null
    interview_start_time: string | null
    meeting_link: string | null
  }): Promise<JobPosting> {
    const { rows } = await query<JobPosting>(
      `INSERT INTO job_postings (
        company_id, job_title, job_description, skills_required,
        application_deadline, interview_start_time, meeting_link
      )
      VALUES ($1, $2, $3, $4::text[], $5, $6, $7)
      RETURNING job_posting_id, company_id, job_title, job_description, skills_required as required_skills,
                application_deadline, interview_start_time, meeting_link,
                created_at, updated_at`,
      [
        data.company_id,
        data.job_title,
        data.job_description,
        data.required_skills,
        data.application_deadline,
        data.interview_start_time,
        data.meeting_link
      ]
    )
    return rows[0]
  }

  async findById(id: string): Promise<JobPosting | null> {
    const { rows } = await query<JobPosting>(
      `SELECT job_posting_id, company_id, job_title, job_description, skills_required as required_skills,
              application_deadline, interview_start_time, meeting_link,
              created_at, updated_at
       FROM job_postings
       WHERE job_posting_id = $1
       LIMIT 1`,
      [id]
    )
    if (rows[0]) {
      rows[0].required_skills = Array.isArray(rows[0].required_skills)
        ? rows[0].required_skills
        : []
    }
    return rows[0] || null
  }

  async findByCompany(companyId: string): Promise<JobPosting[]> {
    const { rows } = await query<JobPosting>(
      `SELECT job_posting_id, company_id, job_title, job_description, skills_required as required_skills,
              application_deadline, interview_start_time, meeting_link,
              created_at, updated_at
       FROM job_postings
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    )
    return rows.map(row => ({
      ...row,
      required_skills: Array.isArray(row.required_skills)
        ? row.required_skills
        : []
    }))
  }

  async findPastDeadlineWithoutReport(): Promise<JobPosting[]> {
    const { rows } = await query<JobPosting>(
      `SELECT jp.job_posting_id, jp.company_id, jp.job_title, jp.job_description, jp.skills_required as required_skills,
              jp.application_deadline, jp.interview_start_time, jp.meeting_link,
              jp.created_at, jp.updated_at
       FROM job_postings jp
       LEFT JOIN reports r ON r.job_posting_id = jp.job_posting_id
       WHERE jp.application_deadline IS NOT NULL
         AND jp.application_deadline < NOW()
         AND r.id IS NULL
       ORDER BY jp.application_deadline ASC
       LIMIT 10`,
      []
    )
    return rows.map(row => ({
      ...row,
      required_skills: Array.isArray(row.required_skills)
        ? row.required_skills
        : []
    }))
  }
}

