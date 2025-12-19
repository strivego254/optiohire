#!/bin/bash
# Diagnostic script to check why applications aren't being processed

set -e

echo "=========================================="
echo "Email Processing Diagnostic"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR" || exit 1

# Step 1: Check backend status
echo "Step 1: Checking Backend Status..."
echo "-----------------------------------"
BACKEND_STATUS=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "FAILED")
if [ "$BACKEND_STATUS" != "FAILED" ]; then
    echo "✅ Backend is responding"
    echo "$BACKEND_STATUS" | jq '.' 2>/dev/null || echo "$BACKEND_STATUS"
else
    echo "❌ Backend is not responding"
    exit 1
fi
echo ""

# Step 2: Check recent backend logs
echo "Step 2: Checking Recent Backend Logs (Last 50 lines)..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 50 --nostream 2>/dev/null | tail -50 | grep -E "email|Email|EMAIL|imap|IMAP|application|Application|job|Job|matching|Matching" || echo "   No email-related logs found in last 50 lines"
echo ""

# Step 3: Check for errors in logs
echo "Step 3: Checking for Errors..."
echo "-----------------------------------"
pm2 logs optiohire-backend --lines 100 --nostream 2>/dev/null | grep -i "error\|fail\|exception" | tail -20 || echo "   No errors found"
echo ""

# Step 4: Check email reader configuration
echo "Step 4: Checking Email Reader Configuration..."
echo "-----------------------------------"
cd backend
if [ -f ".env" ]; then
    echo "ENABLE_EMAIL_READER:"
    grep "ENABLE_EMAIL_READER" .env || echo "   Not set"
    echo ""
    echo "IMAP Configuration:"
    grep "IMAP_" .env | sed 's/=.*/=***/' || echo "   IMAP not configured"
else
    echo "❌ .env file not found"
fi
echo ""

# Step 5: Check recent applications in database
echo "Step 5: Checking Recent Applications (if database accessible)..."
echo "-----------------------------------"
echo "   (This requires database access - checking via API)"
RECENT_APPS=$(curl -s http://localhost:3001/api/applications?limit=5 2>/dev/null || echo "FAILED")
if [ "$RECENT_APPS" != "FAILED" ]; then
    echo "✅ API is accessible"
    echo "$RECENT_APPS" | jq '.' 2>/dev/null | head -30 || echo "$RECENT_APPS" | head -30
else
    echo "⚠️  Could not check applications via API"
fi
echo ""

# Step 6: Check email reader activity
echo "Step 6: Checking Email Reader Activity..."
echo "-----------------------------------"
echo "Checking logs for email processing activity..."
pm2 logs optiohire-backend --lines 200 --nostream 2>/dev/null | grep -E "Processing email|Found.*emails|SEARCH UNSEEN|Email matched|Application created" | tail -20 || echo "   No email processing activity found"
echo ""

# Step 7: Test email reader endpoint
echo "Step 7: Testing Email Reader Health Endpoint..."
echo "-----------------------------------"
EMAIL_READER_HEALTH=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null)
if [ -n "$EMAIL_READER_HEALTH" ]; then
    echo "$EMAIL_READER_HEALTH" | jq '.' 2>/dev/null || echo "$EMAIL_READER_HEALTH"
    
    # Extract key info
    ENABLED=$(echo "$EMAIL_READER_HEALTH" | jq -r '.emailReader.enabled' 2>/dev/null || echo "unknown")
    RUNNING=$(echo "$EMAIL_READER_HEALTH" | jq -r '.emailReader.running' 2>/dev/null || echo "unknown")
    LAST_PROCESSED=$(echo "$EMAIL_READER_HEALTH" | jq -r '.emailReader.lastProcessedAt' 2>/dev/null || echo "unknown")
    LAST_ERROR=$(echo "$EMAIL_READER_HEALTH" | jq -r '.emailReader.lastError' 2>/dev/null || echo "null")
    
    echo ""
    echo "Status Summary:"
    echo "  Enabled: $ENABLED"
    echo "  Running: $RUNNING"
    echo "  Last Processed: $LAST_PROCESSED"
    if [ "$LAST_ERROR" != "null" ] && [ "$LAST_ERROR" != "" ]; then
        echo "  ⚠️  Last Error: $LAST_ERROR"
    fi
else
    echo "❌ Could not get email reader health"
fi
echo ""

# Step 8: Check PM2 process status
echo "Step 8: Checking PM2 Process Status..."
echo "-----------------------------------"
pm2 list
echo ""

# Step 9: Recommendations
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next Steps to Debug:"
echo "-------------------"
echo "1. Check full backend logs:"
echo "   pm2 logs optiohire-backend --lines 200"
echo ""
echo "2. Monitor logs in real-time:"
echo "   pm2 logs optiohire-backend"
echo ""
echo "3. Check if emails are in inbox:"
echo "   (Verify IMAP credentials are correct)"
echo ""
echo "4. Check email subject format:"
echo "   (Email subject must match job title exactly)"
echo ""
echo "5. Check job postings:"
echo "   curl http://localhost:3001/api/job-postings"
echo ""
echo "6. Restart backend to see startup logs:"
echo "   pm2 restart optiohire-backend"
echo "   pm2 logs optiohire-backend"
echo ""
