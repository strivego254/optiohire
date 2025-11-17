import { ImapFlow } from 'imapflow'
import { logger } from './logger.js'
import { saveFile } from './storage.js'
import { query } from '../db/index.js'
import { parseResumeText } from '../services/ai/resumeParser.js'
import { scoreCandidate } from '../services/ai/screening.js'

export async function startImapIngestion(): Promise<void> {
  const host = process.env.IMAP_HOST
  const port = Number(process.env.IMAP_PORT || 993)
  const secure = (process.env.IMAP_SECURE || 'true') === 'true'
  const user = process.env.IMAP_USER
  const pass = process.env.IMAP_PASS

  if (!host || !user || !pass) {
    logger.warn('IMAP not configured; skipping ingestion')
    return
  }

  const client = new ImapFlow({
    host, port, secure,
    auth: { user, pass }
  })

  await client.connect()
  try {
    await client.mailboxOpen('INBOX')
    for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true, bodyStructure: true })) {
      const envelope = msg.envelope
      const from = envelope?.from?.[0]?.address || ''
      const subject = envelope?.subject || ''

      // Save attachments if any (simplified)
      const attachments: Array<{ filename: string, data: Buffer }> = []
      const bs = msg.bodyStructure
      if (bs && 'childNodes' in bs && Array.isArray((bs as any).childNodes)) {
        for (const child of (bs as any).childNodes) {
          if (child.disposition?.type?.toLowerCase() === 'attachment') {
            const part = child.part
            const { content } = await client.download(msg.uid!, part)
            const buf = await streamToBuffer(content)
            attachments.push({ filename: child.parameters?.name || `attachment-${part}.bin`, data: buf })
          }
        }
      }

      let resumeUrl: string | null = null
      if (attachments.length > 0) {
        const file = attachments[0]
        const path = await saveFile(file.filename, file.data)
        resumeUrl = path
      }

      // Insert application with dedupe on (job_posting_id, email) - need job_posting_id from subject convention or mapping.
      // For simplicity, assume subject contains job_posting_id like: [JOB:<uuid>]
      const jobMatch = subject.match(/\[JOB:([0-9a-f-]{36})\]/i)
      const jobId = jobMatch ? jobMatch[1] : null
      if (!jobId) {
        logger.warn('No job id token found in subject; skipping message', { subject })
        continue
      }

      const candidateEmail = from
      const candidateName = envelope?.from?.[0]?.name || ''

      // Insert application (ignore duplicates)
      await query(
        `insert into applications (job_posting_id, candidate_name, email, resume_url)
         values ($1,$2,$3,$4)
         on conflict (job_posting_id, email) do nothing`,
        [jobId, candidateName, candidateEmail, resumeUrl]
      )

      // Fetch the application_id to score
      const { rows: appRows } = await query<{ application_id: string }>(
        `select application_id from applications where job_posting_id = $1 and email = $2 order by created_at desc limit 1`,
        [jobId, candidateEmail]
      )
      const applicationId = appRows[0]?.application_id
      if (!applicationId) continue

      // Minimal parse and score (async but awaited sequentially to keep example simple)
      const parsed = await parseResumeText('')

      const { rows: jobRows } = await query(
        `select job_title, job_description, responsibilities, skills_required
         from job_postings where job_posting_id = $1`,
        [jobId]
      )
      const job = jobRows[0] as any

      const { score, status, reasoning } = await scoreCandidate(parsed, {
        jobTitle: job.job_title,
        description: job.job_description,
        responsibilities: job.responsibilities,
        skills: job.skills_required || []
      })

      await query(
        `update applications
         set parsed_resume_json = $1::jsonb, ai_score = $2, ai_status = $3, reasoning = $4
         where application_id = $5 and ai_status is null`,
        [JSON.stringify(parsed), score, status, reasoning, applicationId]
      )
    }
  } catch (err) {
    logger.error('IMAP ingestion error', { err })
  } finally {
    await client.logout()
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (d) => chunks.push(d))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}


