import 'dotenv/config'
import { query } from '../db/index.js'
import { generatePostDeadlineReport } from '../services/reports/reportService.js'
import { logger } from '../utils/logger.js'

const CRON_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

export async function startReportScheduler() {
  logger.info('Report scheduler started - checking every 10 minutes for past-deadline jobs')

  async function checkAndGenerateReports() {
    try {
      logger.info('Checking for jobs that need report generation...')
      
      // Find jobs where deadline has passed and no report exists
      // Also include CLOSED jobs that might have been closed manually
      const { rows: jobs } = await query<{ 
        job_posting_id: string
        job_title: string
        company_id: string
        application_deadline: string | null
        status: string
      }>(
        `SELECT jp.job_posting_id, jp.job_title, jp.company_id, jp.application_deadline, jp.status
         FROM job_postings jp
         LEFT JOIN reports r ON r.job_posting_id = jp.job_posting_id
         WHERE (
           (jp.application_deadline IS NOT NULL AND jp.application_deadline < NOW())
           OR jp.status = 'CLOSED'
         )
           AND r.id IS NULL
         ORDER BY jp.application_deadline ASC NULLS LAST
         LIMIT 20`,
        []
      )

      if (jobs.length === 0) {
        logger.debug('No jobs found that need report generation')
        return
      }

      logger.info(`Found ${jobs.length} job(s) needing report generation`)

      for (const job of jobs) {
        try {
          logger.info(`Generating report for job ${job.job_posting_id} (${job.job_title}) - Status: ${job.status}, Deadline: ${job.application_deadline || 'N/A'}`)
          const result = await generatePostDeadlineReport(job.job_posting_id)
          logger.info(`✅ Report generated successfully: ${result.reportId} for job ${job.job_posting_id}`)
        } catch (error: any) {
          logger.error(`❌ Failed to generate report for job ${job.job_posting_id}:`, error.message || error)
          // Continue with other jobs even if one fails
        }
      }
    } catch (error: any) {
      logger.error('Error in report scheduler:', error)
    }
  }

  // Run immediately on start
  await checkAndGenerateReports()

  // Then run every 10 minutes
  setInterval(checkAndGenerateReports, CRON_INTERVAL_MS)
}

// Note: Scheduler is now started explicitly in server.ts
// This allows better control and error handling during server startup

