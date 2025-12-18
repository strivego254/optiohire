#!/bin/bash

echo "=========================================="
echo "Fix Email Reader - Immediate Action"
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

echo "Step 1: Checking current email reader status..."
echo "-----------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>&1)
if [ $? -eq 0 ]; then
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Cannot connect to backend${NC}"
fi
echo ""

echo "Step 2: Checking backend .env file..."
echo "-----------------------------------"
cd backend || exit 1
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check if ENABLE_EMAIL_READER is set to false
if grep -q "^ENABLE_EMAIL_READER=false" .env; then
    echo -e "${RED}❌ ENABLE_EMAIL_READER is set to 'false' - FIXING...${NC}"
    sed -i 's/^ENABLE_EMAIL_READER=false/# ENABLE_EMAIL_READER=false/' .env
    echo -e "${GREEN}✅ Enabled email reader${NC}"
fi

# Ensure ENABLE_EMAIL_READER is not commented out or missing
if ! grep -q "^ENABLE_EMAIL_READER" .env; then
    echo -e "${YELLOW}⚠️  ENABLE_EMAIL_READER not found - adding it...${NC}"
    echo "" >> .env
    echo "# Email Reader Configuration" >> .env
    echo "ENABLE_EMAIL_READER=true" >> .env
    echo -e "${GREEN}✅ Added ENABLE_EMAIL_READER=true${NC}"
fi

# Ensure IMAP_POLL_MS is set to 1000 (1 second)
if ! grep -q "^IMAP_POLL_MS=" .env; then
    echo -e "${YELLOW}⚠️  IMAP_POLL_MS not found - adding it...${NC}"
    echo "IMAP_POLL_MS=1000" >> .env
    echo -e "${GREEN}✅ Added IMAP_POLL_MS=1000${NC}"
elif grep -q "^IMAP_POLL_MS=10000" .env; then
    echo -e "${YELLOW}⚠️  IMAP_POLL_MS is 10000 (10 seconds) - changing to 1000 (1 second)...${NC}"
    sed -i 's/^IMAP_POLL_MS=10000/IMAP_POLL_MS=1000/' .env
    echo -e "${GREEN}✅ Updated IMAP_POLL_MS to 1000${NC}"
fi

# Check IMAP credentials
MISSING_VARS=()
if ! grep -q "^IMAP_HOST=" .env || [ -z "$(grep "^IMAP_HOST=" .env | cut -d '=' -f2)" ]; then
    MISSING_VARS+=("IMAP_HOST")
fi
if ! grep -q "^IMAP_USER=" .env || [ -z "$(grep "^IMAP_USER=" .env | cut -d '=' -f2)" ]; then
    MISSING_VARS+=("IMAP_USER")
fi
if ! grep -q "^IMAP_PASS=" .env || [ -z "$(grep "^IMAP_PASS=" .env | cut -d '=' -f2)" ]; then
    MISSING_VARS+=("IMAP_PASS")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing IMAP variables: ${MISSING_VARS[*]}${NC}"
    echo "Please add these to backend/.env:"
    echo "  IMAP_HOST=imap.gmail.com"
    echo "  IMAP_USER=your-email@gmail.com"
    echo "  IMAP_PASS=your-app-password"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

echo "Step 3: Rebuilding backend..."
echo "-----------------------------------"
npm install --production=false
npm run build

if [ ! -f "dist/server.js" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend built successfully${NC}"
echo ""

echo "Step 4: Restarting backend with updated environment..."
echo "-----------------------------------"
pm2 restart optiohire-backend --update-env
sleep 3
pm2 save
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

echo "Step 5: Verifying email reader status..."
echo "-----------------------------------"
sleep 2
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>&1)
if [ $? -eq 0 ]; then
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
    
    # Check if enabled and running
    ENABLED=$(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.enabled' 2>/dev/null)
    RUNNING=$(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.running' 2>/dev/null)
    
    if [ "$ENABLED" = "true" ] && [ "$RUNNING" = "true" ]; then
        echo -e "${GREEN}✅ Email reader is enabled and running!${NC}"
    else
        echo -e "${YELLOW}⚠️  Email reader status: enabled=$ENABLED, running=$RUNNING${NC}"
        echo "Check backend logs: pm2 logs optiohire-backend --lines 50"
    fi
else
    echo -e "${RED}❌ Cannot connect to backend${NC}"
fi
echo ""

echo "Step 6: Checking recent backend logs for errors..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 30 --nostream 2>&1 | grep -i -E "(error|email|imap|reader)" | tail -20 || echo "No relevant log entries found"
echo ""

echo "Step 7: Checking recent job postings..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1
npx tsx -e "
import { query } from './src/db/index.js';
(async () => {
  try {
    const { rows } = await query(\`
      SELECT job_posting_id, job_title, status, created_at
      FROM job_postings
      ORDER BY created_at DESC
      LIMIT 3
    \`);
    if (rows.length > 0) {
      console.log(\`Found \${rows.length} recent job(s):\`);
      rows.forEach((job, i) => {
        console.log(\`  \${i+1}. \"\${job.job_title}\" (Status: \${job.status || 'NULL'})\`);
      });
    } else {
      console.log('⚠️  No jobs found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
" 2>&1
echo ""

echo "=========================================="
echo "Fix Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check email reader health: curl http://localhost:3001/health/email-reader"
echo "2. Monitor logs: pm2 logs optiohire-backend"
echo "3. Verify emails match job titles exactly"
echo "4. Check if applications are being created:"
echo "   cd backend && npx tsx -e \"import { query } from './src/db/index.js'; (async () => { const { rows } = await query('SELECT COUNT(*) as count FROM applications'); console.log('Total applications:', rows[0].count); process.exit(0); })();\""
echo ""

