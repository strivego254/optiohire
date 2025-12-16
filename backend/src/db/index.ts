import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

// Load .env file before reading DATABASE_URL
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env')
dotenv.config({ path: envPath })

const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// Debug: Log connection string (mask password)
const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':***@')
console.log('[DB] Connection string loaded:', maskedUrl)
console.log('[DB] DB_SSL:', process.env.DB_SSL)

// SSL configuration:
// - Local PostgreSQL: Set DB_SSL=false (no SSL needed)
// - Supabase/Remote: Set DB_SSL=true or omit (SSL required)
const useSSL = process.env.DB_SSL !== 'false'

export const pool = new Pool({
  connectionString,
  // SSL only for remote connections (Supabase), not local PostgreSQL
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}


