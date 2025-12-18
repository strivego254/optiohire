#!/usr/bin/env tsx
/**
 * Migrate users from Supabase to local PostgreSQL
 * OR create a new user in local database
 * 
 * Usage:
 *   npx tsx scripts/migrate-users.ts --email user@example.com --password newpassword
 *   OR
 *   npx tsx scripts/migrate-users.ts --create-admin
 */

import { query } from '../src/db/index.js'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function checkUserExists(email: string): Promise<boolean> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE email = $1`,
    [email.toLowerCase()]
  )
  return parseInt(rows[0]?.count || '0', 10) > 0
}

async function createUser(email: string, password: string, role: string = 'user') {
  const passwordHash = await bcrypt.hash(password, 10)
  
  const { rows } = await query<{ user_id: string }>(
    `INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, true, NOW(), NOW())
     RETURNING user_id`,
    [email.toLowerCase(), passwordHash, role]
  )
  
  return rows[0]?.user_id
}

async function main() {
  const args = process.argv.slice(2)
  
  console.log('🔍 Checking users in local database...\n')
  
  // Check if users table exists and has any users
  try {
    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users`
    )
    const totalUsers = parseInt(countRows[0]?.count || '0', 10)
    console.log(`📊 Total users in local database: ${totalUsers}\n`)
    
    if (totalUsers > 0) {
      const { rows: users } = await query<{ email: string; role: string }>(
        `SELECT email, role FROM users ORDER BY created_at DESC LIMIT 10`
      )
      console.log('Existing users:')
      users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (${u.role})`)
      })
      console.log('')
    }
  } catch (error: any) {
    console.error('❌ Error checking users:', error.message)
    console.error('   Make sure the users table exists in your database.')
    process.exit(1)
  }
  
  // Create admin user
  if (args.includes('--create-admin')) {
    const email = await question('Enter admin email: ')
    const password = await question('Enter admin password: ')
    
    if (await checkUserExists(email)) {
      console.log(`❌ User ${email} already exists!`)
      rl.close()
      process.exit(1)
    }
    
    const userId = await createUser(email, password, 'admin')
    console.log(`✅ Admin user created successfully!`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Email: ${email}`)
    rl.close()
    return
  }
  
  // Create regular user
  if (args.includes('--email') && args.includes('--password')) {
    const emailIndex = args.indexOf('--email')
    const passwordIndex = args.indexOf('--password')
    const email = args[emailIndex + 1]
    const password = args[passwordIndex + 1]
    const role = args.includes('--admin') ? 'admin' : 'user'
    
    if (await checkUserExists(email)) {
      console.log(`❌ User ${email} already exists!`)
      console.log(`   If you want to reset the password, you'll need to update it manually in the database.`)
      rl.close()
      process.exit(1)
    }
    
    const userId = await createUser(email, password, role)
    console.log(`✅ User created successfully!`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: ${role}`)
    rl.close()
    return
  }
  
  // Interactive mode
  console.log('Create a new user account:\n')
  const email = await question('Email: ')
  const password = await question('Password: ')
  const isAdmin = await question('Create as admin? (y/n): ')
  
  if (await checkUserExists(email)) {
    console.log(`\n❌ User ${email} already exists!`)
    rl.close()
    process.exit(1)
  }
  
  const role = isAdmin.toLowerCase() === 'y' ? 'admin' : 'user'
  const userId = await createUser(email, password, role)
  
  console.log(`\n✅ User created successfully!`)
  console.log(`   User ID: ${userId}`)
  console.log(`   Email: ${email}`)
  console.log(`   Role: ${role}`)
  console.log(`\nYou can now sign in with this account.`)
  
  rl.close()
}

main().catch((error) => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})

