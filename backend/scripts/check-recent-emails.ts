#!/usr/bin/env tsx
/**
 * Check recent emails in inbox (including read ones)
 * Run: npx tsx scripts/check-recent-emails.ts
 */

import dotenv from 'dotenv'
import { ImapFlow } from 'imapflow'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function checkRecentEmails() {
  const imapHost = process.env.IMAP_HOST
  const imapPort = parseInt(process.env.IMAP_PORT || '993', 10)
  const imapUser = process.env.IMAP_USER
  const imapPass = process.env.IMAP_PASS
  const imapSecure = process.env.IMAP_SECURE !== 'false'

  if (!imapHost || !imapUser || !imapPass) {
    console.error('❌ IMAP credentials not configured')
    process.exit(1)
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapSecure,
    auth: {
      user: imapUser,
      pass: imapPass
    }
  })

  try {
    await client.connect()
    console.log('✅ Connected to IMAP server')

    const lock = await client.getMailboxLock('INBOX')
    try {
      // Check unread emails
      const unreadMessages = await client.search({ seen: false })
      console.log(`\n📧 Unread emails: ${unreadMessages.length}`)
      
      // Check recent emails (last 10, regardless of read status)
      const allMessages = await client.search({ all: true })
      const recentMessages = allMessages.slice(-10).reverse() // Get last 10, most recent first
      console.log(`\n📧 Recent emails (last 10, including read): ${recentMessages.length}`)

      if (recentMessages.length > 0) {
        console.log('\n📋 Recent email details:')
        for (const seq of recentMessages.slice(0, 5)) { // Show first 5
          try {
            const message = await client.fetchOne(seq, {
              envelope: true,
              flags: true
            })
            
            if (message && message.envelope) {
              const subject = message.envelope.subject || '(no subject)'
              const from = message.envelope.from?.[0]?.address || 'unknown'
              const date = message.envelope.date || new Date()
              const isRead = message.flags?.has('\\Seen') || false
              
              console.log(`\n  Email #${seq}:`)
              console.log(`    Subject: "${subject}"`)
              console.log(`    From: ${from}`)
              console.log(`    Date: ${date}`)
              console.log(`    Status: ${isRead ? 'READ' : 'UNREAD'}`)
            }
          } catch (err) {
            console.error(`  Error fetching email #${seq}:`, err)
          }
        }
      }

      // Check Processed folder
      try {
        await client.mailboxOpen('Processed')
        const processedMessages = await client.search({ all: true })
        console.log(`\n📁 Processed folder: ${processedMessages.length} emails`)
      } catch (err) {
        console.log(`\n📁 Processed folder: doesn't exist or error: ${err}`)
      }

      // Check Failed folder
      try {
        await client.mailboxOpen('Failed')
        const failedMessages = await client.search({ all: true })
        console.log(`\n📁 Failed folder: ${failedMessages.length} emails`)
      } catch (err) {
        console.log(`\n📁 Failed folder: doesn't exist or error: ${err}`)
      }

    } finally {
      lock.release()
    }

    await client.logout()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkRecentEmails()

