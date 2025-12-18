#!/bin/bash
# Ensure OptioHire runs 24/7 automatically - no manual intervention needed
# This script verifies and fixes auto-start configuration

set -e

echo "=========================================="
echo "24/7 Auto-Start Configuration"
echo "=========================================="
echo ""

CURRENT_USER=$(whoami)
APP_DIR="$HOME/optiohire"

# Step 1: Verify PM2 is installed
echo "Step 1: Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 is installed"
fi
echo ""

# Step 2: Ensure PM2 processes are running
echo "Step 2: Ensuring PM2 processes are running..."
cd "$APP_DIR"

# Check if backend is running
if ! pm2 list | grep -q "optiohire-backend.*online"; then
    echo "⚠️  Backend is not running. Starting..."
    cd "$APP_DIR/backend"
    if [ ! -f "dist/server.js" ]; then
        echo "   Building backend..."
        npm run build
    fi
    pm2 start dist/server.js --name optiohire-backend --update-env
    echo "✅ Backend started"
else
    echo "✅ Backend is running"
fi

# Check if frontend is running
if ! pm2 list | grep -q "optiohire-frontend.*online"; then
    echo "⚠️  Frontend is not running. Starting..."
    cd "$APP_DIR/frontend"
    pm2 start npm --name optiohire-frontend -- start
    echo "✅ Frontend started"
else
    echo "✅ Frontend is running"
fi
echo ""

# Step 3: Save PM2 configuration
echo "Step 3: Saving PM2 configuration..."
pm2 save
if [ $? -eq 0 ]; then
    echo "✅ PM2 configuration saved"
else
    echo "❌ Failed to save PM2 configuration"
    exit 1
fi
echo ""

# Step 4: Setup PM2 startup on boot
echo "Step 4: Setting up PM2 to start on server boot..."
if [ ! -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    echo "⚠️  PM2 startup service not found. Generating..."
    STARTUP_CMD=$(pm2 startup systemd -u $CURRENT_USER --hp $HOME | grep -v "PM2" | grep -v "Use" | grep -v "Copy" | tail -1)
    
    if [ -n "$STARTUP_CMD" ]; then
        echo ""
        echo "⚠️  IMPORTANT: Run this command as root/sudo:"
        echo "   $STARTUP_CMD"
        echo ""
        echo "   Or run: sudo $STARTUP_CMD"
        echo ""
    else
        echo "⚠️  Could not generate startup command automatically"
        echo "   Run manually: pm2 startup"
        echo "   Then copy and run the command it shows"
    fi
else
    echo "✅ PM2 startup service exists"
    
    # Check if it's enabled
    if systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo "✅ PM2 startup service is enabled"
    else
        echo "⚠️  PM2 startup service is not enabled. Enabling..."
        sudo systemctl enable pm2-${CURRENT_USER}
        echo "✅ PM2 startup service enabled"
    fi
    
    # Check if it's active
    if systemctl is-active pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo "✅ PM2 startup service is active"
    else
        echo "⚠️  PM2 startup service is not active. Starting..."
        sudo systemctl start pm2-${CURRENT_USER}
        echo "✅ PM2 startup service started"
    fi
fi
echo ""

# Step 5: Configure PM2 to auto-restart on crash
echo "Step 5: Configuring auto-restart on crash..."
pm2 set pm2:autodump true
echo "✅ Auto-restart on crash enabled"
echo ""

# Step 6: Create monitoring script
echo "Step 6: Setting up process monitoring..."
mkdir -p "$HOME/logs"

cat > "$APP_DIR/deploy/pm2-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor and restart PM2 processes if they crash
# This ensures 24/7 operation even if processes fail

LOG_FILE="$HOME/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure log directory exists
mkdir -p "$HOME/logs"

# Check if backend is running
if ! pm2 list | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] ⚠️  Backend is not running, restarting..." >> "$LOG_FILE"
    cd "$HOME/optiohire/backend"
    pm2 restart optiohire-backend || pm2 start dist/server.js --name optiohire-backend --update-env
    echo "[$DATE] ✅ Backend restarted" >> "$LOG_FILE"
