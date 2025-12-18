import '../src/utils/env.js'
import { query } from '../src/db/index.js'
import { EmailService } from '../src/services/emailService.js'
import { logger } from '../src/utils/logger.js'

/**
 * Resend email notifications to shortlisted and rejected applicants
 * who didn't receive emails (e.g., analyzed before the email fix)
 */
async function resendEmailNotifications() {
  try {
    logger.info('Starting email notification resend process...')

    // Get all shortlisted and rejected applications
    const { rows: applications } = await query(
      `SELECT 
        a.application_id,
        a.candidate_name,
        a.email,
        a.ai_status,
        a.ai_score,
        jp.job_title,
        jp.job_posting_id,
        jp.meeting_link,
        c.company_id,
        c.company_name,
        c.company_email,
        c.company_domain
      FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.job_posting_id
      JOIN companies c ON jp.company_id = c.company_id
      WHERE a.ai_status IN ('SHORTLIST', 'REJECT')
      ORDER BY a.updated_at DESC`
    )

    if (applications.length === 0) {
      logger.info('No shortlisted or rejected applications found')
      return
    }

    logger.info(`Found ${applications.length} applications to process`)

    const emailService = new EmailService()
    let successCount = 0
    let failCount = 0

    for (const app of applications) {
      try {
        if (app.ai_status === 'SHORTLIST') {
          logger.info(`📧 Resending shortlist email to ${app.email} for application ${app.application_id}`)
          await emailService.sendShortlistEmail({
            candidateEmail: app.email,
            candidateName: app.candidate_name || 'Candidate',
            jobTitle: app.job_title,
            companyName: app.company_name,
            companyEmail: app.company_email,
            companyDomain: app.company_domain,
            interviewLink: app.meeting_link
          })
          logger.info(`✅ Shortlist email sent successfully to ${app.email}`)
          successCount++
        } else if (app.ai_status === 'REJECT') {
          logger.info(`📧 Resending rejection email to ${app.email} for application ${app.application_id}`)
          await emailService.sendRejectionEmail({
            candidateEmail: app.email,
            candidateName: app.candidate_name || 'Candidate',
            jobTitle: app.job_title,
            companyName: app.company_name,
            companyEmail: app.company_email,
            companyDomain: app.company_domain
          })
          logger.info(`✅ Rejection email sent successfully to ${app.email}`)
          successCount++
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)
        logger.error(`❌ Failed to send email to ${app.email} for application ${app.application_id}:`, errorMsg)
        failCount++
      }
    }

    logger.info(`Email resend complete: ${successCount} sent, ${failCount} failed`)
  } catch (error) {
    logger.error('Error in email notification resend:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resendEmailNotifications()
    .then(() => {
      logger.info('Email resend process completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Email resend process failed:', error)
      process.exit(1)
    })
}

export { resendEmailNotifications }

