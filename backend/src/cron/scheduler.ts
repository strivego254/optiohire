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
      // Handle deadline schedules - update job status to CLOSED
      if (row.type === 'deadline') {
        const updateResult = await query(
          `update job_postings 
           set status = 'CLOSED', updated_at = now()
           where job_posting_id = $1 
             and status != 'CLOSED'
             and application_deadline IS NOT NULL
             and application_deadline <= now()`,
          [row.job_posting_id]
        )
        
        if (updateResult.rows.length > 0) {
          logger.info(`Updated job ${row.job_posting_id} status to CLOSED (deadline passed)`)
          
          // Log audit entry
          await query(
            `insert into audit_logs (action, job_posting_id, metadata)
             values ('job_posting.status_closed', $1, $2::jsonb)`,
            [row.job_posting_id, JSON.stringify({ reason: 'application_deadline_passed', scheduled: true })]
          )
        }
      }
      
      // Mark schedule as executed
      await query(`update job_schedules set executed = true where id = $1 and executed = false`, [row.id])
      logger.info(`Executed schedule ${row.id} for job ${row.job_posting_id} (${row.type})`)
    } catch (err) {
      logger.error('Failed executing schedule', { id: row.id, err })
    }
  }
}

/**
 * Continuously check for jobs with passed deadlines and update their status to CLOSED
 * This runs independently of the job_schedules table to catch any jobs that might have been missed
 */
export async function startDeadlineStatusScheduler() {
  logger.info('Deadline status scheduler started - checking every 15 minutes for jobs with passed deadlines')

  async function checkAndUpdateDeadlines() {
    try {
      // Find jobs where deadline has passed and status is still ACTIVE or DRAFT
      const { rows: jobsToClose } = await query<{ 
        job_posting_id: string
        job_title: string
        application_deadline: string
        status: string
      }>(
        `SELECT job_posting_id, job_title, application_deadline, status
         FROM job_postings
         WHERE application_deadline IS NOT NULL
           AND application_deadline <= NOW()
           AND status IN ('ACTIVE', 'DRAFT')
         LIMIT 100`,
        []
      )

      if (jobsToClose.length === 0) {
        logger.debug('No jobs found with passed deadlines that need status update')
        return
      }

      logger.info(`Found ${jobsToClose.length} job(s) with passed deadlines - updating status to CLOSED`)

      for (const job of jobsToClose) {
        try {
          const updateResult = await query(
            `UPDATE job_postings 
             SET status = 'CLOSED', updated_at = NOW()
             WHERE job_posting_id = $1 
               AND status IN ('ACTIVE', 'DRAFT')`,
            [job.job_posting_id]
          )

          if (updateResult.rows.length > 0) {
            logger.info(`Updated job ${job.job_posting_id} (${job.job_title}) status from ${job.status} to CLOSED`)
            
            // Log audit entry
            await query(
              `INSERT INTO audit_logs (action, job_posting_id, metadata)
               VALUES ('job_posting.status_closed', $1, $2::jsonb)`,
              [job.job_posting_id, JSON.stringify({ 
                reason: 'application_deadline_passed', 
                previous_status: job.status,
                deadline: job.application_deadline,
                automated: true 
              })]
            )
          }
        } catch (error: any) {
          logger.error(`Failed to update status for job ${job.job_posting_id}:`, error)
          // Continue with other jobs even if one fails
        }
      }
    } catch (error: any) {
      logger.error('Error in deadline status scheduler:', error)
    }
  }

  // Run immediately on start
  await checkAndUpdateDeadlines()

  // Then run every 15 minutes
  const CRON_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
  setInterval(checkAndUpdateDeadlines, CRON_INTERVAL_MS)
}

if (process.argv[1]?.includes('/scheduler')) {
  runDueSchedules().then(() => process.exit(0)).catch(() => process.exit(1))
}


