#!/bin/bash
# Fix email notifications for shortlisted and rejected applicants

set -e

echo "=========================================="
echo "Fix Email Notifications"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR/backend" || exit 1

echo "Step 1: Checking email configuration in .env..."
echo "-----------------------------------"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check for email sending credentials
HAS_MAIL_USER=$(grep -E "^MAIL_USER=|^SMTP_USER=" .env | wc -l)
HAS_MAIL_PASS=$(grep -E "^MAIL_PASS=|^SMTP_PASS=" .env | wc -l)

if [ "$HAS_MAIL_USER" -eq 0 ] || [ "$HAS_MAIL_PASS" -eq 0 ]; then
    echo -e "${RED}❌ Email sending credentials not configured!${NC}"
    echo ""
    echo "Email notifications require:"
    echo "  - MAIL_USER or SMTP_USER (Gmail address)"
    echo "  - MAIL_PASS or SMTP_PASS (Gmail App Password)"
    echo ""
    echo "Current .env file:"
    grep -E "MAIL_|SMTP_" .env || echo "  (no email variables found)"
    echo ""
    echo -e "${YELLOW}⚠️  You need to add these to backend/.env:${NC}"
    echo "  MAIL_USER=your-email@gmail.com"
    echo "  MAIL_PASS=your-app-password"
    echo ""
    echo "To get a Gmail App Password:"
    echo "  1. Go to https://myaccount.google.com/apppasswords"
    echo "  2. Generate an App Password for 'Mail'"
    echo "  3. Copy the 16-character password"
    echo "  4. Add it to backend/.env as MAIL_PASS"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Email credentials found${NC}"
echo "  MAIL_USER/SMTP_USER: $(grep -E "^MAIL_USER=|^SMTP_USER=" .env | head -1 | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
echo "  MAIL_PASS/SMTP_PASS: $(grep -E "^MAIL_PASS=|^SMTP_PASS=" .env | head -1 | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
echo ""

echo "Step 2: Checking backend logs for email errors..."
echo "-----------------------------------"
echo "Recent email-related log entries:"
pm2 logs optiohire-backend --lines 100 --nostream 2>&1 | grep -i -E "(email|mail|smtp|shortlist|reject|notification)" | tail -20 || echo "No email-related log entries found"
echo ""

echo "Step 3: Checking if email service is working..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
npx tsx -e "
import { EmailService } from './src/services/emailService.js';
(async () => {
  try {
    const emailService = new EmailService();
    const verified = await emailService.verifyConnection();
    if (verified) {
      console.log('✅ Email service connection verified');
    } else {
      console.log('❌ Email service connection failed');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "Step 4: Checking recent applications and their email status..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
npx tsx -e "
import { query } from './src/db/index.js';
(async () => {
  try {
    const { rows } = await query(\`
      SELECT 
        application_id,
        candidate_name,
        email,
        ai_status,
        ai_score,
        created_at
      FROM applications
      WHERE ai_status IN ('SHORTLIST', 'REJECT')
      ORDER BY created_at DESC
      LIMIT 10
    \`);
    
    if (rows.length === 0) {
      console.log('No shortlisted or rejected applications found');
    } else {
      console.log(\`Found \${rows.length} shortlisted/rejected application(s):\`);
      rows.forEach((app, i) => {
        console.log(\`  \${i+1}. \${app.candidate_name} (\${app.email}) - Status: \${app.ai_status} - Score: \${app.ai_score || 'N/A'}\`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "Step 5: Restarting backend to apply any changes..."
echo "-----------------------------------"
pm2 restart optiohire-backend --update-env
sleep 3
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

echo "=========================================="
echo "Email Notification Fix Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Check backend logs: pm2 logs optiohire-backend | grep -i email"
echo "  2. Verify email credentials are correct in backend/.env"
echo "  3. Test by creating a new job posting and application"
echo "  4. Check email logs: cat backend/logs/email.log (if it exists)"
echo ""

