import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import { createCompanyReportPdf } from '../utils/pdf.js'
import { sendEmail } from '../email/mailer.js'

export async function createCompany(req: Request, res: Response) {
  try {
    const { company_name, company_domain, hr_email, hiring_manager_email } = req.body || {}
    if (!company_name || !company_domain || !hr_email || !hiring_manager_email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { rows } = await query<{ company_id: string }>(
      `insert into companies (company_name, hr_email, hiring_manager_email, company_domain)
       values ($1,$2,$3,$4)
       returning company_id`,
      [company_name, hr_email, hiring_manager_email, company_domain]
    )
    const companyId = rows[0].company_id
    await query(
      `insert into audit_logs (action, company_id, metadata)
       values ('COMPANY_CREATED',$1,$2::jsonb)`,
      [companyId, JSON.stringify({ company_name, company_domain })]
    )
    return res.status(201).json({ company_id: companyId })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create company' })
  }
}

export async function getCompanyReport(req: Request, res: Response) {
  try {
    const companyId = req.params.id
    const { rows: companyRows } = await query(
      `select company_name, hr_email, hiring_manager_email
       from companies where company_id = $1`,
      [companyId]
    )
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Company not found' })
    }
    const company = companyRows[0] as { company_name: string; hr_email: string; hiring_manager_email: string }

    const { rows: jobStats } = await query(
      `select j.job_posting_id, j.job_title,
              count(a.application_id) as total_applicants,
              count(*) filter (where a.ai_status = 'SHORTLIST') as shortlisted,
              count(*) filter (where a.ai_status = 'FLAG') as flagged,
              count(*) filter (where a.ai_status = 'REJECT') as rejected
       from job_postings j
       left join applications a on a.job_posting_id = j.job_posting_id
       where j.company_id = $1
       group by j.job_posting_id, j.job_title
       order by j.job_title`,
      [companyId]
    )

    const pdf = await createCompanyReportPdf(company.company_name, jobStats as any[])

    await sendEmail({
      to: [company.hr_email, company.hiring_manager_email].filter(Boolean).join(','),
      subject: `Hiring Report - ${company.company_name}`,
      text: 'Attached is your latest hiring report.',
      attachments: [{ filename: 'hiring-report.pdf', content: pdf }]
    })

    return res.status(200).json({ message: 'Report generated and emailed' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate report' })
  }
}


