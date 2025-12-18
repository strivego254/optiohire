#!/bin/bash
# Complete the auto-start setup (non-interactive version)
# Run this after the PM2 startup service has been created

set -e

echo "=========================================="
echo "Completing Auto-Start Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CURRENT_USER=$(whoami)

echo "Step 1: Verifying PM2 processes are running..."
echo "-----------------------------------"
pm2 list
echo ""

echo "Step 2: Saving PM2 state..."
echo "-----------------------------------"
pm2 save --force
echo -e "${GREEN}✅ PM2 state saved${NC}"
echo ""

echo "Step 3: Checking PM2 startup service..."
echo "-----------------------------------"
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    echo -e "${GREEN}✅ PM2 startup service exists${NC}"
    
    # Check if enabled
    if systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 startup service is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 startup service is not enabled${NC}"
        echo "   Run: sudo systemctl enable pm2-${CURRENT_USER}"
    fi
    
    # Check if active
    if systemctl is-active pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 startup service is active${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 startup service is not active (this is normal if server hasn't rebooted)${NC}"
    fi
else
    echo -e "${RED}❌ PM2 startup service not found${NC}"
    echo "   Run: sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ${CURRENT_USER} --hp $HOME"
    exit 1
fi
echo ""

echo "Step 4: Verifying cron jobs (backup method)..."
echo "-----------------------------------"
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

CRON_JOBS=$(crontab -l 2>/dev/null | grep -E "optiohire|start-all|pm2-monitor" || echo "")
if [ -n "$CRON_JOBS" ]; then
    echo -e "${GREEN}✅ Cron jobs are configured:${NC}"
    echo "$CRON_JOBS"
else
    echo -e "${YELLOW}⚠️  No cron jobs found - setting them up...${NC}"
    mkdir -p "$HOME/logs"
    chmod +x "$APP_DIR/deploy/start-all.sh" 2>/dev/null || true
    chmod +x "$APP_DIR/deploy/pm2-monitor.sh" 2>/dev/null || true
    
    (crontab -l 2>/dev/null | grep -v "@reboot.*optiohire" | grep -v "@reboot.*start-all.sh" | grep -v "pm2-monitor.sh"; cat << EOF
@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1
*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1
EOF
    ) | crontab -
    echo -e "${GREEN}✅ Cron jobs configured${NC}"
fi
echo ""

echo "Step 5: Final verification..."
echo "-----------------------------------"
echo "PM2 Status:"
pm2 list
echo ""

echo "PM2 Save File:"
if [ -f "$HOME/.pm2/dump.pm2" ]; then
    echo -e "${GREEN}✅ PM2 save file exists${NC}"
    ls -lh "$HOME/.pm2/dump.pm2"
else
    echo -e "${RED}❌ PM2 save file not found!${NC}"
    pm2 save --force
fi
echo ""

echo "Service Status:"
systemctl status pm2-${CURRENT_USER} --no-pager -l 2>/dev/null | head -10 || echo "Could not get service status"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Auto-Start Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application is now configured for 24/7 auto-start:"
echo ""
echo "✅ PM2 systemd service (primary method):"
echo "   - Service: pm2-${CURRENT_USER}"
echo "   - Status: $(systemctl is-enabled pm2-${CURRENT_USER} 2>/dev/null || echo 'unknown')"
echo "   - Starts immediately on boot"
echo ""
echo "✅ Cron jobs (backup method):"
echo "   - @reboot: Starts 30 seconds after boot"
echo "   - */2 * * * *: Monitors and restarts every 2 minutes"
echo ""
echo "✅ PM2 processes:"
pm2 list --no-color | grep -E "name|optiohire" || echo "   (check with: pm2 list)"
echo ""
echo "To test auto-start:"
echo "  1. Reboot server: sudo reboot"
echo "  2. Wait 1 minute after boot"
echo "  3. Check: pm2 list"
echo "  4. Check logs: tail -f ~/logs/startup.log"
echo ""

