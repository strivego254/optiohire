import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

// GET /api/hr/candidates?jobId=...
export async function getCandidatesByJob(req: Request, res: Response) {
  try {
    const jobId = req.query.jobId as string

    if (!jobId) {
      return res.status(400).json({ error: 'jobId query parameter is required' })
    }

    // Verify job exists
    const { rows: jobRows } = await query<{ company_id: string }>(
      `SELECT company_id FROM job_postings WHERE job_posting_id = $1`,
      [jobId]
    )

    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }

    // Fetch candidates ordered by score DESC
    const { rows } = await query<{
      application_id: string
      candidate_name: string | null
      email: string
      ai_score: number | null
      ai_status: string | null
      interview_time: string | null
      interview_link: string | null
      reasoning: string | null
    }>(
      `SELECT 
        application_id,
        candidate_name,
        email,
        ai_score,
        ai_status,
        interview_time,
        interview_link,
        reasoning
      FROM applications 
      WHERE job_posting_id = $1 
      ORDER BY ai_score DESC NULLS LAST, created_at ASC`,
      [jobId]
    )

    // Map to response format with ranking
    const candidates = rows.map((row, index) => ({
      id: row.application_id,
      rank: index + 1,
      candidate_name: row.candidate_name || 'Unknown',
      email: row.email,
      score: row.ai_score ?? null,
      status: row.ai_status || 'PENDING',
      interview_time: row.interview_time,
      interview_link: row.interview_link,
      reasoning: row.reasoning || null,
    }))

    return res.json(candidates)
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/hr/candidates/:id
export async function getCandidateById(req: Request, res: Response) {
  try {
    const applicantId = req.params.id

    // Fetch candidate detail
    const { rows } = await query<{
      application_id: string
      candidate_name: string | null
      email: string
      ai_score: number | null
      ai_status: string | null
      interview_time: string | null
      interview_link: string | null
      parsed_resume_json: any
      reasoning: string | null
      resume_url: string | null
      job_posting_id: string
    }>(
      `SELECT 
        application_id,
        candidate_name,
        email,
        ai_score,
        ai_status,
        interview_time,
        interview_link,
        parsed_resume_json,
        reasoning,
        resume_url,
        job_posting_id
      FROM applications 
      WHERE application_id = $1`,
      [applicantId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' })
    }

    const app = rows[0]

    return res.json({
      id: app.application_id,
      candidate_name: app.candidate_name || 'Unknown',
      email: app.email,
      score: app.ai_score ?? null,
      status: app.ai_status || 'PENDING',
      interview_time: app.interview_time,
      interview_link: app.interview_link,
      parsed_resume: app.parsed_resume_json || {},
      reasoning: app.reasoning || '',
      resume_url: app.resume_url || '',
    })
  } catch (error: any) {
    console.error('Error fetching candidate detail:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

