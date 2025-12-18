#!/bin/bash
# Verify that production setup is working correctly

echo "=========================================="
echo "Production Setup Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Step 1: Checking PM2 processes..."
echo "-----------------------------------"
pm2 list
echo ""

echo "Step 2: Checking email reader health..."
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
        if [ -n "$(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.disabledReason' 2>/dev/null)" ]; then
            echo "   Reason: $(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.disabledReason' 2>/dev/null)"
        fi
        if [ -n "$(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.lastError' 2>/dev/null)" ]; then
            echo "   Error: $(echo "$HEALTH_RESPONSE" | jq -r '.emailReader.lastError' 2>/dev/null)"
        fi
    fi
else
    echo -e "${RED}❌ Cannot connect to backend${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

echo "Step 3: Checking backend logs (last 20 lines)..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 20 --nostream 2>&1 | tail -20
echo ""

echo "Step 4: Checking cron jobs..."
echo "-----------------------------------"
crontab -l | grep -E "optiohire|start-all|pm2-monitor" || echo "No cron jobs found"
echo ""

echo "Step 5: Checking environment configuration..."
echo "-----------------------------------"
cd backend || exit 1
if [ -f .env ]; then
    echo "ENABLE_EMAIL_READER=$(grep ENABLE_EMAIL_READER .env | cut -d '=' -f2)"
    echo "IMAP_POLL_MS=$(grep IMAP_POLL_MS .env | cut -d '=' -f2)"
    echo "IMAP_HOST=$(grep IMAP_HOST .env | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
    echo "IMAP_USER=$(grep IMAP_USER .env | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
    echo "MAIL_USER=$(grep -E '^MAIL_USER=' .env | cut -d '=' -f2 | sed 's/.*/***hidden***/')"
    if grep -q "^ENABLE_EMAIL_READER=false" .env; then
        echo -e "${RED}❌ WARNING: ENABLE_EMAIL_READER is set to false!${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
fi
cd ..
echo ""

echo "Step 6: Checking recent backend activity..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 5 --nostream 2>&1 | grep -i -E "(email|imap|reader|connected|error)" | tail -10 || echo "No relevant log entries"
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "If email reader is not running, check:"
echo "  1. Backend logs: pm2 logs optiohire-backend"
echo "  2. Environment: grep ENABLE_EMAIL_READER backend/.env"
echo "  3. IMAP credentials: Check IMAP_HOST, IMAP_USER, IMAP_PASS in backend/.env"
echo ""

