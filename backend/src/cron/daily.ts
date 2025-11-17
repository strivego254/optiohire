import 'dotenv/config'
import { query } from '../db/index.js'
import { scoreCandidate } from '../services/ai/screening.js'

export async function runDailyScoring(): Promise<void> {
  // Score any applications without ai_status
  const { rows: pending } = await query(
    `select a.application_id, a.job_posting_id, a.parsed_resume_json,
            j.job_title, j.job_description, j.responsibilities, j.skills_required
     from applications a
     join job_postings j on j.job_posting_id = a.job_posting_id
     where a.ai_status is null
     limit 100`
  )

  for (const row of pending as any[]) {
    const parsed = row.parsed_resume_json || {}
    const { score, status, reasoning } = await scoreCandidate(parsed, {
      jobTitle: row.job_title,
      description: row.job_description,
      responsibilities: row.responsibilities,
      skills: row.skills_required || []
    })

    await query(
      `update applications
       set ai_score = $1, ai_status = $2, reasoning = $3
       where application_id = $4 and ai_status is null`,
      [score, status, reasoning, row.application_id]
    )
  }
}

// If executed directly: node dist/cron/daily.js
if (process.argv[1]?.includes('/daily')) {
  runDailyScoring().then(() => process.exit(0)).catch(() => process.exit(1))
}


