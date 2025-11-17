import { query } from '../../db/index.js'
import { generateReportAnalysis, type ApplicantData, type JobData, type CompanyData } from '../ai/reportGenerator.js'
import { generateReportPDF, type ReportData } from './pdfGenerator.js'
import { saveFile } from '../../utils/storage.js'
import { EmailService } from '../emailService.js'
import { logger } from '../../utils/logger.js'
import { CandidateRepository } from '../../repositories/candidateRepository.js'
import { JobPostingRepository } from '../../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../../repositories/companyRepository.js'

export interface ReportResult {
  reportId: string
  reportUrl: string
  jobId: string
  companyId: string
}

export async function generatePostDeadlineReport(jobPostingId: string): Promise<ReportResult> {
  const candidateRepo = new CandidateRepository()
  const jobPostingRepo = new JobPostingRepository()
  const companyRepo = new CompanyRepository()
  const emailService = new EmailService()

  // Check if report already exists
  const { rows: existing } = await query<{ id: string }>(
    `SELECT id FROM reports 
     WHERE job_posting_id = $1
     LIMIT 1`,
    [jobPostingId]
  )

  if (existing.length > 0) {
    const { rows: report } = await query<{ id: string; report_url: string; company_id: string }>(
      `SELECT id, report_url, company_id FROM reports WHERE id = $1`,
      [existing[0].id]
    )
    return {
      reportId: report[0].id,
      reportUrl: report[0].report_url,
      jobId: jobPostingId,
      companyId: report[0].company_id
    }
  }

  // Fetch job data
  const job = await jobPostingRepo.findById(jobPostingId)
  if (!job) {
    throw new Error('Job posting not found')
  }

  // Fetch company data
  const company = await companyRepo.findById(job.company_id)
  if (!company) {
    throw new Error('Company not found')
  }

  // Fetch all candidates
  const candidates = await candidateRepo.findByJob(jobPostingId)

  const applicants: ApplicantData[] = candidates.map(candidate => ({
    id: candidate.id,
    candidate_name: candidate.candidate_name,
    email: candidate.email,
    ai_score: candidate.score,
    ai_status: candidate.status,
    reasoning: candidate.reasoning,
    parsed_resume_json: {
      linkedin: candidate.parsedlinkedin,
      github: candidate.parsedgithub,
      email: candidate.parsedemail
    },
    links: [
      candidate.parsedlinkedin,
      candidate.parsedgithub
    ].filter(Boolean) as string[]
  }))

  // Calculate statistics
  const total = applicants.length
  const shortlisted = applicants.filter(a => a.ai_status === 'SHORTLIST').length
  const flagged = applicants.filter(a => a.ai_status === 'FLAGGED').length
  const rejected = applicants.filter(a => a.ai_status === 'REJECTED').length
  const scores = applicants.filter(a => a.ai_score !== null).map(a => a.ai_score!)
  const averageScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0

  // Generate AI analysis
  logger.info(`Generating AI analysis for job ${jobPostingId}...`)
  const jobData: JobData = {
    job_posting_id: job.job_posting_id,
    job_title: job.job_title,
    job_description: job.job_description,
    responsibilities: '', // Not in new schema
    skills_required: job.required_skills,
    application_deadline: job.application_deadline
  }
  const companyData: CompanyData = {
    company_id: company.company_id,
    company_name: company.company_name,
    hr_email: company.hr_email
  }
  const analysis = await generateReportAnalysis(jobData, companyData, applicants)

  // Generate PDF
  logger.info(`Generating PDF report for job ${jobPostingId}...`)
  const reportData: ReportData = {
    job: jobData,
    company: companyData,
    applicants,
    analysis,
    statistics: {
      total,
      shortlisted,
      flagged,
      rejected,
      averageScore
    }
  }

  const pdfBuffer = await generateReportPDF(reportData)

  // Save PDF to storage
  const filename = `reports/${jobPostingId}_${Date.now()}.pdf`
  const reportPath = await saveFile(filename, pdfBuffer)

  // Construct report URL (adjust based on your storage setup)
  const reportUrl = process.env.PDF_BUCKET_URL 
    ? `${process.env.PDF_BUCKET_URL}/${filename}`
    : reportPath

    // Save report to database
    const { rows: reportRows } = await query<{ id: string }>(
      `INSERT INTO reports (job_posting_id, company_id, report_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_posting_id) DO UPDATE SET
         report_url = EXCLUDED.report_url
       RETURNING id`,
      [
        jobPostingId,
        company.company_id,
        reportUrl
      ]
    )

  const reportId = reportRows[0].id

    // Send email to HR
    logger.info(`Sending report email to ${company.hr_email}...`)
    await sendReportEmail(companyData, jobData, reportUrl, reportData, emailService)

    // Log audit
    await query(
      `INSERT INTO audit_logs (action, company_id, job_posting_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        'report_generated',
        company.company_id,
        jobPostingId,
        JSON.stringify({
          reportId,
          totalApplicants: total,
          reportUrl
        })
      ]
    )

  logger.info(`Report generated successfully: ${reportId}`)

    return {
      reportId,
      reportUrl,
      jobId: jobPostingId,
      companyId: company.company_id
    }
}

async function sendReportEmail(
  company: CompanyData,
  job: JobData,
  reportUrl: string,
  reportData: ReportData,
  emailService: EmailService
) {
  const deadline = job.application_deadline 
    ? new Date(job.application_deadline).toLocaleDateString()
    : 'N/A'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #2D2DDD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .stats { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Final Hiring Report</h1>
    </div>
    <div class="content">
      <h2>${job.job_title}</h2>
      <p><strong>Company:</strong> ${company.company_name}</p>
      <p><strong>Application Deadline:</strong> ${deadline}</p>
      
      <div class="stats">
        <h3>Summary Statistics</h3>
        <p><strong>Total Applicants:</strong> ${reportData.statistics.total}</p>
        <p><strong>Shortlisted:</strong> ${reportData.statistics.shortlisted}</p>
        <p><strong>Flagged (Needs Review):</strong> ${reportData.statistics.flagged}</p>
        <p><strong>Rejected:</strong> ${reportData.statistics.rejected}</p>
        <p><strong>Average Score:</strong> ${reportData.statistics.averageScore.toFixed(1)}/100</p>
      </div>

      <h3>Executive Summary</h3>
      <p>${reportData.analysis.executiveSummary}</p>

      ${reportData.analysis.top3Candidates.length > 0 ? `
      <h3>Top 3 Candidates</h3>
      <ul>
        ${reportData.analysis.top3Candidates.map(c => `
          <li><strong>${c.name}</strong> (${c.email}) - Score: ${c.score}/100</li>
        `).join('')}
      </ul>
      ` : ''}

      <a href="${reportUrl}" class="button">Download Full Report (PDF)</a>
      
      <p>You can also view this report in your dashboard.</p>
    </div>
    <div class="footer">
      <p>This is an automated report from HireBit</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Final Hiring Report - ${job.job_title}

Company: ${company.company_name}
Application Deadline: ${deadline}

Summary Statistics:
- Total Applicants: ${reportData.statistics.total}
- Shortlisted: ${reportData.statistics.shortlisted}
- Flagged (Needs Review): ${reportData.statistics.flagged}
- Rejected: ${reportData.statistics.rejected}
- Average Score: ${reportData.statistics.averageScore.toFixed(1)}/100

Executive Summary:
${reportData.analysis.executiveSummary}

${reportData.analysis.top3Candidates.length > 0 ? `
Top 3 Candidates:
${reportData.analysis.top3Candidates.map((c, i) => `${i + 1}. ${c.name} (${c.email}) - Score: ${c.score}/100`).join('\n')}
` : ''}

Download Full Report: ${reportUrl}

Generated on ${new Date().toLocaleString()}
  `

    await emailService.sendEmail({
      to: company.hr_email,
      subject: `Final Hiring Report – ${job.job_title} – ${company.company_name}`,
      html,
      text
    })
}

