import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query, pool } from '../db/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const SALT_ROUNDS = 10

export async function signup(req: Request, res: Response) {
  const client = await pool.connect()
  try {
    const { name, email, password, company_role, company_name, company_email, hr_email, hiring_manager_email } = req.body || {}
    
    // STRICT: Validate all required fields - ALL MANDATORY
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }
    if (!company_role || !company_name || !company_email || !hr_email || !hiring_manager_email) {
      return res.status(400).json({ error: 'Company role, organization name, company email, HR email, and hiring manager email are all required' })
    }
    
    // Validate company_role
    if (company_role !== 'hr' && company_role !== 'hiring_manager') {
      return res.status(400).json({ error: 'Company role must be either "hr" or "hiring_manager"' })
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || !emailRegex.test(company_email) || !emailRegex.test(hr_email) || !emailRegex.test(hiring_manager_email)) {
      return res.status(400).json({ error: 'All email addresses must be valid' })
    }

    // Check if email already exists
    const { rows: existing } = await query<{ user_id: string }>(
      `select user_id from users where email = $1`,
      [email.toLowerCase()]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Account with this email already exists' })
    }

    // Start transaction
    await client.query('BEGIN')

    try {
      // Create user with name and company_role
      const hash = await bcrypt.hash(password, SALT_ROUNDS)
      
      // Check which columns exist
      const { rows: colCheck } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('name', 'company_role')
      `)
      
      const hasNameColumn = colCheck.some((r: any) => r.column_name === 'name')
      const hasCompanyRoleColumn = colCheck.some((r: any) => r.column_name === 'company_role')
      
      // Build dynamic insert query based on available columns
      const columns: string[] = []
      const values: string[] = []
      const params: any[] = []
      let paramIndex = 1
      
      if (hasNameColumn) {
        columns.push('name')
        values.push(`$${paramIndex++}`)
        params.push(name.trim())
      }
      columns.push('email')
      values.push(`$${paramIndex++}`)
      params.push(email.toLowerCase())
      columns.push('password_hash')
      values.push(`$${paramIndex++}`)
      params.push(hash)
      columns.push('role')
      values.push(`'user'`)
      if (hasCompanyRoleColumn) {
        columns.push('company_role')
        values.push(`$${paramIndex++}`)
        params.push(company_role)
      }
      columns.push('is_active')
      values.push('true')
      
      const insertQuery = `INSERT INTO users (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING user_id, created_at`
      
      const { rows } = await client.query<{ user_id: string; created_at: string }>(
        insertQuery,
        params
      )
      const userId = rows[0].user_id

      // Extract domain from company_email or hr_email
      const companyDomain = company_email.split('@')[1] || hr_email.split('@')[1] || null

      // Check if user_id column exists
      let hasUserIdColumn = false
      try {
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'companies' AND column_name = 'user_id'
        `)
        hasUserIdColumn = checkResult.rows.length > 0
      } catch (err) {
        console.log('⚠️ Could not check for user_id column, assuming it does not exist')
        hasUserIdColumn = false
      }

      // Create company with user_id if column exists - STRICT: hiring_manager_email is required
      let companyResult
      if (hasUserIdColumn) {
        companyResult = await client.query<{ company_id: string }>(
          `insert into companies (user_id, company_name, hr_email, hiring_manager_email, company_domain, company_email)
           values ($1, $2, $3, $4, $5, $6)
           returning company_id`,
          [
            userId,
            company_name,
            hr_email,
            hiring_manager_email, // Use provided hiring_manager_email
            companyDomain,
            company_email
          ]
        )
      } else {
        companyResult = await client.query<{ company_id: string }>(
          `insert into companies (company_name, hr_email, hiring_manager_email, company_domain, company_email)
           values ($1, $2, $3, $4, $5)
           returning company_id`,
          [
            company_name,
            hr_email,
            hiring_manager_email, // Use provided hiring_manager_email
            companyDomain,
            company_email
          ]
        )
      }

      // Commit transaction
      await client.query('COMMIT')

      const token = jwt.sign({ sub: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
      return res.status(201).json({ 
        token, 
        user: { 
          user_id: userId, 
          id: userId, // Also include as 'id' for frontend compatibility
          name: name.trim(),
          email: email.toLowerCase(),
          role: 'user',
          company_role: company_role,
          created_at: rows[0].created_at,
          hasCompany: true, // Always true on signup as company is created
          companyId: companyResult.rows[0].company_id,
          companyName: company_name,
          companyEmail: company_email,
          hrEmail: hr_email,
          hiringManagerEmail: hiring_manager_email
        },
        company: {
          company_id: companyResult.rows[0].company_id,
          company_name,
          company_email,
          hr_email,
          hiring_manager_email
        }
      })
    } catch (err) {
      // Rollback transaction on error
      await client.query('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('Signup error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // Check if it's a database connection error
    if (errorMessage.includes('password') || errorMessage.includes('authentication') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please check DATABASE_URL in backend/.env',
        details: 'Make sure you replaced [YOUR_PASSWORD] with your actual Supabase database password'
      })
    }
    return res.status(500).json({ error: 'Failed to create account', details: errorMessage })
  } finally {
    client.release()
  }
}

export async function signin(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const { rows } = await query<{ user_id: string; password_hash: string; role: string; is_active: boolean; created_at: string }>(
      `select user_id, password_hash, role, is_active, created_at from users where email = $1`,
      [email.toLowerCase()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!rows[0].is_active) {
      return res.status(401).json({ error: 'Account is inactive' })
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // STRICT: Check if user has a company (except admin)
    let hasCompany = false
    let companyId = null
    let companyName = null
    let companyEmail = null
    let hrEmail = null
    
    if (rows[0].role !== 'admin') {
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
            [rows[0].user_id]
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
            [email.toLowerCase()]
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

    const token = jwt.sign({ sub: rows[0].user_id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(200).json({ 
      token, 
      user: { 
        user_id: rows[0].user_id,
        id: rows[0].user_id, // Also include as 'id' for frontend compatibility
        email: email.toLowerCase(),
        role: rows[0].role,
        created_at: rows[0].created_at,
        hasCompany,
        companyId,
        companyName,
        companyEmail,
        hrEmail
      } 
    })
  } catch (err) {
    console.error('Signin error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // Check if it's a database connection error
    if (errorMessage.includes('password') || errorMessage.includes('authentication') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please check DATABASE_URL in backend/.env',
        details: 'Make sure you replaced [YOUR_PASSWORD] with your actual Supabase database password'
      })
    }
    return res.status(500).json({ error: 'Failed to sign in', details: errorMessage })
  }
}


