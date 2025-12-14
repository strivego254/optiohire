import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'

// GET /api/job-postings/[jobId] - Fetch a single job posting by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> | { jobId: string } }
) {
  try {
    const user = requireAuth(request)
    const resolvedParams = await Promise.resolve(params)
    const jobId = resolvedParams.jobId

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Fetch single job posting with meeting link
    const result = await query<{
      job_posting_id: string
      interview_meeting_link: string | null
      meeting_link: string | null
    }>(
      `SELECT 
        job_posting_id,
        interview_meeting_link,
        meeting_link
      FROM job_postings 
      WHERE job_posting_id = $1
      LIMIT 1`,
      [jobId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const job = result.rows[0]
    
    return NextResponse.json({
      id: job.job_posting_id,
      meeting_link: job.meeting_link || job.interview_meeting_link || '',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching job posting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
