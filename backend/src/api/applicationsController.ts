import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import { startImapIngestion } from '../utils/imap.js'
import { parseResumeText } from '../services/ai/resumeParser.js'
import { scoreCandidate } from '../services/ai/screening.js'
import { sendDecisionEmail } from '../email/templates.js'

export async function parseEmailApplications(req: Request, res: Response) {
  try {
    startImapIngestion().catch(() => {})
    return res.status(202).json({ message: 'IMAP parsing triggered' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to trigger email parsing' })
  }
}

export async function scoreApplication(req: Request, res: Response) {
  try {
    const { application_id, job_posting_id } = req.body || {}
    if (!application_id || !job_posting_id) {
      return res.status(400).json({ error: 'Missing application_id or job_posting_id' })
    }

    const { rows: existingRows } = await query<{ ai_status: string | null }>(
      `select ai_status from applications where application_id = $1`,
      [application_id]
    )
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Application not found' })
    }
    if (existingRows[0].ai_status) {
      return res.status(409).json({ error: 'Already scored' })
    }

    const { rows: jobRows } = await query(
      `select job_title, job_description, responsibilities, skills_required
       from job_postings where job_posting_id = $1`,
      [job_posting_id]
    )
    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }
    const job = jobRows[0] as {
      job_title: string
      job_description: string
      responsibilities: string
      skills_required: string[]
    }

    const { rows: appRows } = await query(
      `select email, candidate_name, resume_url, parsed_resume_json
       from applications where application_id = $1`,
      [application_id]
    )
    const app = appRows[0] as any

    const parsed = app.parsed_resume_json || (await parseResumeText(''))

    const { score, status, reasoning } = await scoreCandidate(parsed, {
      jobTitle: job.job_title,
      description: job.job_description,
      responsibilities: job.responsibilities,
      skills: job.skills_required || []
    })

    await query(
      `update applications
       set ai_score = $1, ai_status = $2, reasoning = $3, parsed_resume_json = coalesce(parsed_resume_json, $4::jsonb)
       where application_id = $5`,
      [score, status, reasoning, JSON.stringify(parsed), application_id]
    )

    await sendDecisionEmail({
      to: app.email,
      candidateName: app.candidate_name || 'Candidate',
      status,
      interviewLink: null,
      jobPostingId: job_posting_id
    })

    return res.status(200).json({ score, status, reasoning })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to score application' })
  }
}


