import 'dotenv/config'
import { query } from '../db/index.js'
import { logger } from '../utils/logger.js'

export async function runDueSchedules(): Promise<void> {
  const { rows: due } = await query<{ id: string; job_posting_id: string; type: string }>(
    `select id, job_posting_id, type
     from job_schedules
     where executed = false and run_at <= now()
     order by run_at asc
     limit 100`
  )

  for (const row of due) {
    try {
      // For now just mark executed. Extend to aggregate and email.
      await query(`update job_schedules set executed = true where id = $1 and executed = false`, [row.id])
      logger.info(`Executed schedule ${row.id} for job ${row.job_posting_id} (${row.type})`)
    } catch (err) {
      logger.error('Failed executing schedule', { id: row.id, err })
    }
  }
}

if (process.argv[1]?.includes('/scheduler')) {
  runDueSchedules().then(() => process.exit(0)).catch(() => process.exit(1))
}


