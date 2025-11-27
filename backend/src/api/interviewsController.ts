import type { Request, Response } from 'express'
import { ApplicationRepository } from '../repositories/applicationRepository.js'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { query } from '../db/index.js'
import { logger } from '../utils/logger.js'

export async function getScheduledInterviews(req: any, res: Response) {
  try {
    const userId = req.userId
    const userEmail = req.userEmail

    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Get user's company
    let companyId: string | null = null
    
    // Check if user_id column exists in companies table
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'user_id'
    `)
    
    if (checkColumn.rows.length > 0) {
      // Find company by user_id
      const companyResult = await query<{ company_id: string }>(
        `SELECT company_id FROM companies WHERE user_id = $1 LIMIT 1`,
        [userId]
      )
      if (companyResult.rows.length > 0) {
        companyId = companyResult.rows[0].company_id
      }
    }
    
    // Fallback: find by email
    if (!companyId && userEmail) {
      const companyResult = await query<{ company_id: string }>(
        `SELECT company_id FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
        [userEmail.toLowerCase()]
      )
      if (companyResult.rows.length > 0) {
        companyId = companyResult.rows[0].company_id
      }
    }

    if (!companyId) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Get all scheduled interviews for this company
    const { rows } = await query<{
      application_id: string
      candidate_name: string
      email: string
      interview_time: string
      interview_link: string
      job_posting_id: string
      job_title: string
      company_name: string
    }>(
      `SELECT 
        a.application_id,
        a.candidate_name,
        a.email,
        a.interview_time,
        a.interview_link,
        a.job_posting_id,
        j.job_title,
        c.company_name
      FROM applications a
      INNER JOIN job_postings j ON a.job_posting_id = j.job_posting_id
      INNER JOIN companies c ON a.company_id = c.company_id
      WHERE a.company_id = $1 
        AND a.interview_time IS NOT NULL
        AND a.interview_time > NOW()
        AND a.interview_status = 'SCHEDULED'
      ORDER BY a.interview_time ASC`,
      [companyId]
    )

    logger.info(`Found ${rows.length} scheduled interviews for company ${companyId}`)

    return res.status(200).json({
      success: true,
      interviews: rows.map(row => ({
        id: row.application_id,
        candidateName: row.candidate_name,
        candidateEmail: row.email,
        interviewTime: row.interview_time,
        interviewLink: row.interview_link,
        jobId: row.job_posting_id,
        jobTitle: row.job_title,
        companyName: row.company_name,
      })),
      total: rows.length
    })
  } catch (error: any) {
    logger.error('Failed to fetch scheduled interviews:', error)
    return res.status(500).json({
      error: 'Failed to fetch scheduled interviews',
      details: error.message
    })
  }
}
