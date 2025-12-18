#!/bin/bash
# Verify PM2 auto-start configuration

echo "=========================================="
echo "PM2 Auto-Start Verification"
echo "=========================================="
echo ""

# Check PM2 status
echo "1. Checking PM2 processes..."
pm2 list
echo ""

# Check if PM2 save file exists
echo "2. Checking PM2 save file..."
if [ -f ~/.pm2/dump.pm2 ]; then
    echo "✅ PM2 save file exists"
else
    echo "⚠️  PM2 save file not found"
    echo "   Run: pm2 save"
fi
echo ""

# Check if startup service exists
echo "3. Checking PM2 startup service..."
CURRENT_USER=$(whoami)
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    echo "✅ PM2 startup service found"
    systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PM2 startup service is enabled"
    else
        echo "⚠️  PM2 startup service exists but is not enabled"
        echo "   Enable it with: sudo systemctl enable pm2-${CURRENT_USER}"
    fi
    
    systemctl is-active pm2-${CURRENT_USER} > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PM2 startup service is active"
    else
        echo "⚠️  PM2 startup service is not active"
        echo "   Start it with: sudo systemctl start pm2-${CURRENT_USER}"
    fi
else
    echo "❌ PM2 startup service not found"
    echo "   Run: pm2 startup"
    echo "   Then copy and run the command it shows"
fi
echo ""

# Check monitoring script
echo "4. Checking monitoring script..."
if [ -f ~/optiohire/deploy/pm2-monitor.sh ]; then
    echo "✅ Monitoring script exists"
    if [ -x ~/optiohire/deploy/pm2-monitor.sh ]; then
        echo "✅ Monitoring script is executable"
    else
        echo "⚠️  Monitoring script is not executable"
        echo "   Run: chmod +x ~/optiohire/deploy/pm2-monitor.sh"
    fi
else
    echo "⚠️  Monitoring script not found"
fi
echo ""

# Check cron job
echo "5. Checking cron job..."
if crontab -l 2>/dev/null | grep -q "pm2-monitor.sh"; then
    echo "✅ Monitoring cron job exists"
else
    echo "⚠️  Monitoring cron job not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "To ensure 24/7 auto-run:"
echo ""
echo "1. PM2 processes should be running: pm2 list"
echo "2. PM2 should be saved: pm2 save"
echo "3. PM2 startup service should exist and be enabled"
echo "4. After server reboot, processes should auto-start"
echo ""
echo "To test (optional):"
echo "  sudo reboot"
echo "  # After reboot, SSH back in and run: pm2 list"
echo ""

