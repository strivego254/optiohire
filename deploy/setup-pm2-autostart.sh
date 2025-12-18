#!/bin/bash
# Setup PM2 to auto-start on server reboot
# This ensures the backend and frontend run 24/7 automatically

set -e

echo "=========================================="
echo "PM2 Auto-Start Setup"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed"
    echo "   Install it with: npm install -g pm2"
    exit 1
fi

# Check if running as the correct user
CURRENT_USER=$(whoami)
echo "📋 Current user: $CURRENT_USER"
echo ""

# Step 1: Check PM2 status
echo "Step 1: Checking PM2 status..."
pm2 list

# Step 2: Save current PM2 process list
echo ""
echo "Step 2: Saving PM2 process list..."
pm2 save
if [ $? -eq 0 ]; then
    echo "✅ PM2 process list saved"
else
    echo "❌ Failed to save PM2 process list"
    exit 1
fi

# Step 3: Generate PM2 startup script
echo ""
echo "Step 3: Generating PM2 startup script..."
pm2 startup

echo ""
echo "⚠️  IMPORTANT: Copy and run the command shown above!"
echo "   It will look something like:"
echo "   sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp /home/$CURRENT_USER"
echo ""

# Step 4: Verify startup script
echo ""
echo "Step 4: Checking if startup script exists..."
if [ -f "/etc/systemd/system/pm2-$CURRENT_USER.service" ]; then
    echo "✅ PM2 startup service found"
    systemctl status pm2-$CURRENT_USER > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PM2 startup service is enabled"
    else
        echo "⚠️  PM2 startup service exists but may not be enabled"
        echo "   Enable it with: sudo systemctl enable pm2-$CURRENT_USER"
    fi
else
    echo "⚠️  PM2 startup service not found"
    echo "   You need to run the command from Step 3"
fi

# Step 5: Test PM2 processes
echo ""
echo "Step 5: Verifying PM2 processes are running..."
pm2 list | grep -q "online" && echo "✅ PM2 processes are running" || echo "⚠️  No PM2 processes found"

# Step 6: Create PM2 monitoring script
echo ""
echo "Step 6: Creating PM2 monitoring script..."
cat > ~/optiohire/deploy/pm2-monitor.sh << 'EOF'
#!/bin/bash
# Monitor and restart PM2 processes if they crash

LOG_FILE="/home/optiohire/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if backend is running
if ! pm2 list | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] Backend is not running, restarting..." >> "$LOG_FILE"
    pm2 restart optiohire-backend
fi

# Check if frontend is running
if ! pm2 list | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] Frontend is not running, restarting..." >> "$LOG_FILE"
    pm2 restart optiohire-frontend
fi
EOF

chmod +x ~/optiohire/deploy/pm2-monitor.sh
echo "✅ Monitoring script created at ~/optiohire/deploy/pm2-monitor.sh"

# Step 7: Add monitoring to crontab (check every 5 minutes)
echo ""
echo "Step 7: Setting up automatic monitoring..."
(crontab -l 2>/dev/null | grep -v "pm2-monitor.sh"; echo "*/5 * * * * $HOME/optiohire/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -
echo "✅ Monitoring cron job added (checks every 5 minutes)"

echo ""
echo "=========================================="
echo "✅ PM2 Auto-Start Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run the 'pm2 startup' command shown above (as root/sudo)"
echo "2. Verify with: pm2 list"
echo "3. Test reboot: sudo reboot (after ensuring startup is configured)"
echo ""
echo "Your app will now:"
echo "  ✅ Auto-start on server reboot"
echo "  ✅ Auto-restart if processes crash"
echo "  ✅ Run 24/7 without manual intervention"
echo ""

