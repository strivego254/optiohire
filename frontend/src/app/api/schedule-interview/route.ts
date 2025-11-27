import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      )
    }

    // Get request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.applicantId || !body.interviewTime) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'applicantId and interviewTime are required' },
        { status: 400 }
      )
    }

    // Forward request to backend with original authorization header
    // Let the backend handle all authentication and validation
    console.log('Forwarding schedule interview request to backend:', {
      url: `${BACKEND_URL}/api/schedule-interview`,
      hasToken: !!authHeader,
      applicantId: body.applicantId,
      interviewTime: body.interviewTime
    })
    
    const response = await fetch(`${BACKEND_URL}/api/schedule-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward the original Authorization header
      },
      body: JSON.stringify(body),
    })
    
    console.log('Backend response status:', response.status, response.statusText)

    // Get response data
    let data
    try {
      data = await response.json()
    } catch (err) {
      // If response is not JSON, create error object
      data = {
        error: 'Server error',
        details: `Backend returned non-JSON response (${response.status})`
      }
    }
    
    // Forward the backend's response (including status code)
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error || 'Failed to schedule interview',
          details: data.details || data.message || `Server error (${response.status})`
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Schedule interview API error:', error)
    
    // Handle network errors
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Connection failed',
          details: 'Unable to connect to backend server. Please ensure the backend is running.'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
