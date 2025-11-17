import { query } from '../db/index.js'

export interface Candidate {
  id: string
  job_posting_id: string
  company_id: string
  candidate_name: string | null
  email: string
  cv_url: string | null
  score: number | null
  status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED' | null
  parsedlinkedin: string | null
  parsedgithub: string | null
  parsedemail: string | null
  reasoning: string | null
  interview_date_time: string | null
  interview_link: string | null
  created_at: string
  updated_at: string
}

export class CandidateRepository {
  async create(data: {
    job_posting_id: string
    company_id: string
    candidate_name: string | null
    email: string
    cv_url: string | null
    parsedlinkedin?: string | null
    parsedgithub?: string | null
    parsedemail?: string | null
  }): Promise<Candidate> {
    const { rows } = await query<Candidate>(
      `INSERT INTO candidates (
        job_posting_id, company_id, candidate_name, email, cv_url,
        parsedlinkedin, parsedgithub, parsedemail
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (job_posting_id, email) DO UPDATE SET
        candidate_name = EXCLUDED.candidate_name,
        cv_url = EXCLUDED.cv_url,
        parsedlinkedin = EXCLUDED.parsedlinkedin,
        parsedgithub = EXCLUDED.parsedgithub,
        parsedemail = EXCLUDED.parsedemail,
        updated_at = NOW()
      RETURNING id, job_posting_id, company_id, candidate_name, email, cv_url,
                score, status, parsedlinkedin, parsedgithub, parsedemail,
                reasoning, interview_date_time, interview_link, created_at, updated_at`,
      [
        data.job_posting_id,
        data.company_id,
        data.candidate_name,
        data.email,
        data.cv_url,
        data.parsedlinkedin || null,
        data.parsedgithub || null,
        data.parsedemail || null
      ]
    )
    return rows[0]
  }

  async updateScoring(data: {
    id: string
    score: number
    status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
    reasoning: string
  }): Promise<Candidate> {
    const { rows } = await query<Candidate>(
      `UPDATE candidates
       SET score = $1, status = $2, reasoning = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, job_posting_id, company_id, candidate_name, email, cv_url,
                 score, status, parsedlinkedin, parsedgithub, parsedemail,
                 reasoning, interview_date_time, interview_link, created_at, updated_at`,
      [data.score, data.status, data.reasoning, data.id]
    )
    if (rows.length === 0) {
      throw new Error('Candidate not found')
    }
    return rows[0]
  }

  async findByJob(jobPostingId: string): Promise<Candidate[]> {
    const { rows } = await query<Candidate>(
      `SELECT id, job_posting_id, company_id, candidate_name, email, cv_url,
              score, status, parsedlinkedin, parsedgithub, parsedemail,
              reasoning, interview_date_time, interview_link, created_at, updated_at
       FROM candidates
       WHERE job_posting_id = $1
       ORDER BY score DESC NULLS LAST, created_at ASC`,
      [jobPostingId]
    )
    return rows
  }

  async findById(id: string): Promise<Candidate | null> {
    const { rows } = await query<Candidate>(
      `SELECT id, job_posting_id, company_id, candidate_name, email, cv_url,
              score, status, parsedlinkedin, parsedgithub, parsedemail,
              reasoning, interview_date_time, interview_link, created_at, updated_at
       FROM candidates
       WHERE id = $1
       LIMIT 1`,
      [id]
    )
    return rows[0] || null
  }

  async updateLinks(data: {
    id: string
    parsedlinkedin?: string | null
    parsedgithub?: string | null
    parsedemail?: string | null
  }): Promise<Candidate> {
    const { rows } = await query<Candidate>(
      `UPDATE candidates
       SET parsedlinkedin = COALESCE($1, parsedlinkedin),
           parsedgithub = COALESCE($2, parsedgithub),
           parsedemail = COALESCE($3, parsedemail),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, job_posting_id, company_id, candidate_name, email, cv_url,
                 score, status, parsedlinkedin, parsedgithub, parsedemail,
                 reasoning, interview_date_time, interview_link, created_at, updated_at`,
      [data.parsedlinkedin, data.parsedgithub, data.parsedemail, data.id]
    )
    if (rows.length === 0) {
      throw new Error('Candidate not found')
    }
    return rows[0]
  }

  async scheduleInterview(data: {
    id: string
    interview_date_time: string
    interview_link: string
  }): Promise<Candidate> {
    const { rows } = await query<Candidate>(
      `UPDATE candidates
       SET interview_date_time = $1, interview_link = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, job_posting_id, company_id, candidate_name, email, cv_url,
                 score, status, parsedlinkedin, parsedgithub, parsedemail,
                 reasoning, interview_date_time, interview_link, created_at, updated_at`,
      [data.interview_date_time, data.interview_link, data.id]
    )
    if (rows.length === 0) {
      throw new Error('Candidate not found')
    }
    return rows[0]
  }
}

