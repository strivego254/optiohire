#!/usr/bin/env tsx
/**
 * Diagnostic script to check email matching and processing
 * This helps debug why applications aren't being analyzed
 */

import { query } from '../src/db/index.js'
import { logger } from '../src/utils/logger.js'

async function checkEmailMatching() {
  console.log('==========================================')
  console.log('Email Matching Diagnostic')
  console.log('==========================================')
  console.log('')

  try {
    // Step 1: Get all active job postings
    console.log('Step 1: Checking Active Job Postings...')
    console.log('-----------------------------------')
    const { rows: jobs } = await query(
      `SELECT 
        job_posting_id,
        job_title,
        status,
        created_at,
        company_id
       FROM job_postings 
       WHERE (status IS NULL OR UPPER(TRIM(status)) = 'ACTIVE' OR status = '')
       ORDER BY created_at DESC`
    )

    if (jobs.length === 0) {
      console.log('❌ No active job postings found!')
      console.log('   This is why emails are not being processed.')
      console.log('   Create a job posting first.')
      return
    }

    console.log(`✅ Found ${jobs.length} active job posting(s):`)
    jobs.forEach((job, index) => {
      console.log(`   ${index + 1}. "${job.job_title}" (ID: ${job.job_posting_id})`)
      console.log(`      Status: ${job.status || 'ACTIVE'}`)
      console.log(`      Created: ${job.created_at}`)
    })
    console.log('')

    // Step 2: Show what email subjects should look like
    console.log('Step 2: Expected Email Subject Format...')
    console.log('-----------------------------------')
    console.log('For emails to be processed, the SUBJECT must match the job title:')
    console.log('')
    jobs.forEach((job, index) => {
      const normalizedTitle = job.job_title.toLowerCase().trim().replace(/\s+/g, ' ')
      console.log(`   Job ${index + 1}: "${job.job_title}"`)
      console.log(`   ✅ Exact match: "${job.job_title}"`)
      console.log(`   ✅ Prefix match: "${job.job_title} - Application"`)
      console.log(`   ✅ Contains: "Application for ${job.job_title}"`)
      console.log(`   Normalized: "${normalizedTitle}"`)
      console.log('')
    })
    console.log('')

    // Step 3: Check recent applications
    console.log('Step 3: Checking Recent Applications...')
    console.log('-----------------------------------')
    const { rows: applications } = await query(
      `SELECT 
        application_id,
        job_posting_id,
        candidate_name,
        email,
        ai_status as status,
        score,
        created_at
       FROM applications
       ORDER BY created_at DESC
       LIMIT 10`
    )

    if (applications.length === 0) {
      console.log('⚠️  No applications found in database')
      console.log('   This means emails are not being processed.')
    } else {
      console.log(`✅ Found ${applications.length} recent application(s):`)
      applications.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.candidate_name || 'Unknown'} (${app.email})`)
        console.log(`      Job ID: ${app.job_posting_id}`)
        console.log(`      Status: ${app.status || 'PENDING'}`)
        console.log(`      Score: ${app.score || 'N/A'}`)
        console.log(`      Created: ${app.created_at}`)
        console.log('')
      })
    }
    console.log('')

    // Step 4: Check email reader status
    console.log('Step 4: Email Reader Configuration...')
    console.log('-----------------------------------')
    const enableEmailReader = process.env.ENABLE_EMAIL_READER
    const imapHost = process.env.IMAP_HOST
    const imapUser = process.env.IMAP_USER
    const imapPass = process.env.IMAP_PASS ? '***' : 'NOT SET'

    console.log(`ENABLE_EMAIL_READER: ${enableEmailReader || 'NOT SET (defaults to false)'}`)
    console.log(`IMAP_HOST: ${imapHost || 'NOT SET'}`)
    console.log(`IMAP_USER: ${imapUser || 'NOT SET'}`)
    console.log(`IMAP_PASS: ${imapPass}`)
    console.log('')

    if (enableEmailReader !== 'true') {
      console.log('❌ Email reader is DISABLED!')
      console.log('   Set ENABLE_EMAIL_READER=true in backend/.env')
    } else if (!imapHost || !imapUser || !imapPass) {
      console.log('❌ IMAP credentials are missing!')
      console.log('   Configure IMAP_HOST, IMAP_USER, IMAP_PASS in backend/.env')
    } else {
      console.log('✅ Email reader is configured')
    }
    console.log('')

    // Step 5: Recommendations
    console.log('==========================================')
    console.log('Recommendations')
    console.log('==========================================')
    console.log('')
    console.log('To fix email processing:')
    console.log('')
    console.log('1. ✅ Ensure email reader is enabled:')
    console.log('   ENABLE_EMAIL_READER=true in backend/.env')
    console.log('')
    console.log('2. ✅ Ensure IMAP credentials are correct:')
    console.log('   IMAP_HOST=imap.gmail.com')
    console.log('   IMAP_USER=your_email@gmail.com')
    console.log('   IMAP_PASS=your_app_password')
    console.log('')
    console.log('3. ✅ Email subject MUST match job title exactly:')
    jobs.forEach((job) => {
      console.log(`   For "${job.job_title}":`)
      console.log(`   - Subject: "${job.job_title}" ✅`)
      console.log(`   - Subject: "${job.job_title} - Application" ✅`)
      console.log(`   - Subject: "Application for ${job.job_title}" ✅`)
      console.log(`   - Subject: "Re: ${job.job_title}" ✅`)
      console.log('')
    })
    console.log('')
    console.log('4. ✅ Check backend logs for email processing:')
    console.log('   pm2 logs optiohire-backend | grep -i email')
    console.log('')
    console.log('5. ✅ Verify emails are unread in inbox')
    console.log('   (The email reader only processes UNREAD emails)')
    console.log('')

  } catch (error: any) {
    console.error('❌ Error running diagnostic:', error)
    logger.error('Email matching diagnostic error:', error)
  }

  process.exit(0)
}

checkEmailMatching()

