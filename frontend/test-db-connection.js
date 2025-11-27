#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests both pooler and direct connections to Supabase
 */

const pg = require('pg');
const { Pool } = pg;

const connections = [
  {
    name: 'Pooler Connection',
    connectionString: 'postgresql://postgres.qijibjotmwbikzwtkcut:HireBit%40254%23.%24@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  },
  {
    name: 'Direct Connection',
    connectionString: 'postgresql://postgres:HireBit%40254%23.%24@db.qijibjotmwbikzwtkcut.supabase.co:5432/postgres',
  },
  {
    name: 'Pooler with pgbouncer',
    connectionString: 'postgresql://postgres.qijibjotmwbikzwtkcut:HireBit%40254%23.%24@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  },
];

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
  console.log('🚀 Testing Supabase Database Connections...\n');
  
  let success = false;
  for (const conn of connections) {
    const result = await testConnection(conn.name, conn.connectionString);
    if (result) {
      success = true;
      console.log(`\n✅ Use this connection string in your .env.local:`);
      console.log(`DATABASE_URL=${conn.connectionString}\n`);
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

