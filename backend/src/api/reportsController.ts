import type { Request, Response } from 'express'
import { generatePostDeadlineReport } from '../services/reports/reportService.js'
import { query } from '../db/index.js'
import { logger } from '../utils/logger.js'

export async function generateReport(req: Request, res: Response) {
  try {
    const { jobPostingId } = req.body || {}
    
    if (!jobPostingId) {
      return res.status(400).json({ error: 'jobPostingId is required' })
    }

    // TODO: Add auth check - ensure user is HR/admin for this job's company
    // For now, allow any authenticated user

    logger.info(`Manual report generation requested for job ${jobPostingId}`)
    const result = await generatePostDeadlineReport(jobPostingId)

    return res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      report: result
    })
  } catch (error: any) {
    logger.error('Failed to generate report:', error)
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    })
  }
}

export async function getReport(req: Request, res: Response) {
  try {
    const { jobId } = req.params

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' })
    }

    // TODO: Add auth check - ensure user has access to this job's company

    const { rows } = await query<{
      id: string
      report_url: string
      created_at: string
    }>(
      `SELECT id, report_url, created_at
       FROM reports
       WHERE job_posting_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [jobId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }

    return res.status(200).json({
      report: {
        id: rows[0].id,
        reportUrl: rows[0].report_url,
        createdAt: rows[0].created_at
      }
    })
  } catch (error: any) {
    logger.error('Failed to fetch report:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch report',
      details: error.message 
    })
  }
}

export async function autoGenerateReports(req: Request, res: Response) {
  try {
    // Verify cron secret
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    logger.info('Auto-generating reports for past-deadline jobs...')

    // Find jobs where deadline has passed and no report exists
    const { rows: jobs } = await query<{ job_posting_id: string; job_title: string }>(
      `SELECT jp.job_posting_id, jp.job_title
       FROM job_postings jp
       LEFT JOIN reports r ON r.job_posting_id = jp.job_posting_id
       WHERE jp.application_deadline IS NOT NULL
         AND jp.application_deadline < NOW()
         AND r.id IS NULL
       LIMIT 10`,
      []
    )

    const results = []

    for (const job of jobs) {
      try {
        logger.info(`Generating report for job ${job.job_posting_id} (${job.job_title})...`)
        const result = await generatePostDeadlineReport(job.job_posting_id)
        results.push({ jobId: job.job_posting_id, success: true, reportId: result.reportId })
      } catch (error: any) {
        logger.error(`Failed to generate report for job ${job.job_posting_id}:`, error)
        results.push({ jobId: job.job_posting_id, success: false, error: error.message })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${jobs.length} jobs`,
      results
    })
  } catch (error: any) {
    logger.error('Auto-generate reports failed:', error)
    return res.status(500).json({ 
      error: 'Failed to auto-generate reports',
      details: error.message 
    })
  }
}

