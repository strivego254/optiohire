import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'

type CandidateRow = {
  id: string
  candidate_name: string | null
  email: string
  score: number | null
  status: string | null
  interview_time: string | null
  interview_link: string | null
  interview_status: string | null
  reasoning: string | null
}

// GET /api/hr/candidates?jobId=...
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'jobId query parameter is required' }, { status: 400 })
    }

    // Verify user has access to this job's company
    // For now, we'll check if the job exists and allow access
    // In production, you'd check user_companies or user_roles table
    const { rows: jobRows } = await query<{ company_id: string }>(
      `SELECT company_id FROM job_postings WHERE job_posting_id = $1`,
      [jobId]
    )

    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if we should filter by status (for shortlisted page)
    const statusFilter = searchParams.get('status')
    const statusCondition = statusFilter 
      ? `AND ai_status = $2`
      : ''
    const queryParams = statusFilter ? [jobId, statusFilter] : [jobId]

    // Fetch candidates ordered by score DESC
    const result = await query<CandidateRow>(
      `SELECT 
        application_id as id,
        candidate_name,
        email,
        ai_score as score,
        ai_status as status,
        interview_time,
        interview_link,
        interview_status,
        reasoning
      FROM applications 
      WHERE job_posting_id = $1 ${statusCondition}
      ORDER BY ai_score DESC NULLS LAST, created_at ASC`,
      queryParams
    )

    // Explicitly type the rows as CandidateRow[]
    const rows: CandidateRow[] = result.rows

    // Map to response format (normalize status from enum to text) with ranking
    const candidates = rows.map((row: CandidateRow, index: number) => {
      // Ensure score is a number or null
      let score: number | null = null
      if (row.score !== null && row.score !== undefined) {
        const numScore = typeof row.score === 'number' ? row.score : Number(row.score)
        score = isNaN(numScore) ? null : numScore
      }
      
      return {
      id: row.id,
        rank: index + 1,
      candidate_name: row.candidate_name || 'Unknown',
      email: row.email,
        score: score,
      status: row.status || 'PENDING',
      interview_time: row.interview_time,
      interview_link: row.interview_link,
      interview_status: row.interview_status || null,
        reasoning: row.reasoning || null,
      }
    })

    return NextResponse.json(candidates)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching candidates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

