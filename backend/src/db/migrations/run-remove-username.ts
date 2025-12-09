// Load environment variables FIRST
import dotenv from 'dotenv'
import pg from 'pg'
const { Pool } = pg

// Load .env file from backend directory
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('✗ Error: DATABASE_URL is not set in your .env file')
  console.error('Please make sure you have a .env file in the backend directory with DATABASE_URL set')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
})

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('Starting migration: Remove username column...')
    
    // Execute the migration
    await client.query('BEGIN')
    try {
      // Drop the index on username if it exists
      await client.query('DROP INDEX IF EXISTS idx_users_username')
      console.log('✓ Dropped username index if it existed')
      
      // Drop the username column if it exists
      const columnCheck = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
      `)
      
      if (columnCheck.rows.length > 0) {
        await client.query('ALTER TABLE users DROP COLUMN username')
        console.log('✓ Dropped username column from users table')
      } else {
        console.log('ℹ Username column does not exist, skipping drop')
      }
      
      await client.query('COMMIT')
      console.log('✓ Migration completed successfully!')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.error('Please make sure DATABASE_URL is set in your .env file')
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
