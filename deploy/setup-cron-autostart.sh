#!/bin/bash
# Alternative 24/7 auto-start using cron (more reliable than systemd)
# This ensures processes start on boot and stay running

set -e

echo "=========================================="
echo "Setting up 24/7 Auto-Start (Cron Method)"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
CURRENT_USER=$(whoami)

# Step 1: Create startup script
echo "Step 1: Creating startup script..."
mkdir -p "$APP_DIR/deploy"

cat > "$APP_DIR/deploy/start-all.sh" << 'EOF'
#!/bin/bash
# Start all OptioHire services
# This script is called on boot and by the monitor

export PATH="$PATH:/usr/bin:/usr/local/bin"
cd "$HOME/optiohire"

# Start backend if not running
if ! pm2 list | grep -q "optiohire-backend.*online"; then
    cd "$HOME/optiohire/backend"
    if [ -f "dist/server.js" ]; then
        pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null || true
    fi
fi

# Start frontend if not running
if ! pm2 list | grep -q "optiohire-frontend.*online"; then
    cd "$HOME/optiohire/frontend"
    pm2 start npm --name optiohire-frontend -- start 2>/dev/null || true
fi

# Save PM2 state
pm2 save --force 2>/dev/null || true
EOF

chmod +x "$APP_DIR/deploy/start-all.sh"
echo "✅ Startup script created"
echo ""

# Step 2: Create @reboot cron job
echo "Step 2: Setting up @reboot cron job..."
# Remove any existing @reboot entries for optiohire
(crontab -l 2>/dev/null | grep -v "@reboot.*optiohire" | grep -v "@reboot.*start-all.sh"; echo "@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1") | crontab -
echo "✅ @reboot cron job added (starts 30 seconds after boot)"
echo ""

# Step 3: Update monitoring script
echo "Step 3: Updating monitoring script..."
cat > "$APP_DIR/deploy/pm2-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor and restart PM2 processes if they crash
# This ensures 24/7 operation even if processes fail

export PATH="$PATH:/usr/bin:/usr/local/bin"
LOG_FILE="$HOME/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure log directory exists
mkdir -p "$HOME/logs"

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    echo "[$DATE] ⚠️  PM2 not found in PATH" >> "$LOG_FILE"
    exit 1
fi

# Check if backend is running
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] ⚠️  Backend is not running, restarting..." >> "$LOG_FILE"
    cd "$HOME/optiohire/backend"
    if [ -f "dist/server.js" ]; then
        pm2 restart optiohire-backend 2>/dev/null || pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null
        echo "[$DATE] ✅ Backend restarted" >> "$LOG_FILE"
    else
        echo "[$DATE] ❌ Backend dist/server.js not found" >> "$LOG_FILE"
    fi
fi

# Check if frontend is running
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] ⚠️  Frontend is not running, restarting..." >> "$LOG_FILE"
    cd "$HOME/optiohire/frontend"
    pm2 restart optiohire-frontend 2>/dev/null || pm2 start npm --name optiohire-frontend -- start 2>/dev/null
    echo "[$DATE] ✅ Frontend restarted" >> "$LOG_FILE"
fi

# Save PM2 state periodically
pm2 save --force 2>/dev/null || true
EOF

chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
echo "✅ Monitoring script updated"
echo ""

# Step 4: Setup monitoring cron (every 2 minutes)
echo "Step 4: Setting up monitoring cron job (every 2 minutes)..."
(crontab -l 2>/dev/null | grep -v "pm2-monitor.sh"; echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -
echo "✅ Monitoring cron job added"
echo ""

# Step 5: Ensure processes are running now
echo "Step 5: Ensuring processes are running now..."
$APP_DIR/deploy/start-all.sh
echo "✅ Processes started"
echo ""

# Step 6: Save PM2 state
echo "Step 6: Saving PM2 state..."
pm2 save --force
echo "✅ PM2 state saved"
echo ""

# Step 7: Verify
echo "Step 7: Verification..."
echo ""
echo "📊 Current PM2 Status:"
pm2 list
echo ""

echo "📋 Cron Jobs:"
crontab -l | grep -E "optiohire|pm2|start-all" || echo "No cron jobs found"
echo ""

echo "=========================================="
echo "✅ 24/7 Auto-Start Setup Complete!"
echo "=========================================="
echo ""
echo "Your application is now configured to:"
echo "  ✅ Start automatically 30 seconds after server reboot (via cron @reboot)"
echo "  ✅ Auto-restart if processes crash (monitor checks every 2 minutes)"
echo "  ✅ Run 24/7 without manual intervention"
echo ""
echo "This method is more reliable than systemd because:"
echo "  - Cron @reboot always works"
echo "  - No systemd service configuration needed"
echo "  - Processes are monitored and restarted automatically"
echo ""
echo "To test after reboot:"
echo "  - Wait 1 minute after server starts"
echo "  - Check: pm2 list"
echo "  - Check logs: tail -f ~/logs/startup.log"
echo "  - Check monitor: tail -f ~/logs/pm2-monitor.log"
echo ""

