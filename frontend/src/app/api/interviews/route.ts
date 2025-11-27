import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token
    try {
      jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token', details: 'Token verification failed' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/interviews`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error || 'Failed to fetch interviews',
          details: data.details || data.message || `Server error (${response.status})`
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Interviews API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
