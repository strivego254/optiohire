#!/bin/bash

# Diagnostic script to check email reader status on server

echo "=========================================="
echo "Email Reader Diagnostic Tool"
echo "=========================================="
echo ""

# 1. Check PM2 status
echo "1. Checking PM2 processes..."
pm2 list
echo ""

# 2. Check backend health
echo "2. Checking backend health endpoint..."
curl -s http://localhost:3001/health || echo "❌ Backend not responding"
echo ""

# 3. Check email reader status
echo "3. Checking email reader status..."
curl -s http://localhost:3001/health/email-reader | jq '.' || curl -s http://localhost:3001/health/email-reader
echo ""

# 4. Check environment variables
echo "4. Checking environment variables..."
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
    echo "ENABLE_EMAIL_READER=$(grep ENABLE_EMAIL_READER backend/.env | cut -d'=' -f2)"
    echo "IMAP_POLL_MS=$(grep IMAP_POLL_MS backend/.env | cut -d'=' -f2)"
    echo "IMAP_HOST=$(grep IMAP_HOST backend/.env | cut -d'=' -f2 | sed 's/.*/***hidden***/')"
    echo "IMAP_USER=$(grep IMAP_USER backend/.env | cut -d'=' -f2 | sed 's/.*/***hidden***/')"
    echo "IMAP_PASS=$(grep IMAP_PASS backend/.env | cut -d'=' -f2 | sed 's/.*/***hidden***/')"
else
    echo "❌ backend/.env not found"
fi
echo ""

# 5. Check recent logs
echo "5. Recent email reader logs (last 30 lines)..."
pm2 logs optiohire-backend --lines 30 --nostream | grep -i "email\|imap\|job\|match\|applicant" || echo "No relevant logs found"
echo ""

# 6. Check database for active jobs
echo "6. Checking active jobs in database..."
cd backend
if command -v node &> /dev/null; then
    node -e "
    require('dotenv').config();
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    pool.query('SELECT job_posting_id, job_title, status FROM job_postings ORDER BY created_at DESC LIMIT 5')
        .then(res => {
            console.log('Active jobs:');
            res.rows.forEach(job => {
                console.log(\`  - ID: \${job.job_posting_id}, Title: \"\${job.job_title}\", Status: \${job.status || 'NULL'}\`);
            });
            pool.end();
        })
        .catch(err => {
            console.error('Database error:', err.message);
            pool.end();
        });
    "
else
    echo "❌ Node.js not found"
fi
cd ..
echo ""

# 7. Check for recent applications
echo "7. Checking recent applications..."
cd backend
if command -v node &> /dev/null; then
    node -e "
    require('dotenv').config();
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    pool.query('SELECT application_id, job_posting_id, candidate_name, email, status, created_at FROM applications ORDER BY created_at DESC LIMIT 5')
        .then(res => {
            console.log('Recent applications:');
            if (res.rows.length === 0) {
                console.log('  No applications found');
            } else {
                res.rows.forEach(app => {
                    console.log(\`  - \${app.candidate_name} (\${app.email}) - Status: \${app.status || 'NULL'} - Created: \${app.created_at}\`);
                });
            }
            pool.end();
        })
        .catch(err => {
            console.error('Database error:', err.message);
            pool.end();
        });
    "
else
    echo "❌ Node.js not found"
fi
cd ..
echo ""

echo "=========================================="
echo "Diagnostic complete"
echo "=========================================="

