import '../src/utils/env.js'
import { query } from '../src/db/index.js'
import { logger } from '../src/utils/logger.js'

async function checkRecentApplications() {
  try {
    logger.info('🔍 Checking recent applications and job postings...')
    
    // Get recent job postings
    const { rows: jobs } = await query(`
      SELECT 
        job_posting_id,
        job_title,
        status,
        company_id,
        created_at
      FROM job_postings
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    logger.info(`\n📋 Found ${jobs.length} recent job posting(s):`)
    jobs.forEach((job, idx) => {
      logger.info(`  ${idx + 1}. "${job.job_title}" (ID: ${job.job_posting_id}, Status: ${job.status || 'NULL'}, Created: ${job.created_at})`)
    })
    
    // Get recent applications
    const { rows: applications } = await query(`
      SELECT 
        a.application_id,
        a.candidate_email,
        a.candidate_name,
        a.ai_status,
        a.score,
        a.created_at,
        jp.job_title,
        jp.status as job_status
      FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.job_posting_id
      ORDER BY a.created_at DESC
      LIMIT 20
    `)
    
    logger.info(`\n📧 Found ${applications.length} recent application(s):`)
    if (applications.length === 0) {
      logger.warn('  ⚠️ No applications found in database!')
    } else {
      applications.forEach((app, idx) => {
        logger.info(`  ${idx + 1}. ${app.candidate_email} -> "${app.job_title}" (Status: ${app.ai_status || 'NULL'}, Score: ${app.score || 'N/A'}, Created: ${app.created_at})`)
      })
    }
    
    // Check for jobs with no applications
    logger.info(`\n🔍 Checking for jobs with no applications...`)
    for (const job of jobs) {
      const { rows: jobApps } = await query(`
        SELECT COUNT(*) as count
        FROM applications
        WHERE job_posting_id = $1
      `, [job.job_posting_id])
      
      const count = parseInt(jobApps[0]?.count || '0')
      if (count === 0) {
        logger.warn(`  ⚠️ Job "${job.job_title}" (ID: ${job.job_posting_id}) has NO applications`)
      } else {
        logger.info(`  ✅ Job "${job.job_title}" has ${count} application(s)`)
      }
    }
    
    // Check active jobs
    const { rows: activeJobs } = await query(`
      SELECT job_posting_id, job_title, status
      FROM job_postings
      WHERE (status IS NULL OR UPPER(TRIM(status)) = 'ACTIVE' OR status = '')
      ORDER BY created_at DESC
    `)
    
    logger.info(`\n✅ Active jobs (for email matching): ${activeJobs.length}`)
    activeJobs.forEach((job, idx) => {
      logger.info(`  ${idx + 1}. "${job.job_title}" (Status: ${job.status || 'NULL'})`)
    })
    
    process.exit(0)
  } catch (error: any) {
    logger.error('❌ Error checking applications:', error)
    process.exit(1)
  }
}

checkRecentApplications()

