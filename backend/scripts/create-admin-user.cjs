#!/usr/bin/env node
/**
 * Create or update an admin user (no secrets in repo)
 *
 * Usage:
 *   ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="StrongPassword!" node ./scripts/create-admin-user.cjs
 *
 * Reads DATABASE_URL (and other env vars) from backend/.env if present.
 */

/* eslint-disable no-console */

const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const { Pool } = require('pg')

const backendDir = path.resolve(__dirname, '..')
const envFile = process.env.ENV_FILE || path.join(backendDir, '.env')
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile })
}

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const databaseUrl = process.env.DATABASE_URL

if (!email || !password) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD are required.')
  console.error('Example:')
  console.error('  ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="StrongPassword!" node ./scripts/create-admin-user.cjs')
  process.exit(1)
}

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set (expected in backend/.env).')
  process.exit(1)
}

const maskUrl = (url) => url.replace(/(postgresql:\/\/[^:]+:)[^@]+(@)/, '$1***$2')

async function main() {
  console.log('Connecting to DB:', maskUrl(databaseUrl))

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  })

  const client = await pool.connect()
  try {
    const hash = await bcrypt.hash(password, 10)

    // Detect optional columns
    const { rows: colRows } = await client.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('username', 'name', 'company_role', 'role', 'is_active')
      `
    )
    const cols = new Set(colRows.map((r) => r.column_name))

    const insertCols = ['email', 'password_hash']
    const insertVals = ['$1', '$2']
    const params = [email.toLowerCase(), hash]

    if (cols.has('role')) {
      insertCols.push('role')
      insertVals.push(`'admin'`)
    }
    if (cols.has('is_active')) {
      insertCols.push('is_active')
      insertVals.push('true')
    }
    if (cols.has('username')) {
      insertCols.push('username')
      insertVals.push('$3')
      params.push('admin')
    }

    const upsert = `
      INSERT INTO users (${insertCols.join(', ')})
      VALUES (${insertVals.join(', ')})
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash
        ${cols.has('role') ? ", role = 'admin'" : ''}
        ${cols.has('is_active') ? ', is_active = true' : ''}
      RETURNING user_id, email
    `

    const { rows } = await client.query(upsert, params)
    console.log('✅ Admin user created/updated:', rows[0])
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('FAILED:', err?.message || err)
  process.exit(1)
})


