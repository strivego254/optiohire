import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  userRole?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }

    // Verify user exists and is active
    const { rows } = await query<{ user_id: string; email: string; role: string; is_active: boolean }>(
      `SELECT user_id, email, role, is_active FROM users WHERE user_id = $1`,
      [decoded.sub]
    )

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    // STRICT: Check if user has a company (except for admin)
    if (rows[0].role !== 'admin') {
      try {
        // Check if user_id column exists in companies table
        const checkColumn = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'companies' AND column_name = 'user_id'
        `)
        
        let hasCompany = false
        if (checkColumn.rows.length > 0) {
          // user_id column exists, check by user_id
          const companyCheck = await query(
            `SELECT company_id FROM companies WHERE user_id = $1 LIMIT 1`,
            [decoded.sub]
          )
          hasCompany = companyCheck.rows.length > 0
        } else {
          // Fallback: check by email (hr_email or company_email)
          const companyCheck = await query(
            `SELECT company_id FROM companies WHERE hr_email = $1 OR company_email = $1 LIMIT 1`,
            [rows[0].email]
          )
          hasCompany = companyCheck.rows.length > 0
        }

        if (!hasCompany) {
          return res.status(403).json({ 
            error: 'Access denied: Company profile required',
            details: 'Your account must have a company profile to access this resource. Please contact support.'
          })
        }
      } catch (err) {
        console.error('Error checking company:', err)
        // Strict enforcement: if check fails, deny access
        return res.status(403).json({ 
          error: 'Access denied: Unable to verify company profile',
          details: 'Please contact support to set up your company profile.'
        })
      }
    }

    req.userId = rows[0].user_id
    req.userEmail = rows[0].email
    req.userRole = rows[0].role

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  // Check if admin is approved (if approval_status column exists)
  // Use async IIFE to handle async operations
  ;(async () => {
    try {
      const { rows: colCheck } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_approval_status'
      `)
      
      if (colCheck.length > 0 && req.userId) {
        const { rows: userRows } = await query<{ admin_approval_status: string | null }>(
          `SELECT admin_approval_status FROM users WHERE user_id = $1`,
          [req.userId]
        )
        
        if (userRows.length > 0 && userRows[0].admin_approval_status !== 'approved' && userRows[0].admin_approval_status !== null) {
          return res.status(403).json({ 
            error: 'Admin access pending approval',
            details: 'Your admin account requires approval before accessing admin features.'
          })
        }
      }
      
      next()
    } catch (err) {
      return res.status(500).json({ error: 'Failed to verify admin status' })
    }
  })()
}

// Check admin permissions for specific actions
export function requireAdminPermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    try {
      // Check if admin_permissions column exists
      const { rows: colCheck } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_permissions'
      `)
      
      if (colCheck.length > 0 && req.userId) {
        // Check admin approval status
        const { rows: statusCheck } = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'admin_approval_status'
        `)
        
        if (statusCheck.length > 0) {
          const { rows: userRows } = await query<{ admin_approval_status: string | null; admin_permissions: Record<string, boolean> | null }>(
            `SELECT admin_approval_status, admin_permissions FROM users WHERE user_id = $1`,
            [req.userId]
          )
          
          if (userRows.length > 0) {
            // Require approval for admin access
            if (userRows[0].admin_approval_status !== 'approved') {
              return res.status(403).json({ 
                error: 'Admin access pending approval',
                details: 'Your admin account requires approval before accessing admin features.'
              })
            }
            
            // Check specific permission
            const permissions = userRows[0].admin_permissions || {}
            if (!permissions[permission]) {
              return res.status(403).json({ 
                error: 'Permission denied',
                details: `You do not have permission to ${permission.replace('_', ' ')}.`
              })
            }
          }
        }
      }
      
      next()
    } catch (err) {
      return res.status(500).json({ error: 'Failed to check permissions' })
    }
  }
}

