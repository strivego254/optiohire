#!/bin/bash
# Check email notifications status

echo "=========================================="
echo "Email Notifications Diagnostic"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR/backend" || exit 1

echo "Step 1: Checking recent shortlisted/rejected applications..."
echo "-----------------------------------"
npx tsx -e "
import { query } from './dist/db/index.js';
(async () => {
  try {
    const { rows } = await query(\`
      SELECT 
        application_id,
        candidate_name,
        email,
        ai_status,
        ai_score,
        created_at,
        updated_at
      FROM applications
      WHERE ai_status IN ('SHORTLIST', 'REJECT')
      ORDER BY updated_at DESC
      LIMIT 10
    \`);
    
    if (rows.length === 0) {
      console.log('No shortlisted or rejected applications found');
    } else {
      console.log(\`Found \${rows.length} shortlisted/rejected application(s):\`);
      rows.forEach((app, i) => {
        console.log(\`  \${i+1}. \${app.candidate_name} (\${app.email})\`);
        console.log(\`     Status: \${app.ai_status}, Score: \${app.ai_score || 'N/A'}\`);
        console.log(\`     Created: \${app.created_at}, Updated: \${app.updated_at}\`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "Step 2: Checking backend logs for email sending attempts..."
echo "-----------------------------------"
echo "Looking for email sending logs (shortlist/reject)..."
pm2 logs optiohire-backend --lines 500 --nostream 2>&1 | grep -i -E "(shortlist|reject|email.*sent|email.*fail|📧|✅.*email)" | tail -30 || echo "No email sending logs found"
echo ""

echo "Step 3: Checking for email errors..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 500 --nostream 2>&1 | grep -i -E "(email.*error|mail.*error|smtp.*error|failed.*send.*email)" | tail -20 || echo "No email errors found"
echo ""

echo "Step 4: Checking email service configuration..."
echo "-----------------------------------"
if [ -f .env ]; then
    echo "Email configuration in .env:"
    grep -E "MAIL_|SMTP_" .env | sed 's/=.*/=***hidden***/' || echo "  (no email variables found)"
else
    echo "❌ .env file not found"
fi
echo ""

echo "Step 5: Testing email service (if backend is running)..."
echo "-----------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>&1)
if [ $? -eq 0 ]; then
    echo "Backend is running"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "⚠️  Cannot connect to backend"
fi
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "If emails are not being sent, check:"
echo "  1. Backend logs: pm2 logs optiohire-backend | grep -i email"
echo "  2. Email credentials are correct (App Password for Gmail)"
echo "  3. Applications have been analyzed (ai_status is SHORTLIST or REJECT)"
echo ""

