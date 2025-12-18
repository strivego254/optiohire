#!/usr/bin/env tsx
/**
 * Quick script to check if job_postings table has any records
 * Run: npx tsx scripts/check-jobs.ts
 */

import { query } from '../src/db/index.js'

async function checkJobs() {
  try {
    console.log('🔍 Checking job_postings table...\n')

    // Check total count
    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM job_postings`
    )
    const totalCount = parseInt(countRows[0]?.count || '0', 10)
    console.log(`📊 Total jobs in database: ${totalCount}\n`)

    if (totalCount === 0) {
      console.log('❌ No jobs found in database!')
      console.log('   This is why emails are not being processed.\n')
      console.log('   To fix: Create a job posting through the dashboard first.')
      return
    }

    // Get all jobs with their status
    const { rows: jobs } = await query<{
      job_posting_id: string
      job_title: string
      status: string | null
      company_id: string
      created_at: string
    }>(
      `SELECT job_posting_id, job_title, status, company_id, created_at
       FROM job_postings
       ORDER BY created_at DESC
       LIMIT 10`
    )

    console.log(`📋 Recent jobs (showing up to 10):\n`)
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. "${job.job_title}"`)
      console.log(`   Status: ${job.status || 'NULL'}`)
      console.log(`   ID: ${job.job_posting_id}`)
      console.log(`   Created: ${job.created_at}\n`)
    })

    // Check active jobs
    const { rows: activeJobs } = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM job_postings 
       WHERE (status IS NULL OR UPPER(TRIM(status)) = 'ACTIVE' OR status = '')`
    )
    const activeCount = parseInt(activeJobs[0]?.count || '0', 10)
    console.log(`✅ Active jobs: ${activeCount}`)

    if (activeCount === 0 && totalCount > 0) {
      console.log('\n⚠️  WARNING: Jobs exist but none are marked as ACTIVE!')
      console.log('   Status values found:', [...new Set(jobs.map(j => j.status || 'NULL'))].join(', '))
      console.log('   The email reader will not process emails until jobs are ACTIVE.')
    }

  } catch (error: any) {
    console.error('❌ Error checking jobs:', error.message)
    console.error('   This might indicate a database connection issue.')
  } finally {
    process.exit(0)
  }
}

checkJobs()

