#!/bin/bash

echo "=========================================="
echo "Email Processing Diagnostic Tool"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR" || exit 1

echo "Step 1: Checking PM2 processes..."
echo "-----------------------------------"
pm2 list
echo ""

echo "Step 2: Checking email reader health endpoint..."
echo "-----------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>&1)
if [ $? -eq 0 ]; then
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Cannot connect to backend${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

echo "Step 3: Checking backend logs (last 50 lines)..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 50 --nostream 2>&1 | tail -50
echo ""

echo "Step 4: Checking environment variables..."
echo "-----------------------------------"
cd backend || exit 1
if [ -f .env ]; then
    echo "ENABLE_EMAIL_READER=$(grep ENABLE_EMAIL_READER .env | cut -d '=' -f2)"
    echo "IMAP_POLL_MS=$(grep IMAP_POLL_MS .env | cut -d '=' -f2)"
    echo "IMAP_HOST=$(grep IMAP_HOST .env | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
    echo "IMAP_USER=$(grep IMAP_USER .env | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
else
    echo -e "${RED}❌ .env file not found${NC}"
fi
echo ""

echo "Step 5: Checking recent job postings in database..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
npx tsx -e "
import { query } from './src/db/index.js';
(async () => {
  try {
    const { rows } = await query(\`
      SELECT job_posting_id, job_title, status, created_at, company_id
      FROM job_postings
      ORDER BY created_at DESC
      LIMIT 5
    \`);
    console.log(\`Found \${rows.length} recent job(s):\`);
    rows.forEach((job, i) => {
      console.log(\`  \${i+1}. \"\${job.job_title}\" (ID: \${job.job_posting_id}, Status: \${job.status || 'NULL'}, Created: \${job.created_at})\`);
    });
    if (rows.length === 0) {
      console.log('  ⚠️  No jobs found in database!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "Step 6: Checking recent applications in database..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
npx tsx -e "
import { query } from './src/db/index.js';
(async () => {
  try {
    const { rows } = await query(\`
      SELECT application_id, job_posting_id, candidate_name, email, ai_status, created_at
      FROM applications
      ORDER BY created_at DESC
      LIMIT 10
    \`);
    console.log(\`Found \${rows.length} recent application(s):\`);
    rows.forEach((app, i) => {
      console.log(\`  \${i+1}. \${app.candidate_name} (\${app.email}) - Status: \${app.ai_status || 'NULL'} - Created: \${app.created_at}\`);
    });
    if (rows.length === 0) {
      console.log('  ⚠️  No applications found in database!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "Step 7: Testing email matching logic..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
echo "This will test if email subjects match job titles..."
npx tsx -e "
import { query } from './src/db/index.js';
(async () => {
  try {
    // Get recent jobs
    const { rows: jobs } = await query(\`
      SELECT job_title, job_posting_id
      FROM job_postings
      ORDER BY created_at DESC
      LIMIT 3
    \`);
    
    if (jobs.length === 0) {
      console.log('  ⚠️  No jobs to test matching against');
      process.exit(0);
    }
    
    console.log('Recent job titles:');
    jobs.forEach((job, i) => {
      console.log(\`  \${i+1}. \"\${job.job_title}\"\`);
    });
    console.log('');
    console.log('Example email subjects that should match:');
    jobs.forEach((job) => {
      const normalized = job.job_title.toLowerCase().trim().replace(/\s+/g, ' ');
      console.log(\`  - \"\${job.job_title}\"\`);
      console.log(\`  - \"\${job.job_title} - Application\"\`);
      console.log(\`  - \"Application for \${job.job_title}\"\`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check if ENABLE_EMAIL_READER is not 'false'"
echo "2. Verify job titles match email subjects exactly"
echo "3. Check backend logs for errors"
echo "4. Ensure PM2 processes are running"
echo ""

