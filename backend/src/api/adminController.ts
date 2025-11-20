import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import type { AuthRequest } from '../middleware/auth.js'

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

export async function getAllUsers(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = ''
    const params: any[] = [Number(limit), offset]
    
    if (search) {
      whereClause = `WHERE email ILIKE $3`
      params.push(`%${search}%`)
    }

    // Check if admin_approval_status and admin_permissions columns exist
    const { rows: colCheck } = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('admin_approval_status', 'admin_permissions')
    `)
    
    const hasApprovalStatus = colCheck.some((r: any) => r.column_name === 'admin_approval_status')
    const hasPermissions = colCheck.some((r: any) => r.column_name === 'admin_permissions')
    
    const selectFields = hasApprovalStatus && hasPermissions
      ? 'user_id, email, role, is_active, created_at, admin_approval_status, admin_permissions'
      : hasApprovalStatus
      ? 'user_id, email, role, is_active, created_at, admin_approval_status, NULL::jsonb as admin_permissions'
      : hasPermissions
      ? 'user_id, email, role, is_active, created_at, NULL::text as admin_approval_status, admin_permissions'
      : 'user_id, email, role, is_active, created_at, NULL::text as admin_approval_status, NULL::jsonb as admin_permissions'

    const { rows: users } = await query<{
      user_id: string
      email: string
      role: string
      is_active: boolean
      created_at: string
      admin_approval_status?: string | null
      admin_permissions?: Record<string, boolean> | null
    }>(
      `SELECT ${selectFields}
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    )

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      search ? [params[2]] : []
    )

    return res.json({
      users,
      total: Number(countRows[0].count),
      page: Number(page),
      limit: Number(limit)
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params
    const { role, is_active, admin_permissions } = req.body
    const authReq = req as AuthRequest
    const currentUserId = authReq.userId

    // STRICT: Prevent admin from deactivating themselves
    if (currentUserId === userId && is_active === false) {
      return res.status(403).json({ error: 'You cannot deactivate your own account' })
    }

    // STRICT: Prevent admin from removing their own admin role
    if (currentUserId === userId && role && role !== 'admin') {
      return res.status(403).json({ error: 'You cannot remove your own admin role' })
    }

    // If promoting to admin, require approval (set admin_approval_status to 'pending')
    if (role === 'admin') {
      const { rows: userRows } = await query<{ role: string }>(
        `SELECT role FROM users WHERE user_id = $1`,
        [userId]
      )
      
      if (userRows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      // If user is not already admin, set approval status to pending
      if (userRows[0].role !== 'admin') {
        const updates: string[] = []
        const params: any[] = []
        let paramIndex = 1

        updates.push(`role = $${paramIndex++}`)
        params.push('admin')
        
        // Check if admin_approval_status column exists
        const { rows: colCheck } = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'admin_approval_status'
        `)
        
        if (colCheck.length > 0) {
          updates.push(`admin_approval_status = $${paramIndex++}`)
          params.push('pending')
        }

        // Check if admin_permissions column exists
        const { rows: permCheck } = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'admin_permissions'
        `)
        
        if (permCheck.length > 0 && admin_permissions) {
          updates.push(`admin_permissions = $${paramIndex++}::jsonb`)
          params.push(JSON.stringify(admin_permissions))
        }

        updates.push(`updated_at = now()`)
        params.push(userId)

        await query(
          `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
          params
        )

        return res.json({ 
          success: true, 
          message: 'Admin role assigned. Approval required.',
          requires_approval: true 
        })
      }
    }

    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`)
      params.push(role)
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      params.push(is_active)
    }

    // Handle admin_permissions if provided
    if (admin_permissions !== undefined) {
      const { rows: permCheck } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_permissions'
      `)
      
      if (permCheck.length > 0) {
        updates.push(`admin_permissions = $${paramIndex++}::jsonb`)
        params.push(JSON.stringify(admin_permissions))
      }
    }

    // Handle admin_approval_status if provided (for approving/rejecting admin requests)
    if (req.body.admin_approval_status !== undefined) {
      const { rows: statusCheck } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_approval_status'
      `)
      
      if (statusCheck.length > 0) {
        updates.push(`admin_approval_status = $${paramIndex++}`)
        params.push(req.body.admin_approval_status)
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push(`updated_at = now()`)
    params.push(userId)

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
      params
    )

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user' })
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params
    const authReq = req as AuthRequest
    const currentUserId = authReq.userId

    // STRICT: Prevent admin from deleting themselves
    if (currentUserId === userId) {
      return res.status(403).json({ error: 'You cannot delete your own account' })
    }

    // Check if user being deleted is an admin
    const { rows: userRows } = await query<{ role: string }>(
      `SELECT role FROM users WHERE user_id = $1`,
      [userId]
    )

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent deleting the last admin
    if (userRows[0].role === 'admin') {
      const { rows: adminCount } = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = true`
      )
      if (Number(adminCount[0].count) <= 1) {
        return res.status(403).json({ error: 'Cannot delete the last active admin' })
      }
    }

    await query(`DELETE FROM users WHERE user_id = $1`, [userId])
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' })
  }
}

// ============================================================================
// COMPANIES MANAGEMENT
// ============================================================================

export async function getAllCompanies(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = ''
    const params: any[] = [Number(limit), offset]
    
    if (search) {
      whereClause = `WHERE company_name ILIKE $3 OR company_domain ILIKE $3 OR hr_email ILIKE $3`
      params.push(`%${search}%`)
    }

    const { rows: companies } = await query(
      `SELECT company_id, company_name, company_email, hr_email, 
              hiring_manager_email, company_domain, settings, 
              created_at, updated_at
       FROM companies 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    )

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM companies ${whereClause}`,
      search ? [params[2]] : []
    )

    return res.json({
      companies,
      total: Number(countRows[0].count),
      page: Number(page),
      limit: Number(limit)
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch companies' })
  }
}

export async function getCompanyDetails(req: Request, res: Response) {
  try {
    const { companyId } = req.params

    const { rows: companies } = await query(
      `SELECT * FROM companies WHERE company_id = $1`,
      [companyId]
    )

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Get job postings count
    const { rows: jobCount } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM job_postings WHERE company_id = $1`,
      [companyId]
    )

    // Get applications count
    const { rows: appCount } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM applications WHERE company_id = $1`,
      [companyId]
    )

    return res.json({
      company: companies[0],
      stats: {
        job_postings: Number(jobCount[0].count),
        applications: Number(appCount[0].count)
      }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch company details' })
  }
}

export async function updateCompany(req: Request, res: Response) {
  try {
    const { companyId } = req.params
    const { company_name, company_email, hr_email, hiring_manager_email, company_domain, settings } = req.body

    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (company_name !== undefined) {
      updates.push(`company_name = $${paramIndex++}`)
      params.push(company_name)
    }
    if (company_email !== undefined) {
      updates.push(`company_email = $${paramIndex++}`)
      params.push(company_email)
    }
    if (hr_email !== undefined) {
      updates.push(`hr_email = $${paramIndex++}`)
      params.push(hr_email)
    }
    if (hiring_manager_email !== undefined) {
      updates.push(`hiring_manager_email = $${paramIndex++}`)
      params.push(hiring_manager_email)
    }
    if (company_domain !== undefined) {
      updates.push(`company_domain = $${paramIndex++}`)
      params.push(company_domain)
    }
    if (settings !== undefined) {
      updates.push(`settings = $${paramIndex++}::jsonb`)
      params.push(JSON.stringify(settings))
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push(`updated_at = now()`)
    params.push(companyId)

    await query(
      `UPDATE companies SET ${updates.join(', ')} WHERE company_id = $${paramIndex}`,
      params
    )

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update company' })
  }
}

export async function deleteCompany(req: Request, res: Response) {
  try {
    const { companyId } = req.params
    await query(`DELETE FROM companies WHERE company_id = $1`, [companyId])
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete company' })
  }
}

// ============================================================================
// JOB POSTINGS MANAGEMENT
// ============================================================================

export async function getAllJobPostings(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '', status = '', company_id = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const conditions: string[] = []
    const params: any[] = [Number(limit), offset]
    let paramIndex = 3

    if (search) {
      conditions.push(`(job_title ILIKE $${paramIndex} OR job_description ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    if (company_id) {
      conditions.push(`company_id = $${paramIndex++}`)
      params.push(company_id)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows: jobs } = await query(
      `SELECT jp.*, c.company_name, c.company_domain
       FROM job_postings jp
       LEFT JOIN companies c ON jp.company_id = c.company_id
       ${whereClause}
       ORDER BY jp.created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    )

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM job_postings ${whereClause}`,
      params.slice(2)
    )

    return res.json({
      jobs,
      total: Number(countRows[0].count),
      page: Number(page),
      limit: Number(limit)
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch job postings' })
  }
}

export async function deleteJobPosting(req: Request, res: Response) {
  try {
    const { jobId } = req.params
    await query(`DELETE FROM job_postings WHERE job_posting_id = $1`, [jobId])
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete job posting' })
  }
}

// ============================================================================
// APPLICATIONS MANAGEMENT
// ============================================================================

export async function getAllApplications(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '', job_id = '', company_id = '', ai_status = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const conditions: string[] = []
    const params: any[] = [Number(limit), offset]
    let paramIndex = 3

    if (search) {
      conditions.push(`(a.candidate_name ILIKE $${paramIndex} OR a.email ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }
    if (job_id) {
      conditions.push(`a.job_posting_id = $${paramIndex++}`)
      params.push(job_id)
    }
    if (company_id) {
      conditions.push(`a.company_id = $${paramIndex++}`)
      params.push(company_id)
    }
    if (ai_status) {
      conditions.push(`a.ai_status = $${paramIndex++}`)
      params.push(ai_status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows: applications } = await query(
      `SELECT a.*, jp.job_title, c.company_name
       FROM applications a
       LEFT JOIN job_postings jp ON a.job_posting_id = jp.job_posting_id
       LEFT JOIN companies c ON a.company_id = c.company_id
       ${whereClause}
       ORDER BY a.created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    )

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM applications a ${whereClause}`,
      params.slice(2)
    )

    return res.json({
      applications,
      total: Number(countRows[0].count),
      page: Number(page),
      limit: Number(limit)
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch applications' })
  }
}

export async function deleteApplication(req: Request, res: Response) {
  try {
    const { applicationId } = req.params
    await query(`DELETE FROM applications WHERE application_id = $1`, [applicationId])
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete application' })
  }
}

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

export async function getSystemStats(req: Request, res: Response) {
  try {
    const [
      { rows: userStats },
      { rows: companyStats },
      { rows: jobStats },
      { rows: applicationStats },
      { rows: reportStats }
    ] = await Promise.all([
      query<{ total: string; active: string; admins: string }>(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE role = 'admin') as admins
         FROM users`
      ),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM companies`),
      query<{ count: string; active: string }>(
        `SELECT 
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
         FROM job_postings`
      ),
      query<{ count: string; shortlisted: string }>(
        `SELECT 
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE ai_status = 'SHORTLIST') as shortlisted
         FROM applications`
      ),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM reports`)
    ])

    return res.json({
      users: {
        total: Number(userStats[0].total),
        active: Number(userStats[0].active),
        admins: Number(userStats[0].admins)
      },
      companies: Number(companyStats[0].count),
      job_postings: {
        total: Number(jobStats[0].count),
        active: Number(jobStats[0].active)
      },
      applications: {
        total: Number(applicationStats[0].count),
        shortlisted: Number(applicationStats[0].shortlisted)
      },
      reports: Number(reportStats[0].count)
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch system stats' })
  }
}

