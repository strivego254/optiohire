import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import type { AuthRequest } from '../middleware/auth.js'

// Get current user profile
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check which columns exist
    const { rows: colCheck } = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('name', 'company_role')
    `)
    
    const hasNameColumn = colCheck.some((r: any) => r.column_name === 'name')
    const hasCompanyRoleColumn = colCheck.some((r: any) => r.column_name === 'company_role')
    
    const selectFields = [
      'user_id',
      'email',
      'role',
      'is_active',
      'created_at',
      'updated_at',
      hasNameColumn ? 'name' : 'NULL::text as name',
      hasCompanyRoleColumn ? 'company_role' : 'NULL::text as company_role'
    ].join(', ')
    
    const { rows } = await query<{
      user_id: string
      email: string
      role: string
      is_active: boolean
      created_at: string
      updated_at: string | null
      name?: string | null
      company_role?: string | null
    }>(
      `SELECT ${selectFields}
       FROM users 
       WHERE user_id = $1`,
      [userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = rows[0]

    // STRICT: Check if user has a company (except admin)
    let hasCompany = false
    let companyId = null
    let companyName = null
    let companyEmail = null
    let hrEmail = null
    let hiringManagerEmail = null
    
    if (user.role !== 'admin') {
      try {
        // Check if user_id column exists in companies table
        const checkColumn = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'companies' AND column_name = 'user_id'
        `)
        
        if (checkColumn.rows.length > 0) {
          // user_id column exists, check by user_id
          const companyCheck = await query<{ company_id: string; company_name: string; company_email: string; hr_email: string; hiring_manager_email: string }>(
            `SELECT company_id, company_name, company_email, hr_email, hiring_manager_email FROM companies WHERE user_id = $1 LIMIT 1`,
            [userId]
          )
          hasCompany = companyCheck.rows.length > 0
          if (hasCompany) {
            companyId = companyCheck.rows[0]?.company_id || null
            companyName = companyCheck.rows[0]?.company_name || null
            companyEmail = companyCheck.rows[0]?.company_email || null
            hrEmail = companyCheck.rows[0]?.hr_email || null
            hiringManagerEmail = companyCheck.rows[0]?.hiring_manager_email || null
          }
        } else {
          // Fallback: check by email (hr_email or company_email)
          const companyCheck = await query<{ company_id: string; company_name: string; company_email: string; hr_email: string; hiring_manager_email: string }>(
            `SELECT company_id, company_name, company_email, hr_email, hiring_manager_email FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
            [user.email]
          )
          hasCompany = companyCheck.rows.length > 0
          if (hasCompany) {
            companyId = companyCheck.rows[0]?.company_id || null
            companyName = companyCheck.rows[0]?.company_name || null
            companyEmail = companyCheck.rows[0]?.company_email || null
            hrEmail = companyCheck.rows[0]?.hr_email || null
            hiringManagerEmail = companyCheck.rows[0]?.hiring_manager_email || null
          }
        }
      } catch (err) {
        console.error('Error checking company:', err)
        // Strict enforcement: if check fails, assume no company
        hasCompany = false
      }
    } else {
      // Admin always has access
      hasCompany = true
    }

    return res.json({
      id: user.user_id,
      user_id: user.user_id,
      name: user.name || null,
      email: user.email,
      role: user.role,
      company_role: user.company_role || null,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      hasCompany,
      companyId,
      companyName,
      companyEmail,
      hrEmail,
      hiring_manager_email: hiringManagerEmail
    })
  } catch (err) {
    console.error('Error getting user profile:', err)
    return res.status(500).json({ error: 'Failed to get user profile' })
  }
}

// Update user's company details
export async function updateUserCompany(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { company_name, company_email, hr_email } = req.body || {}

    if (!company_name || !company_email || !hr_email) {
      return res.status(400).json({ error: 'Company name, company email, and HR email are required' })
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(company_email) || !emailRegex.test(hr_email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Find user's company
    let companyId: string | null = null
    
    // Check if user_id column exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'user_id'
    `)
    
    const hasUserIdColumn = checkColumn.rows.length > 0

    if (hasUserIdColumn) {
      // Find company by user_id
      const { rows: companyRows } = await query<{ company_id: string }>(
        `SELECT company_id FROM companies WHERE user_id = $1 LIMIT 1`,
        [userId]
      )
      if (companyRows.length > 0) {
        companyId = companyRows[0].company_id
      }
    }

    if (!companyId) {
      // Fallback: find by email
      const { rows: userRows } = await query<{ email: string }>(
        `SELECT email FROM users WHERE user_id = $1`,
        [userId]
      )
      if (userRows.length > 0) {
        const { rows: companyRows } = await query<{ company_id: string }>(
          `SELECT company_id FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
          [userRows[0].email]
        )
        if (companyRows.length > 0) {
          companyId = companyRows[0].company_id
        }
      }
    }

    if (!companyId) {
      return res.status(404).json({ error: 'Company not found for this user' })
    }

    // Extract domain from company_email
    const companyDomain = company_email.split('@')[1] || null

    // Update company
    await query(
      `UPDATE companies 
       SET company_name = $1, 
           company_email = $2, 
           hr_email = $3,
           company_domain = $4,
           updated_at = NOW()
       WHERE company_id = $5`,
      [company_name, company_email, hr_email, companyDomain, companyId]
    )

    return res.json({
      success: true,
      company: {
        company_id: companyId,
        company_name,
        company_email,
        hr_email
      }
    })
  } catch (err) {
    console.error('Error updating company:', err)
    return res.status(500).json({ error: 'Failed to update company' })
  }
}

