import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

// Helper to extract domain from email
function domainFromEmail(email: string): string | null {
  const match = email.match(/@(.+)/)
  return match ? match[1] : null
}

// Normalize skills array
function normalizeSkills(skills: string[]): string[] {
  return skills.map(s => s.trim().toUpperCase()).filter(Boolean)
}

export async function GET(request: NextRequest) {
  const { getPool } = await import('@/lib/db')
  let client: pg.PoolClient | null = null

  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
      userId = decoded.sub
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const pool = getPool()
    client = await pool.connect()

    // Get user's email for fallback lookup
    const { rows: userEmailRows } = await client.query<{ email: string }>(
      `SELECT email FROM users WHERE user_id = $1 LIMIT 1`,
      [userId]
    )
    const userEmail = userEmailRows.length > 0 ? userEmailRows[0].email : null

    // Check if user_id column exists
    const { rows: columnCheck } = await client.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'companies' AND column_name = 'user_id'`
    )
    const hasUserIdColumn = columnCheck.length > 0

    // Get user's company - try multiple methods
    let companyId: string | null = null
    
    if (hasUserIdColumn) {
      // Method 1: Find by user_id
      const { rows: userRows } = await client.query<{ company_id: string }>(
        `SELECT company_id FROM companies WHERE user_id = $1 LIMIT 1`,
        [userId]
      )
      if (userRows.length > 0) {
        companyId = userRows[0].company_id
      }
    }
    
    // Method 2: Fallback - find by user's email (hr_email or company_email)
    if (!companyId && userEmail) {
      const { rows: emailRows } = await client.query<{ company_id: string }>(
        `SELECT company_id FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
        [userEmail.toLowerCase()]
      )
      if (emailRows.length > 0) {
        companyId = emailRows[0].company_id
        // Link the company to the user if user_id column exists
        if (hasUserIdColumn) {
          await client.query(
            `UPDATE companies SET user_id = $1 WHERE company_id = $2`,
            [userId, companyId]
          )
        }
      }
    }

    // If no company found, try to find jobs directly by user's email in company
    let companyIds: string[] = []
    if (!companyId && userEmail) {
      console.log('No company found, trying to find companies by email:', userEmail)
      // Find ALL company_ids that match user's email
      const { rows: companyByEmail } = await client.query<{ company_id: string }>(
        `SELECT DISTINCT company_id FROM companies WHERE hr_email = $1 OR company_email = $1`,
        [userEmail.toLowerCase()]
      )
      if (companyByEmail.length > 0) {
        companyIds = companyByEmail.map(c => c.company_id)
        companyId = companyIds[0] // Use first for linking
        console.log('Found companies by email fallback:', companyIds)
        // Link them to user if possible
        if (hasUserIdColumn) {
          await client.query(
            `UPDATE companies SET user_id = $1 WHERE company_id = ANY($2::uuid[])`,
            [userId, companyIds]
          )
        }
      }
    } else if (companyId) {
      companyIds = [companyId]
    }

    // Final fallback: If no companies found but user has email, try to find jobs via company emails
    if (companyIds.length === 0 && userEmail) {
      console.log('No companies found, trying direct job lookup via company emails for:', userEmail)
      // Find companies that have this email and get their IDs
      const { rows: directCompanyRows } = await client.query<{ company_id: string }>(
        `SELECT company_id FROM companies 
         WHERE hr_email = $1 OR company_email = $1 OR hiring_manager_email = $1`,
        [userEmail.toLowerCase()]
      )
      if (directCompanyRows.length > 0) {
        companyIds = directCompanyRows.map(r => r.company_id)
        console.log('Found companies via direct lookup:', companyIds)
      }
    }

    // If still no companies found, return empty
    if (companyIds.length === 0) {
      console.log('No company found for user:', userId, 'email:', userEmail)
      // Last resort: try to get any jobs and see if we can match by company info
      const { rows: allJobs } = await client.query(
        `SELECT jp.job_posting_id, jp.company_id, c.hr_email, c.company_email 
         FROM job_postings jp 
         LEFT JOIN companies c ON c.company_id = jp.company_id 
         LIMIT 10`
      )
      console.log('Sample jobs in database:', allJobs.map(j => ({ 
        job_id: j.job_posting_id, 
        company_id: j.company_id,
        hr_email: j.hr_email,
        company_email: j.company_email
      })))
      return NextResponse.json({ 
        jobs: [],
        reports: {
          totalReports: 0,
          readyReports: 0
        }
      })
    }

    console.log('Querying jobs for company_ids:', companyIds, 'for user:', userId)

    // Get job postings for ALL matching companies with applicant stats
    // Note: applications table uses ai_status (SHORTLIST, FLAG, REJECT) not status
    const { rows: jobRows } = await client.query(
      `SELECT 
        jp.job_posting_id as id,
        jp.company_id,
        jp.job_title,
        jp.job_description,
        jp.skills_required as required_skills,
        jp.application_deadline,
        jp.interview_meeting_link,
        jp.meeting_link,
        jp.status,
        jp.created_at,
        jp.updated_at,
        COALESCE(COUNT(DISTINCT a.application_id), 0)::int as applicant_count,
        COALESCE(COUNT(DISTINCT CASE WHEN a.ai_status = 'SHORTLIST' THEN a.application_id END), 0)::int as shortlisted_count,
        COALESCE(COUNT(DISTINCT CASE WHEN a.ai_status = 'REJECT' THEN a.application_id END), 0)::int as rejected_count,
        COALESCE(COUNT(DISTINCT CASE WHEN a.ai_status = 'FLAG' THEN a.application_id END), 0)::int as flagged_count
      FROM job_postings jp
      LEFT JOIN applications a ON a.job_posting_id = jp.job_posting_id
      WHERE jp.company_id = ANY($1::uuid[])
      GROUP BY jp.job_posting_id, jp.company_id, jp.job_title, jp.job_description, 
               jp.skills_required, jp.application_deadline, jp.interview_meeting_link, 
               jp.meeting_link, jp.status, jp.created_at, jp.updated_at
      ORDER BY jp.created_at DESC`,
      [companyIds]
    )

    console.log('Found', jobRows.length, 'job postings for companies:', companyIds)
    if (jobRows.length > 0) {
      console.log('Sample job:', {
        id: jobRows[0].id,
        title: jobRows[0].job_title,
        company_id: jobRows[0].company_id
      })
    }

    // Get company info
    const { rows: companyRows } = await client.query(
      `SELECT company_name, company_email, hr_email FROM companies WHERE company_id = $1`,
      [companyId]
    )

    const company = companyRows[0] || {}

    // Get reports counts for the user's companies
    const { rows: reportCountRows } = await client.query<{ total_reports: string; ready_reports: string }>(
      `SELECT 
        COUNT(*)::int as total_reports,
        COUNT(*) FILTER (WHERE status = 'completed')::int as ready_reports
       FROM reports
       WHERE company_id = ANY($1::uuid[])`,
      [companyIds]
    )

    const reportsCounts = reportCountRows[0] || { total_reports: '0', ready_reports: '0' }
    const totalReports = Number(reportsCounts.total_reports || 0)
    const readyReports = Number(reportsCounts.ready_reports || 0)

    const jobs = jobRows.map(job => ({
      id: job.id,
      job_posting_id: job.id, // Also include as job_posting_id for compatibility
      company_id: job.company_id,
      company_name: company.company_name || '',
      company_email: company.company_email || '',
      hr_email: company.hr_email || '',
      job_title: job.job_title || 'Untitled Job',
      job_description: job.job_description || '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills : (job.required_skills ? [job.required_skills] : []),
      interview_meeting_link: job.interview_meeting_link || job.meeting_link || null,
      meeting_link: job.meeting_link || job.interview_meeting_link || null,
      application_deadline: job.application_deadline,
      status: job.status || 'ACTIVE',
      created_at: job.created_at,
      updated_at: job.updated_at,
      applicant_count: Number(job.applicant_count || 0),
      shortlisted_count: Number(job.shortlisted_count || 0),
      rejected_count: Number(job.rejected_count || 0),
      flagged_count: Number(job.flagged_count || 0)
    }))

    console.log('Returning', jobs.length, 'jobs to frontend')
    return NextResponse.json({ 
      jobs,
      reports: {
        totalReports,
        readyReports
      }
    })
  } catch (err) {
    console.error('Error fetching job postings:', err)
    return NextResponse.json(
      { error: 'Failed to fetch job postings', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (client) {
      client.release()
    }
  }
}

export async function POST(request: NextRequest) {
  const { getPool } = await import('@/lib/db')
  let client: pg.PoolClient | null = null

  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
      userId = decoded.sub
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      company_name,
      company_email,
      hr_email,
      job_title,
      job_description,
      required_skills,
      application_deadline,
      meeting_link
    } = body

    // Validation
    if (!company_name || !company_email || !hr_email || !job_title || !job_description) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    if (!required_skills || !Array.isArray(required_skills) || required_skills.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'At least one required skill is needed' } },
        { status: 400 }
      )
    }

    if (!application_deadline) {
      return NextResponse.json(
        { success: false, error: { message: 'Application deadline is required' } },
        { status: 400 }
      )
    }

    // Validate date
    const deadlineDate = new Date(application_deadline)
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid application_deadline format' } },
        { status: 400 }
      )
    }

    const pool = getPool()
    client = await pool.connect()

    await client.query('BEGIN')

    try {
      // Normalize skills
      const skills = normalizeSkills(required_skills)
      const companyDomain = domainFromEmail(company_email) || domainFromEmail(hr_email) || null

      // Find or create company
      let companyId: string

      // Check if user_id column exists
      const { rows: columnCheck } = await client.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'companies' AND column_name = 'user_id'`
      )
      const hasUserIdColumn = columnCheck.length > 0

      // Check if user already has a company
      let existingCompany: { company_id: string }[] = []
      if (hasUserIdColumn) {
        const result = await client.query<{ company_id: string }>(
          `SELECT company_id FROM companies WHERE user_id = $1 LIMIT 1`,
          [userId]
        )
        existingCompany = result.rows
      }

      if (existingCompany.length > 0) {
        companyId = existingCompany[0].company_id
        // Update company info
        await client.query(
          `UPDATE companies 
           SET company_name = $1, company_email = $2, hr_email = $3, updated_at = NOW()
           WHERE company_id = $4`,
          [company_name, company_email, hr_email, companyId]
        )
      } else {
        // Try to find by domain or email
        let companyRow: { company_id: string } | null = null

        if (companyDomain) {
          const { rows } = await client.query<{ company_id: string }>(
            `SELECT company_id FROM companies WHERE company_domain = $1 LIMIT 1`,
            [companyDomain]
          )
          companyRow = rows[0] || null
        }

        if (!companyRow) {
          const { rows } = await client.query<{ company_id: string }>(
            `SELECT company_id FROM companies WHERE company_email = $1 LIMIT 1`,
            [company_email]
          )
          companyRow = rows[0] || null
        }

        if (companyRow) {
          companyId = companyRow.company_id
          // Link company to user if column exists
          if (hasUserIdColumn) {
            await client.query(
              `UPDATE companies SET user_id = $1, updated_at = NOW() WHERE company_id = $2`,
              [userId, companyId]
            )
          }
        } else {
          // Create new company
          if (hasUserIdColumn) {
            const { rows: newCompany } = await client.query<{ company_id: string }>(
              `INSERT INTO companies (user_id, company_name, hr_email, hiring_manager_email, company_domain, company_email)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING company_id`,
              [
                userId,
                company_name,
                hr_email,
                hr_email, // fallback as hiring manager
                companyDomain || company_email.split('@')[1],
                company_email
              ]
            )
            companyId = newCompany[0].company_id
          } else {
            const { rows: newCompany } = await client.query<{ company_id: string }>(
              `INSERT INTO companies (company_name, hr_email, hiring_manager_email, company_domain, company_email)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING company_id`,
              [
                company_name,
                hr_email,
                hr_email, // fallback as hiring manager
                companyDomain || company_email.split('@')[1],
                company_email
              ]
            )
            companyId = newCompany[0].company_id
          }
        }
      }

      // Create job posting
      const meetingLink = meeting_link || null
      const { rows: jobRows } = await client.query<{ job_posting_id: string }>(
        `INSERT INTO job_postings
         (company_id, job_title, job_description, responsibilities, skills_required,
          application_deadline, interview_meeting_link, meeting_link, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
         RETURNING job_posting_id`,
        [
          companyId,
          job_title,
          job_description,
          job_description, // responsibilities mirrors job_description
          skills,
          deadlineDate.toISOString(),
          meetingLink,
          meetingLink
        ]
      )

      const jobPostingId = jobRows[0].job_posting_id

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        job_posting_id: jobPostingId,
        company_id: companyId
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('Error creating job posting:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'Failed to create job posting'
        }
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      client.release()
    }
  }
}

