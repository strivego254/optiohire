import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export async function POST(request: NextRequest) {
  const { getPool } = await import('@/lib/db')
  let client: pg.PoolClient | null = null

  try {
    // Get database connection
    try {
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set in environment variables')
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: 'DATABASE_URL environment variable is not set. Please check your .env.local file and restart the server.',
          },
          { status: 500 }
        )
      }

      const pool = getPool()
      console.log('Attempting database connection for signin...')
      client = await pool.connect()
      console.log('Database connection successful for signin')
    } catch (dbErr: any) {
      console.error('Database connection error:', dbErr)
      let errorDetails = dbErr?.message || 'Could not connect to database.'
      if (dbErr?.code === 'ENOTFOUND' || dbErr?.code === 'ECONNREFUSED') {
        errorDetails = 'Cannot reach database server. Please check your network connection and DATABASE_URL.'
      } else if (dbErr?.message?.includes('password') || dbErr?.message?.includes('authentication')) {
        errorDetails = 'Database authentication failed. Please check your DATABASE_URL password.'
      } else if (dbErr?.message?.includes('timeout')) {
        errorDetails = 'Database connection timeout. The server may be unreachable.'
      }

      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: errorDetails,
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body || {}

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const { rows: userRows } = await client.query<{
      user_id: string
      password_hash: string
      role: string
      is_active: boolean
      created_at: string
      name?: string
      company_role?: string
    }>(
      `SELECT user_id, password_hash, role, is_active, created_at, name, company_role 
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const user = userRows[0]

    // Check if account is active
    if (user.is_active === false) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has a company (except admin)
    let hasCompany = false
    let companyId: string | null = null
    let companyName: string | null = null
    let companyEmail: string | null = null
    let hrEmail: string | null = null
    let hiringManagerEmail: string | null = null

    if (user.role !== 'admin') {
      // Check if user_id column exists in companies table
      const { rows: columnCheck } = await client.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'companies' AND column_name = 'user_id'`
      )
      const hasUserIdColumn = columnCheck.length > 0

      if (hasUserIdColumn) {
        const { rows: companyRows } = await client.query<{
          company_id: string
          company_name: string
          company_email: string
          hr_email: string
          hiring_manager_email: string | null
        }>(
          `SELECT company_id, company_name, company_email, hr_email, hiring_manager_email
           FROM companies
           WHERE user_id = $1
           LIMIT 1`,
          [user.user_id]
        )

        if (companyRows.length > 0) {
          hasCompany = true
          companyId = companyRows[0].company_id
          companyName = companyRows[0].company_name
          companyEmail = companyRows[0].company_email
          hrEmail = companyRows[0].hr_email
          hiringManagerEmail = companyRows[0].hiring_manager_email
        }
      } else {
        // Fallback: try to find company by email domain
        const emailDomain = email.split('@')[1]
        const { rows: companyRows } = await client.query<{
          company_id: string
          company_name: string
          company_email: string
          hr_email: string
          hiring_manager_email: string | null
        }>(
          `SELECT company_id, company_name, company_email, hr_email, hiring_manager_email
           FROM companies
           WHERE company_email = $1 OR hr_email = $1 OR company_domain = $2
           LIMIT 1`,
          [email.toLowerCase(), emailDomain]
        )

        if (companyRows.length > 0) {
          hasCompany = true
          companyId = companyRows[0].company_id
          companyName = companyRows[0].company_name
          companyEmail = companyRows[0].company_email
          hrEmail = companyRows[0].hr_email
          hiringManagerEmail = companyRows[0].hiring_manager_email
        }
      }
    } else {
      // Admin always has access
      hasCompany = true
    }

    // Generate JWT token
    const token = jwt.sign(
      { sub: user.user_id, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        user_id: user.user_id,
        id: user.user_id, // Also include as 'id' for frontend compatibility
        name: user.name || null,
        email: email.toLowerCase(),
        role: user.role,
        company_role: user.company_role || null,
        created_at: user.created_at,
        hasCompany,
        companyId,
        companyName,
        companyEmail,
        hrEmail,
        hiringManagerEmail
      }
    })
  } catch (err) {
    console.error('Signin error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Check if it's a database connection error
    if (
      errorMessage.includes('password') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('ENOTFOUND')
    ) {
      return NextResponse.json(
        {
          error: 'Database connection failed. Please check DATABASE_URL environment variable.',
          details: 'Make sure DATABASE_URL is properly configured in your environment variables',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to sign in', details: errorMessage },
      { status: 500 }
    )
  } finally {
    if (client) {
      client.release()
    }
  }
}

