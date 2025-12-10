import { sendEmail } from './mailer.js'
import { query } from '../db/index.js'
import { cleanJobTitle } from '../utils/jobTitle.js'

interface CompanyData {
  company_name: string
  email: string | null
}

interface JobData {
  job_title: string
  company_id: string | null
}

export async function sendDecisionEmail(opts: { 
  to: string
  candidateName: string
  status: 'SHORTLIST' | 'FLAG' | 'REJECT'
  interviewLink: string | null
  jobPostingId?: string
  companyId?: string | null
}) {
  let companyData: CompanyData | null = null
  let jobData: JobData | null = null
  let hrEmail = 'hirebitapplications@gmail.com' // Default HR email

  // Fetch company and job details if IDs are provided
  if (opts.jobPostingId) {
    try {
      // Fetch job details
      const { rows: jobRows } = await query<JobData & { company_id: string | null }>(
        `SELECT job_title, company_id FROM job_postings WHERE job_posting_id = $1`,
        [opts.jobPostingId]
      )
      
      if (jobRows.length > 0) {
        jobData = {
          job_title: jobRows[0].job_title,
          company_id: jobRows[0].company_id
        }

        // Fetch company details
        const companyId = opts.companyId || jobRows[0].company_id
        if (companyId) {
          const { rows: companyRows } = await query<{ company_name: string; hr_email: string | null; company_email: string | null }>(
            `SELECT company_name, hr_email, company_email FROM companies WHERE company_id = $1`,
            [companyId]
          )
          
          if (companyRows.length > 0) {
            companyData = {
              company_name: companyRows[0].company_name,
              email: companyRows[0].hr_email || companyRows[0].company_email
            }
            if (companyData.email) {
              hrEmail = companyData.email
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching company/job details for email:', error)
      // Continue with default values if fetch fails
    }
  }

  const companyName = companyData?.company_name || '[Company Name]'
  const jobTitle = jobData?.job_title || '[Job Title]'
  const candidateName = opts.candidateName || '[Candidate\'s Full Name]'

  if (opts.status === 'REJECT') {
    const subject = `Update on Your Application for the ${jobTitle} Position at ${companyName}`
    const text = `Dear ${candidateName},

Thank you for taking the time to apply for the ${jobTitle} position at ${companyName} and for your interest in joining our team. We truly appreciate the effort you put into your application and the time you invested in the selection process.

After careful consideration and review of all candidates, we regret to inform you that we will not be moving forward with your application at this time. This decision was not easy, as we received a high number of strong applications, including yours.

Although you were not selected for this role, we encourage you to apply for future opportunities that match your skills and experience. Your profile is impressive, and we believe you may be a strong fit for upcoming positions within ${companyName}.

If you have any questions or would like feedback regarding your application, please feel free to contact us at ${hrEmail}.

We sincerely appreciate your interest in our company and wish you the very best in your job search and future career endeavors.

Kind regards,

Company Name: ${companyName}
Company Email: ${hrEmail}`

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <p>Dear ${candidateName},</p>
        
        <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for your interest in joining our team. We truly appreciate the effort you put into your application and the time you invested in the selection process.</p>
        
        <p>After careful consideration and review of all candidates, we regret to inform you that we will not be moving forward with your application at this time. This decision was not easy, as we received a high number of strong applications, including yours.</p>
        
        <p>Although you were not selected for this role, we encourage you to apply for future opportunities that match your skills and experience. Your profile is impressive, and we believe you may be a strong fit for upcoming positions within <strong>${companyName}</strong>.</p>
        
        <p>If you have any questions or would like feedback regarding your application, please feel free to contact us at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
        
        <p>We sincerely appreciate your interest in our company and wish you the very best in your job search and future career endeavors.</p>
        
        <p>Kind regards,<br>
        <strong>Company Name:</strong> ${companyName}<br>
        <strong>Company Email:</strong> ${hrEmail}</p>
      </div>
    `

    await sendEmail({
      to: opts.to,
      subject,
      text
    })
  } else if (opts.status === 'FLAG') {
    // Notify candidate softly or skip; here we send acknowledgement without decision
    await sendEmail({
      to: opts.to,
      subject: 'Application Received',
      text: `Hi ${candidateName},\n\nThanks for applying. Your application is under review.\n\nBest,\n${companyName}`
    })
  } else if (opts.status === 'SHORTLIST') {
    const cleanedJobTitle = cleanJobTitle(jobTitle)
    
    const subject = `Final Interview Invitation – ${cleanedJobTitle} at ${companyName}`
    const text = `Dear ${candidateName},

Congratulations! After reviewing your application for the ${cleanedJobTitle} position at ${companyName}, we are pleased to inform you that you have been shortlisted for the next stage of our recruitment process.

Your final interview has been scheduled as follows:

Interview Details:

Position: ${cleanedJobTitle}

Company: ${companyName}

${opts.interviewLink ? `Meeting Link: ${opts.interviewLink}\n` : ''}
During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.

If you have any questions before the interview or need to make changes, feel free to contact our HR team at ${hrEmail}.

We look forward to meeting you and learning more about how you can contribute to our team. Thank you!

Kind regards,

Company Name: ${companyName}

Company Email: ${hrEmail}`

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <p>Dear ${candidateName},</p>
        
        <p>Congratulations! After reviewing your application for the <strong>${cleanedJobTitle}</strong> position at <strong>${companyName}</strong>, we are pleased to inform you that you have been shortlisted for the next stage of our recruitment process.</p>
        
        <p>Your final interview has been scheduled as follows:</p>
        
        <p><strong>Interview Details:</strong></p>
        <p><strong>Position:</strong> ${cleanedJobTitle}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        ${opts.interviewLink ? `<p><strong>Meeting Link:</strong> <a href="${opts.interviewLink}">${opts.interviewLink}</a></p>` : ''}
        
        <p>During this session, we will discuss your experience, your fit for the role, and the value you can bring to our team.</p>
        
        <p>If you have any questions before the interview or need to make changes, feel free to contact our HR team at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
        
        <p>We look forward to meeting you and learning more about how you can contribute to our team. Thank you!</p>
        
        <p>Kind regards,<br>
        <strong>Company Name:</strong> ${companyName}<br>
        <strong>Company Email:</strong> ${hrEmail}</p>
      </div>
    `

    await sendEmail({
      to: opts.to,
      subject,
      text
    })
  }
}


