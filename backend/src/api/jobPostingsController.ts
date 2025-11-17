import type { Request, Response } from 'express'
import { z } from 'zod'
import { pool } from '../db/index.js'

const createJobSchema = z.object({
  company_name: z.string().min(2).max(255),
  company_email: z.string().email(),
  hr_email: z.string().email(),
  job_title: z.string().min(3).max(255),
  job_description: z.string().min(50),
  required_skills: z.array(z.string().min(1)).nonempty(),
  application_deadline: z.string().refine(val => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: 'deadline must be a future datetime'
  }),
  interview_date: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: 'invalid date' }),
  meeting_link: z.string().url().optional(),
  google_calendar_link: z.string().url().optional()
})

function normalizeSkills(skills: string[]): string[] {
  return Array.from(
    new Set(
      skills
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0)
    )
  )
}

function domainFromEmail(email: string): string | null {
  const at = email.indexOf('@')
  if (at === -1) return null
  return email.slice(at + 1).toLowerCase()
}

export async function createJobPosting(req: Request, res: Response) {
  const parse = createJobSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ success: false, error: parse.error.flatten() })
  }

  const payload = parse.data
  const skills = normalizeSkills(payload.required_skills)
  const applicationDeadline = new Date(payload.application_deadline)
  const interviewDate = payload.interview_date ? new Date(payload.interview_date) : null

  if (interviewDate && interviewDate <= new Date()) {
    return res.status(400).json({ success: false, error: { message: 'interview_date must be in the future' } })
  }
  if (interviewDate && applicationDeadline && interviewDate < applicationDeadline) {
    // allow but validate ordering if needed; spec says "optionally after deadline"
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1) Link or create company by domain or company_email
    const companyDomain = domainFromEmail(payload.company_email) || domainFromEmail(payload.hr_email) || null
    let companyRow: { company_id: string } | null = null

    if (companyDomain) {
      const c1 = await client.query<{ company_id: string }>(
        `select company_id from companies where company_domain = $1 limit 1`,
        [companyDomain]
      )
      companyRow = c1.rows[0] || null
    }
    if (!companyRow) {
      // Try by exact company_email if column exists/populated
      const c2 = await client.query<{ company_id: string }>(
        `select company_id from companies where company_email = $1 limit 1`,
        [payload.company_email]
      )
      companyRow = c2.rows[0] || null
    }

    if (!companyRow) {
      const ins = await client.query<{ company_id: string }>(
        `insert into companies (company_name, hr_email, hiring_manager_email, company_domain, company_email)
         values ($1,$2,$3,$4,$5)
         returning company_id`,
        [
          payload.company_name,
          payload.hr_email,
          payload.hr_email, // fallback as hiring manager if not provided
          companyDomain ?? payload.company_email.split('@')[1],
          payload.company_email
        ]
      )
      companyRow = ins.rows[0]
    } else {
      await client.query(
        `update companies
         set company_name = coalesce($2, company_name),
             hr_email = $3,
             company_email = $4,
             updated_at = now()
         where company_id = $1`,
        [companyRow.company_id, payload.company_name, payload.hr_email, payload.company_email]
      )
    }

    const companyId = companyRow.company_id

    // 2) Insert job_posting
    // responsibilities is required in current schema; mirror job_description
    const meetingLink = payload.meeting_link ?? null
    const googleCal = payload.google_calendar_link ?? null

    const jobIns = await client.query<{ job_posting_id: string }>(
      `insert into job_postings
       (company_id, job_title, job_description, responsibilities, skills_required,
        application_deadline, interview_slots, interview_meeting_link, meeting_link, google_calendar_link, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ACTIVE')
       returning job_posting_id`,
      [
        companyId,
        payload.job_title,
        payload.job_description,
        payload.job_description,
        skills,
        applicationDeadline.toISOString(),
        null,
        meetingLink,
        meetingLink,
        googleCal
      ]
    )

    const jobPostingId = jobIns.rows[0].job_posting_id

    // 3) Generate webhook url + secret
    const { randomBytes } = await import('crypto')
    const secret = randomBytes(32).toString('hex')
    const base =
      process.env.PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      `http://localhost:${process.env.PORT || 3001}`
    const webhookUrl = `${base}/inbound/applications/${jobPostingId}`

    await client.query(
      `update job_postings
       set webhook_receiver_url = $2,
           webhook_secret = $3,
           updated_at = now()
       where job_posting_id = $1`,
      [jobPostingId, webhookUrl, secret]
    )

    // 4) Schedule deadline job
    await client.query(
      `insert into job_schedules (job_posting_id, type, run_at, payload)
       values ($1, 'deadline', $2, $3::jsonb)`,
      [jobPostingId, applicationDeadline.toISOString(), JSON.stringify({ hr_email: payload.hr_email })]
    )

    // 5) Audit log
    await client.query(
      `insert into audit_logs (action, company_id, job_posting_id, metadata)
       values ('job_posting.created', $1, $2, $3::jsonb)`,
      [companyId, jobPostingId, JSON.stringify({ job_title: payload.job_title })]
    )

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      job_posting_id: jobPostingId,
      company_id: companyId,
      message: 'Job posted and workflows scheduled'
    })
  } catch (err) {
    await client.query('ROLLBACK')
    return res.status(500).json({ success: false, error: 'Failed to create job posting' })
  } finally {
    client.release()
  }
}


