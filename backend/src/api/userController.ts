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

    const { rows } = await query<{
      user_id: string
      email: string
      role: string
      is_active: boolean
      created_at: string
      updated_at: string | null
    }>(
      `SELECT user_id, email, role, is_active, created_at, updated_at 
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
          const companyCheck = await query<{ company_id: string; company_name: string; company_email: string; hr_email: string }>(
            `SELECT company_id, company_name, company_email, hr_email FROM companies WHERE user_id = $1 LIMIT 1`,
            [userId]
          )
          hasCompany = companyCheck.rows.length > 0
          if (hasCompany) {
            companyId = companyCheck.rows[0]?.company_id || null
            companyName = companyCheck.rows[0]?.company_name || null
            companyEmail = companyCheck.rows[0]?.company_email || null
            hrEmail = companyCheck.rows[0]?.hr_email || null
          }
        } else {
          // Fallback: check by email (hr_email or company_email)
          const companyCheck = await query<{ company_id: string; company_name: string; company_email: string; hr_email: string }>(
            `SELECT company_id, company_name, company_email, hr_email FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
            [user.email]
          )
          hasCompany = companyCheck.rows.length > 0
          if (hasCompany) {
            companyId = companyCheck.rows[0]?.company_id || null
            companyName = companyCheck.rows[0]?.company_name || null
            companyEmail = companyCheck.rows[0]?.company_email || null
            hrEmail = companyCheck.rows[0]?.hr_email || null
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
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      hasCompany,
      companyId,
      companyName,
      companyEmail,
      hrEmail
    })
  } catch (err) {
    console.error('Error getting user profile:', err)
    return res.status(500).json({ error: 'Failed to get user profile' })
  }
}