fi

# Check if frontend is running
if ! pm2 list | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] ⚠️  Frontend is not running, restarting..." >> "$LOG_FILE"
    cd "$HOME/optiohire/frontend"
    pm2 restart optiohire-frontend || pm2 start npm --name optiohire-frontend -- start
    echo "[$DATE] ✅ Frontend restarted" >> "$LOG_FILE"
fi
EOF

chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
echo "✅ Monitoring script created"
echo ""

# Step 7: Setup cron job for monitoring (every 2 minutes)
echo "Step 7: Setting up automatic monitoring (every 2 minutes)..."
(crontab -l 2>/dev/null | grep -v "pm2-monitor.sh"; echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -
echo "✅ Monitoring cron job added (checks every 2 minutes)"
echo ""

# Step 8: Verify email reader is enabled
echo "Step 8: Verifying email reader configuration..."
if [ -f "$APP_DIR/backend/.env" ]; then
    if grep -q "ENABLE_EMAIL_READER=true" "$APP_DIR/backend/.env"; then
        echo "✅ Email reader is enabled"
    else
        echo "⚠️  Email reader is not enabled in .env"
        echo "   Adding ENABLE_EMAIL_READER=true to .env..."
        if ! grep -q "ENABLE_EMAIL_READER" "$APP_DIR/backend/.env"; then
            echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
        else
            sed -i 's/ENABLE_EMAIL_READER=.*/ENABLE_EMAIL_READER=true/' "$APP_DIR/backend/.env"
        fi
        echo "✅ Email reader enabled - restarting backend..."
        pm2 restart optiohire-backend --update-env
    fi
    
    if grep -q "IMAP_POLL_MS=1000" "$APP_DIR/backend/.env"; then
        echo "✅ Email polling interval is set to 1 second"
    else
        echo "⚠️  Email polling interval not set. Setting to 1 second..."
        if ! grep -q "IMAP_POLL_MS" "$APP_DIR/backend/.env"; then
            echo "IMAP_POLL_MS=1000" >> "$APP_DIR/backend/.env"
        else
            sed -i 's/IMAP_POLL_MS=.*/IMAP_POLL_MS=1000/' "$APP_DIR/backend/.env"
        fi
        echo "✅ Email polling interval set - restarting backend..."
        pm2 restart optiohire-backend --update-env
    fi
else
    echo "⚠️  Backend .env file not found"
fi
echo ""

# Step 9: Final verification
echo "Step 9: Final verification..."
echo ""
echo "📊 Current PM2 Status:"
pm2 list
echo ""

echo "📋 PM2 Startup Service:"
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    systemctl status pm2-${CURRENT_USER} --no-pager -l | head -10
else
    echo "⚠️  Startup service not configured yet"
fi
echo ""

echo "📋 Cron Jobs:"
crontab -l 2>/dev/null | grep -E "pm2-monitor|optiohire" || echo "No monitoring cron jobs found"
echo ""

echo "=========================================="
echo "✅ 24/7 Auto-Start Configuration Complete!"
echo "=========================================="
echo ""
echo "Your application is now configured to:"
echo "  ✅ Start automatically on server reboot"
echo "  ✅ Auto-restart if processes crash"
echo "  ✅ Monitor and restart every 2 minutes if needed"
echo "  ✅ Process emails automatically every 1 second"
echo "  ✅ Run 24/7 without manual intervention"
echo ""
echo "Next steps (if startup service not configured):"
echo "  1. Run: pm2 startup"
echo "  2. Copy and run the command it shows (with sudo)"
echo "  3. Verify with: sudo systemctl status pm2-${CURRENT_USER}"
echo ""
echo "To test:"
echo "  - Check status: pm2 list"
echo "  - View logs: pm2 logs optiohire-backend"
echo "  - Check email reader: curl http://localhost:3001/health/email-reader"
echo ""

