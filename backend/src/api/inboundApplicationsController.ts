import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import { createHash } from 'crypto'

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export async function receiveInboundApplication(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId
    if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required' })

    const providedSecret = req.header('x-webhook-secret') || req.query.secret
    if (!providedSecret) return res.status(401).json({ success: false, error: 'missing webhook secret' })

    // Validate secret
    const { rows: jobs } = await query<{ job_posting_id: string; company_id: string; webhook_secret: string }>(
      `select job_posting_id, company_id, webhook_secret from job_postings where job_posting_id = $1`,
      [jobId]
    )
    const job = jobs[0]
    if (!job) return res.status(404).json({ success: false, error: 'job not found' })
    if (!job.webhook_secret || String(providedSecret) !== job.webhook_secret) {
      return res.status(401).json({ success: false, error: 'invalid webhook secret' })
    }

    // Payload
    const {
      candidate_name,
      email,
      phone,
      resume_url,
      parsed_resume,
      score,
      status,
      reasoning,
      external_id,
      message_id,
      subject,
      received_at,
    } = req.body || {}

    if (!email) return res.status(400).json({ success: false, error: 'email is required' })

    // Dedup key: external_id or derived
    const dedupeKey =
      external_id ||
      message_id ||
      sha256Hex([job.company_id, job.job_posting_id, email, subject || '', received_at || ''].join('|'))

    // Normalize status to enum values if provided
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : null // 'SHORTLIST' | 'FLAG' | 'REJECT'

    const insert = await query<{ application_id: string }>(
      `insert into applications
       (job_posting_id, company_id, candidate_name, email, phone, resume_url, parsed_resume_json,
        ai_score, ai_status, reasoning, external_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (external_id) do nothing
       returning application_id`,
      [
        job.job_posting_id,
        job.company_id,
        candidate_name || null,
        email,
        phone || null,
        resume_url || null,
        parsed_resume ? JSON.stringify(parsed_resume) : null,
        typeof score === 'number' ? score : null,
        normalizedStatus || null,
        reasoning || null,
        dedupeKey,
      ]
    )

    const created = insert.rows[0]?.application_id
    return res.status(201).json({
      success: true,
      created: Boolean(created),
      application_id: created || null,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: 'failed to receive application' })
  }
}


