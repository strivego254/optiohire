#!/bin/bash
# Fix and verify cron jobs for 24/7 auto-start

set -e

APP_DIR="$HOME/optiohire"
echo "=========================================="
echo "Fixing Cron Jobs for 24/7 Auto-Start"
echo "=========================================="
echo ""

# Step 1: Remove any existing optiohire cron jobs
echo "Step 1: Cleaning existing cron jobs..."
(crontab -l 2>/dev/null | grep -v "optiohire" | grep -v "pm2-monitor" | grep -v "start-all") || true > /tmp/crontab_backup.txt
echo "✅ Cleaned existing cron jobs"
echo ""

# Step 2: Add @reboot job
echo "Step 2: Adding @reboot cron job..."
(cat /tmp/crontab_backup.txt 2>/dev/null; echo "@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1") | crontab -
echo "✅ @reboot job added"
echo ""

# Step 3: Add monitoring job (every 2 minutes)
echo "Step 3: Adding monitoring cron job (every 2 minutes)..."
(crontab -l 2>/dev/null | grep -v "pm2-monitor"; echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -
echo "✅ Monitoring job added"
echo ""

# Step 4: Verify cron jobs
echo "Step 4: Verifying cron jobs..."
echo ""
echo "📋 Current Cron Jobs:"
crontab -l
echo ""

# Step 5: Test the scripts exist and are executable
echo "Step 5: Verifying scripts..."
if [ -f "$APP_DIR/deploy/start-all.sh" ]; then
    echo "✅ start-all.sh exists"
    chmod +x "$APP_DIR/deploy/start-all.sh"
else
    echo "❌ start-all.sh not found"
fi

if [ -f "$APP_DIR/deploy/pm2-monitor.sh" ]; then
    echo "✅ pm2-monitor.sh exists"
    chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
else
    echo "❌ pm2-monitor.sh not found"
fi
echo ""

# Step 6: Create logs directory
echo "Step 6: Creating logs directory..."
mkdir -p "$HOME/logs"
echo "✅ Logs directory created"
echo ""

# Step 7: Test run the monitor script
echo "Step 7: Testing monitor script..."
$APP_DIR/deploy/pm2-monitor.sh
echo "✅ Monitor script test completed"
echo ""

# Step 8: Final verification
echo "Step 8: Final verification..."
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""

echo "📋 Cron Jobs:"
crontab -l
echo ""

echo "=========================================="
echo "✅ Cron Jobs Fixed!"
echo "=========================================="
echo ""
echo "Your cron jobs are now configured:"
echo "  ✅ @reboot - Starts services 30 seconds after boot"
echo "  ✅ */2 * * * * - Monitors and restarts every 2 minutes"
echo ""
echo "To verify cron is working:"
echo "  - Wait 2 minutes"
echo "  - Check: tail -f ~/logs/pm2-monitor.log"
echo "  - After reboot, check: tail -f ~/logs/startup.log"
echo ""


