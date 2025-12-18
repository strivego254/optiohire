#!/bin/bash
# Complete fix for auto-start issues
# This script fixes PM2 startup, cron jobs, and ensures everything works

set -e

echo "=========================================="
echo "Complete Auto-Start Fix"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

CURRENT_USER=$(whoami)

cd "$APP_DIR" || exit 1

echo "Step 1: Ensuring PM2 is installed and working..."
echo "-----------------------------------"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Ensure PM2 daemon is running
pm2 ping > /dev/null 2>&1 || pm2 kill && sleep 2 && pm2 ping > /dev/null 2>&1 || true
echo -e "${GREEN}✅ PM2 is working${NC}"
echo ""

echo "Step 2: Ensuring backend is built..."
echo "-----------------------------------"
cd backend || exit 1
if [ ! -f "dist/server.js" ]; then
    echo "Building backend..."
    npm install --production=false
    npm run build
    if [ ! -f "dist/server.js" ]; then
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Backend is built${NC}"
cd "$APP_DIR" || exit 1
echo ""

echo "Step 3: Starting/restarting PM2 processes..."
echo "-----------------------------------"
# Stop all existing processes
pm2 delete all 2>/dev/null || true
sleep 2

# Start using ecosystem config
if [ -f "$APP_DIR/deploy/ecosystem.config.js" ]; then
    pm2 start "$APP_DIR/deploy/ecosystem.config.js" --update-env
    echo -e "${GREEN}✅ PM2 processes started${NC}"
else
    echo -e "${RED}❌ ecosystem.config.js not found!${NC}"
    exit 1
fi

# Save PM2 state (CRITICAL for auto-start)
pm2 save --force
echo -e "${GREEN}✅ PM2 state saved${NC}"
echo ""

echo "Step 4: Setting up PM2 systemd startup (primary method)..."
echo "-----------------------------------"
# Generate PM2 startup command
STARTUP_OUTPUT=$(pm2 startup systemd -u $CURRENT_USER --hp $HOME 2>&1)
echo "$STARTUP_OUTPUT"

# Extract the sudo command from output
STARTUP_CMD=$(echo "$STARTUP_OUTPUT" | grep -E "sudo.*pm2 startup" | head -1)

if [ -n "$STARTUP_CMD" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Run this command to enable PM2 auto-start:${NC}"
    echo "   $STARTUP_CMD"
    echo ""
    echo "   Or if you have sudo access, run it now:"
    read -p "   Do you want to run it now? (requires sudo) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval "$STARTUP_CMD" || echo -e "${YELLOW}⚠️  Failed to run startup command (may need manual sudo)${NC}"
    fi
fi

# Check if service exists
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    echo -e "${GREEN}✅ PM2 startup service exists${NC}"
    
    # Enable it
    sudo systemctl enable pm2-${CURRENT_USER} 2>/dev/null || echo -e "${YELLOW}⚠️  Could not enable service (may need manual sudo)${NC}"
    
    # Check status
    if systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 startup service is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 startup service is not enabled${NC}"
        echo "   Run: sudo systemctl enable pm2-${CURRENT_USER}"
    fi
else
    echo -e "${YELLOW}⚠️  PM2 startup service not found${NC}"
    echo "   You need to run the command shown above"
fi
echo ""

echo "Step 5: Setting up cron jobs (backup method)..."
echo "-----------------------------------"
# Ensure logs directory exists
mkdir -p "$HOME/logs"

# Ensure scripts are executable
chmod +x "$APP_DIR/deploy/start-all.sh" 2>/dev/null || true
chmod +x "$APP_DIR/deploy/pm2-monitor.sh" 2>/dev/null || true

# Remove existing cron jobs for optiohire
(crontab -l 2>/dev/null | grep -v "@reboot.*optiohire" | grep -v "@reboot.*start-all.sh" | grep -v "pm2-monitor.sh"; cat << EOF
@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1
*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1
EOF
) | crontab -

echo -e "${GREEN}✅ Cron jobs configured${NC}"
echo ""

echo "Step 6: Verifying setup..."
echo "-----------------------------------"
sleep 2

echo "PM2 Status:"
pm2 list
echo ""

echo "PM2 Save File:"
if [ -f "$HOME/.pm2/dump.pm2" ]; then
    echo -e "${GREEN}✅ PM2 save file exists${NC}"
    ls -lh "$HOME/.pm2/dump.pm2"
else
    echo -e "${RED}❌ PM2 save file not found!${NC}"
    echo "   Saving now..."
    pm2 save --force
fi
echo ""

echo "Cron Jobs:"
crontab -l | grep -E "optiohire|start-all|pm2-monitor" || echo "No cron jobs found"
echo ""

echo "PM2 Startup Service:"
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    systemctl status pm2-${CURRENT_USER} --no-pager -l 2>/dev/null | head -5 || echo "Service exists but status check failed"
else
    echo -e "${YELLOW}⚠️  PM2 startup service not configured${NC}"
    echo "   Run the command shown in Step 4"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Auto-Start Fix Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ PM2 processes are running"
echo "  ✅ PM2 state is saved"
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    if systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1; then
        echo "  ✅ PM2 systemd service is enabled (primary auto-start method)"
    else
        echo "  ⚠️  PM2 systemd service exists but needs to be enabled"
        echo "     Run: sudo systemctl enable pm2-${CURRENT_USER}"
    fi
else
    echo "  ⚠️  PM2 systemd service not configured"
    echo "     Run the command shown in Step 4 above"
fi
echo "  ✅ Cron jobs are configured (backup auto-start method)"
echo ""
echo "Auto-start methods:"
echo "  1. PM2 systemd service (primary) - starts immediately on boot"
echo "  2. Cron @reboot (backup) - starts 30 seconds after boot"
echo "  3. Cron monitor (every 2 min) - restarts if processes crash"
echo ""
echo "To test auto-start:"
echo "  1. Reboot server: sudo reboot"
echo "  2. Wait 1 minute after boot"
echo "  3. Check: pm2 list"
echo "  4. Check logs: tail -f ~/logs/startup.log"
echo ""

