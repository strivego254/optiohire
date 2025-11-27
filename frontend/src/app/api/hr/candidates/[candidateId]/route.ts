import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'

type CandidateDetailRow = {
  application_id: string
  candidate_name: string | null
  email: string
  ai_score: number | null
  ai_status: string | null
  interview_time: string | null
  interview_link: string | null
  interview_status: string | null
  parsed_resume_json: any
  reasoning: string | null
  resume_url: string | null
  job_posting_id: string
}

// GET /api/hr/candidates/[candidateId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> | { candidateId: string } }
) {
  try {
    const user = requireAuth(request)
    // Handle both Promise and direct params (for Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params)
    const candidateId = resolvedParams.candidateId

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    // Fetch candidate detail
    const result = await query<CandidateDetailRow>(
      `SELECT 
        application_id,
        candidate_name,
        email,
        ai_score,
        ai_status,
        interview_time,
        interview_link,
        interview_status,
        parsed_resume_json,
        reasoning,
        resume_url,
        job_posting_id
      FROM applications 
      WHERE application_id = $1`,
      [candidateId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const app = result.rows[0]

    // Ensure score is a number or null
    let score: number | null = null
    if (app.ai_score !== null && app.ai_score !== undefined) {
      const numScore = typeof app.ai_score === 'number' ? app.ai_score : Number(app.ai_score)
      score = isNaN(numScore) ? null : numScore
    }

    return NextResponse.json({
      id: app.application_id,
      candidate_name: app.candidate_name || 'Unknown',
      email: app.email,
      score: score,
      status: app.ai_status || 'PENDING',
      interview_time: app.interview_time,
      interview_link: app.interview_link,
      interview_status: app.interview_status || null,
      parsed_resume: app.parsed_resume_json || {},
      reasoning: app.reasoning || '',
      resume_url: app.resume_url || '',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching candidate detail:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
