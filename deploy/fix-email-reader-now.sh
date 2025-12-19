#!/bin/bash
# URGENT FIX: Ensure Email Reader Starts Automatically
# This script fixes the email reader not starting issue

set -e

echo "=========================================="
echo "🔧 FIXING EMAIL READER - URGENT"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

cd "$APP_DIR"

# Step 1: Ensure .env file has ENABLE_EMAIL_READER=true
echo "Step 1: Ensuring email reader is enabled in .env..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "❌ ERROR: backend/.env file not found!"
    echo "Please create it with all required credentials."
    exit 1
fi

# Remove any ENABLE_EMAIL_READER=false lines
sed -i '/^ENABLE_EMAIL_READER=false/d' "$APP_DIR/backend/.env" 2>/dev/null || true

# Add or update ENABLE_EMAIL_READER=true
if grep -q "^ENABLE_EMAIL_READER=" "$APP_DIR/backend/.env"; then
    sed -i 's/^ENABLE_EMAIL_READER=.*/ENABLE_EMAIL_READER=true/' "$APP_DIR/backend/.env"
    echo "✅ Updated ENABLE_EMAIL_READER=true"
else
    echo "" >> "$APP_DIR/backend/.env"
    echo "# Email Reader - MUST BE TRUE for automatic processing" >> "$APP_DIR/backend/.env"
    echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
    echo "✅ Added ENABLE_EMAIL_READER=true"
fi

# Ensure IMAP_POLL_MS is set to 1000 (1 second)
if grep -q "^IMAP_POLL_MS=" "$APP_DIR/backend/.env"; then
    sed -i 's/^IMAP_POLL_MS=.*/IMAP_POLL_MS=1000/' "$APP_DIR/backend/.env"
else
    echo "IMAP_POLL_MS=1000" >> "$APP_DIR/backend/.env"
fi

echo ""

# Step 2: Update PM2 ecosystem config to explicitly pass ENABLE_EMAIL_READER
echo "Step 2: Updating PM2 configuration..."
cd "$APP_DIR"

# Backup original
cp deploy/ecosystem.config.js deploy/ecosystem.config.js.backup 2>/dev/null || true

# Use sed to add ENABLE_EMAIL_READER to the env section
# First, check if it already exists
if grep -q "ENABLE_EMAIL_READER" deploy/ecosystem.config.js; then
    # Update existing
    sed -i "s/ENABLE_EMAIL_READER:.*/ENABLE_EMAIL_READER: 'true', \/\/ CRITICAL: Explicitly enabled/" deploy/ecosystem.config.js
else
    # Add after PORT: 3001,
    sed -i "/PORT: 3001,/a\        ENABLE_EMAIL_READER: 'true', \/\/ CRITICAL: Explicitly enabled" deploy/ecosystem.config.js
fi

echo "✅ Updated PM2 ecosystem config with ENABLE_EMAIL_READER=true"
echo ""

# Step 4: Restart backend with new configuration
echo "Step 4: Restarting backend with email reader enabled..."
pm2 stop optiohire-backend 2>/dev/null || true
pm2 delete optiohire-backend 2>/dev/null || true

# Start with new config
pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env

# Wait a moment
sleep 3

# Check if it's running
if pm2 list | grep -q "optiohire-backend.*online"; then
    echo "✅ Backend restarted successfully"
else
    echo "❌ ERROR: Backend failed to start"
    pm2 logs optiohire-backend --lines 20
    exit 1
fi

echo ""

# Step 5: Verify email reader is enabled
echo "Step 5: Verifying email reader status..."
sleep 2

EMAIL_READER_STATUS=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "{}")

if echo "$EMAIL_READER_STATUS" | grep -q '"enabled":true'; then
    echo "✅ Email reader is ENABLED and running!"
    echo ""
    echo "Email Reader Status:"
    echo "$EMAIL_READER_STATUS" | python3 -m json.tool 2>/dev/null || echo "$EMAIL_READER_STATUS"
else
    echo "⚠️  Email reader status check:"
    echo "$EMAIL_READER_STATUS" | python3 -m json.tool 2>/dev/null || echo "$EMAIL_READER_STATUS"
    echo ""
    echo "Checking backend logs for email reader initialization..."
    pm2 logs optiohire-backend --lines 30 --nostream | grep -i "email\|imap" || echo "No email-related logs found"
fi

echo ""

# Step 6: Save PM2 configuration
echo "Step 6: Saving PM2 configuration..."
pm2 save --force
echo "✅ PM2 configuration saved"
echo ""

echo "=========================================="
echo "✅ FIX COMPLETE!"
echo "=========================================="
echo ""
echo "The email reader should now be running automatically."
echo ""
echo "Monitor email processing:"
echo "  pm2 logs optiohire-backend | grep -i email"
echo ""
echo "Check email reader status:"
echo "  curl http://localhost:3001/health/email-reader"
echo ""
echo "View all logs:"
echo "  pm2 logs optiohire-backend"
echo ""
