#!/usr/bin/env node
/**
 * Database Connection Test Script (no secrets in repo)
 *
 * Provide one or more connection strings via env vars:
 *   - DATABASE_URL
 *   - DATABASE_URL_POOLER
 *   - DATABASE_URL_DIRECT
 *
 * Example:
 *   DATABASE_URL="postgresql://user:pass@host:5432/db" node test-db-connection.js
 */

const pg = require('pg');
const { Pool } = pg;

const connections = [
  { name: 'DATABASE_URL', connectionString: process.env.DATABASE_URL },
  { name: 'DATABASE_URL_POOLER', connectionString: process.env.DATABASE_URL_POOLER },
  { name: 'DATABASE_URL_DIRECT', connectionString: process.env.DATABASE_URL_DIRECT },
].filter((c) => typeof c.connectionString === 'string' && c.connectionString.trim().length > 0);

async function testConnection(name, connectionString) {
  console.log(`\n🔍 Testing ${name}...`);
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), version()');
    console.log(`✅ ${name} SUCCESS!`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log(`❌ ${name} FAILED: ${err.message}`);
    console.log(`   Error code: ${err.code}`);
    if (err.code === 'ENETUNREACH') {
      console.log(`   💡 Network unreachable - IPv6 connectivity issue`);
    }
    await pool.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Database Connections...\n');
  
  if (connections.length === 0) {
    console.log('❌ No connection strings provided.\n');
    console.log('Set one of: DATABASE_URL, DATABASE_URL_POOLER, DATABASE_URL_DIRECT\n');
    process.exit(1);
  }
  
  let success = false;
  for (const conn of connections) {
    const result = await testConnection(conn.name, conn.connectionString);
    if (result) {
      success = true;
      console.log(`\n✅ Connection works. Use this connection string in your environment (do NOT commit it):`);
      const masked = conn.connectionString.replace(/(postgresql:\/\/[^:]+:)[^@]+(@)/, '$1***$2');
      console.log(`DATABASE_URL=${masked}\n`);
      break;
    }
  }

  if (!success) {
    console.log('\n❌ All connection attempts failed.\n');
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Verify your Supabase project is active');
    console.log('   2. Get the connection string from:');
    console.log('      https://supabase.com/dashboard/project/qijibjotmwbikzwtkcut/settings/database');
    console.log('   3. Check your network/firewall settings');
    console.log('   4. Try using a VPN if IPv6 is blocked');
    console.log('   5. Verify the password is correct and URL-encoded\n');
  }
}

main().catch(console.error);

