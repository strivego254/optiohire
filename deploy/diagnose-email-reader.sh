#!/bin/bash
# Comprehensive Email Reader Diagnostic Script

echo "=========================================="
echo "Email Reader Diagnostic Report"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

# 1. Check PM2 Status
echo "1. PM2 Backend Status:"
echo "----------------------"
pm2 list | grep optiohire-backend || echo "❌ Backend not running in PM2"
echo ""

# 2. Check .env Configuration
echo "2. Email Reader Configuration in .env:"
echo "----------------------"
if [ -f "$APP_DIR/backend/.env" ]; then
    echo "ENABLE_EMAIL_READER:"
    grep "^ENABLE_EMAIL_READER" "$APP_DIR/backend/.env" || echo "  ❌ NOT SET"
    
    echo ""
    echo "IMAP Configuration:"
    grep "^IMAP_" "$APP_DIR/backend/.env" | sed 's/=.*/=***/' || echo "  ❌ IMAP credentials not found"
    
    echo ""
    echo "IMAP_POLL_MS:"
    grep "^IMAP_POLL_MS" "$APP_DIR/backend/.env" || echo "  ⚠️  Not set (defaults to 1000ms)"
else
    echo "❌ ERROR: backend/.env file not found!"
fi
echo ""

# 3. Check Backend Health
echo "3. Backend Health Check:"
echo "----------------------"
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is NOT responding"
fi
echo ""

# 4. Check Email Reader Status via API
echo "4. Email Reader Status (from API):"
echo "----------------------"
EMAIL_STATUS=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$EMAIL_STATUS" | python3 -m json.tool 2>/dev/null || echo "$EMAIL_STATUS"
else
    echo "❌ Could not fetch email reader status"
fi
echo ""

# 5. Check Recent Backend Logs
echo "5. Recent Backend Logs (Email Reader Related):"
echo "----------------------"
pm2 logs optiohire-backend --lines 50 --nostream 2>/dev/null | grep -i -E "email|imap|reader|ENABLE" | tail -20 || echo "No email-related logs found"
echo ""

# 6. Check if Email Reader Process is Running
echo "6. Email Reader Process Check:"
echo "----------------------"
# Check if there are any IMAP connections or email processing
pm2 logs optiohire-backend --lines 100 --nostream 2>/dev/null | grep -i "email reader\|monitoring inbox\|IMAP" | tail -5 || echo "No email reader activity found in logs"
echo ""

# 7. Check PM2 Environment Variables
echo "7. PM2 Environment Variables:"
echo "----------------------"
pm2 env 0 2>/dev/null | grep -i "ENABLE_EMAIL_READER\|IMAP" || echo "No email-related env vars in PM2"
echo ""

# 8. Check for Errors
echo "8. Recent Errors:"
echo "----------------------"
pm2 logs optiohire-backend --err --lines 20 --nostream 2>/dev/null | tail -10 || echo "No recent errors"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "If email reader is not enabled, run:"
echo "  ./deploy/fix-email-reader-now.sh"
echo ""
