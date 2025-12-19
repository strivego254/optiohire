#!/bin/bash
# Quick verification script for production setup

echo "=========================================="
echo "Production Status Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check PM2 Status
echo "1. PM2 Process Status:"
echo "----------------------"
pm2 list
echo ""

# 2. Check Backend Health
echo "2. Backend Health Check:"
echo "----------------------"
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
    curl -s http://localhost:3001/health | head -5
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi
echo ""

# 3. Check Frontend Health
echo "3. Frontend Health Check:"
echo "----------------------"
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi
echo ""

# 4. Check Email Reader Status
echo "4. Email Reader Status:"
echo "----------------------"
if curl -f -s http://localhost:3001/health/email-reader > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Email reader endpoint responding${NC}"
    curl -s http://localhost:3001/health/email-reader | head -10
else
    echo -e "${YELLOW}⚠️  Email reader endpoint not available${NC}"
fi
echo ""

# 5. Check Recent Logs
echo "5. Recent Backend Logs (last 10 lines):"
echo "----------------------"
pm2 logs optiohire-backend --lines 10 --nostream 2>/dev/null | tail -10
echo ""

# 6. Check Systemd Service
echo "6. Systemd Service Status:"
echo "----------------------"
if systemctl list-units --type=service 2>/dev/null | grep -q "pm2-optiohire"; then
    echo -e "${GREEN}✅ Systemd service found${NC}"
    systemctl status pm2-optiohire --no-pager -l 2>/dev/null | head -10
else
    echo -e "${YELLOW}⚠️  Systemd service not found (may be using cron instead)${NC}"
fi
echo ""

# 7. Check Cron Jobs
echo "7. Cron Monitoring Jobs:"
echo "----------------------"
crontab -l 2>/dev/null | grep -E "pm2|optiohire" || echo "No cron jobs found"
echo ""

# 8. Check Environment
echo "8. Email Reader Configuration:"
echo "----------------------"
if [ -f ~/optiohire/backend/.env ]; then
    if grep -q "^ENABLE_EMAIL_READER=true" ~/optiohire/backend/.env; then
        echo -e "${GREEN}✅ Email reader is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Email reader may not be enabled${NC}"
    fi
    
    if grep -q "^IMAP_POLL_MS=1000" ~/optiohire/backend/.env; then
        echo -e "${GREEN}✅ Polling interval set to 1 second${NC}"
    else
        echo -e "${YELLOW}⚠️  Polling interval may not be optimal${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}Verification Complete!${NC}"
echo "=========================================="
echo ""
echo "To monitor email processing in real-time:"
echo "  pm2 logs optiohire-backend | grep -i email"
echo ""
echo "To check for new applications:"
echo "  cd ~/optiohire/backend && npx tsx scripts/check-recent-applications.ts"
echo ""
