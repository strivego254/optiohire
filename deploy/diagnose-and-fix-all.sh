#!/bin/bash
# Comprehensive diagnostic and fix script for auto-start and email reader issues

set -e

echo "=========================================="
echo "OptioHire Diagnostic & Fix Script"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

CURRENT_USER=$(whoami)
LOG_DIR="$HOME/logs"
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "Step 1: Checking PM2 Installation..."
echo "-----------------------------------"
if command -v pm2 &> /dev/null; then
    print_status 0 "PM2 is installed"
    PM2_VERSION=$(pm2 --version)
    echo "   Version: $PM2_VERSION"
else
    print_status 1 "PM2 is not installed"
    echo "   Installing PM2..."
    npm install -g pm2
    print_status 0 "PM2 installed"
fi
echo ""

echo "Step 2: Checking Current PM2 Status..."
echo "-----------------------------------"
pm2 list
echo ""

echo "Step 3: Checking Backend Status..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1

# Check if backend is built
if [ ! -f "dist/server.js" ]; then
    print_warning "Backend not built. Building now..."
    npm run build
    if [ $? -eq 0 ]; then
        print_status 0 "Backend built successfully"
    else
        print_status 1 "Backend build failed"
        exit 1
    fi
else
    print_status 0 "Backend is built"
fi

# Check if backend is running
if pm2 list | grep -q "optiohire-backend.*online"; then
    print_status 0 "Backend is running"
else
    print_warning "Backend is not running. Starting now..."
    pm2 start ecosystem.config.js --only optiohire-backend --update-env || \
    pm2 start dist/server.js --name optiohire-backend --update-env
    sleep 3
    if pm2 list | grep -q "optiohire-backend.*online"; then
        print_status 0 "Backend started successfully"
    else
        print_status 1 "Backend failed to start"
        echo "   Checking logs..."
        pm2 logs optiohire-backend --lines 20 --nostream
    fi
fi
echo ""

echo "Step 4: Checking Frontend Status..."
echo "-----------------------------------"
cd "$APP_DIR/frontend" || exit 1

# Check if frontend is running
if pm2 list | grep -q "optiohire-frontend.*online"; then
    print_status 0 "Frontend is running"
else
    print_warning "Frontend is not running. Starting now..."
    pm2 start ecosystem.config.js --only optiohire-frontend || \
    pm2 start npm --name optiohire-frontend -- start
    sleep 3
    if pm2 list | grep -q "optiohire-frontend.*online"; then
        print_status 0 "Frontend started successfully"
    else
        print_status 1 "Frontend failed to start"
    fi
fi
echo ""

echo "Step 5: Checking Email Reader Configuration..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1

# Check .env file
if [ ! -f ".env" ]; then
    print_status 1 ".env file not found"
    exit 1
fi

# Check email reader env vars
if grep -q "ENABLE_EMAIL_READER=true" .env; then
    print_status 0 "Email reader is enabled in .env"
elif grep -q "ENABLE_EMAIL_READER=false" .env; then
    print_warning "Email reader is DISABLED in .env"
    echo "   To enable, set ENABLE_EMAIL_READER=true in backend/.env"
else
    print_warning "ENABLE_EMAIL_READER not set in .env (defaults to false)"
    echo "   Adding ENABLE_EMAIL_READER=true to .env..."
    echo "ENABLE_EMAIL_READER=true" >> .env
    print_status 0 "Email reader enabled"
fi

# Check IMAP configuration
if grep -q "IMAP_USER=" .env && grep -q "IMAP_PASS=" .env && grep -q "IMAP_HOST=" .env; then
    print_status 0 "IMAP credentials are configured"
else
    print_warning "IMAP credentials are missing"
    echo "   Required: IMAP_HOST, IMAP_USER, IMAP_PASS"
fi
echo ""

echo "Step 6: Testing Email Reader Health Endpoint..."
echo "-----------------------------------"
sleep 2
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "FAILED")
if [ "$HEALTH_RESPONSE" != "FAILED" ]; then
    echo "   Response: $HEALTH_RESPONSE"
    if echo "$HEALTH_RESPONSE" | grep -q "enabled.*true"; then
        print_status 0 "Email reader is enabled and responding"
    else
        print_warning "Email reader may not be enabled or running"
    fi
else
    print_warning "Backend health endpoint not responding"
    echo "   Backend may not be running or port 3001 is not accessible"
fi
echo ""

echo "Step 7: Checking Recent Backend Logs..."
echo "-----------------------------------"
echo "Last 30 lines of backend logs:"
pm2 logs optiohire-backend --lines 30 --nostream 2>/dev/null | tail -30 || echo "   Could not read logs"
echo ""

echo "Step 8: Setting Up Auto-Start (PM2 Save)..."
echo "-----------------------------------"
pm2 save --force
if [ $? -eq 0 ]; then
    print_status 0 "PM2 state saved"
else
    print_status 1 "Failed to save PM2 state"
fi
echo ""

echo "Step 9: Setting Up Systemd Auto-Start..."
echo "-----------------------------------"
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    print_status 0 "PM2 systemd service exists"
    
    # Check if enabled
    if systemctl is-enabled pm2-${CURRENT_USER} > /dev/null 2>&1; then
        print_status 0 "PM2 systemd service is enabled"
    else
        print_warning "PM2 systemd service is not enabled. Enabling..."
        sudo systemctl enable pm2-${CURRENT_USER}
        print_status 0 "PM2 systemd service enabled"
    fi
    
    # Check if active
    if systemctl is-active pm2-${CURRENT_USER} > /dev/null 2>&1; then
        print_status 0 "PM2 systemd service is active"
    else
        print_warning "PM2 systemd service is not active. Starting..."
        sudo systemctl start pm2-${CURRENT_USER}
        print_status 0 "PM2 systemd service started"
    fi
else
    print_warning "PM2 systemd service not found. Generating..."
    STARTUP_OUTPUT=$(pm2 startup systemd -u $CURRENT_USER --hp $HOME 2>&1)
    STARTUP_CMD=$(echo "$STARTUP_OUTPUT" | grep "sudo" | tail -1)
    
    if [ -n "$STARTUP_CMD" ]; then
        echo ""
        print_warning "Run this command to enable auto-start:"
        echo "   $STARTUP_CMD"
        echo ""
        echo "   Or run: sudo $STARTUP_CMD"
        echo ""
    else
        print_warning "Could not generate startup command automatically"
        echo "   Run manually: pm2 startup"
    fi
fi
echo ""

echo "Step 10: Setting Up Cron-Based Auto-Start..."
echo "-----------------------------------"
# Ensure start-all.sh exists and is executable
if [ ! -f "$APP_DIR/deploy/start-all.sh" ]; then
    print_warning "start-all.sh not found. Creating..."
    cat > "$APP_DIR/deploy/start-all.sh" << 'EOF'
#!/bin/bash
# Start all OptioHire services
export PATH="$PATH:/usr/bin:/usr/local/bin"
cd "$HOME/optiohire"

# Start backend if not running
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    cd "$HOME/optiohire/backend"
    if [ -f "dist/server.js" ]; then
        pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null || true
    fi
fi

# Start frontend if not running
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    cd "$HOME/optiohire/frontend"
    pm2 start npm --name optiohire-frontend -- start 2>/dev/null || true
fi

# Save PM2 state
pm2 save --force 2>/dev/null || true
EOF
    chmod +x "$APP_DIR/deploy/start-all.sh"
    print_status 0 "start-all.sh created"
fi

# Ensure pm2-monitor.sh exists and is executable
if [ ! -f "$APP_DIR/deploy/pm2-monitor.sh" ]; then
    print_warning "pm2-monitor.sh not found. Creating..."
    cat > "$APP_DIR/deploy/pm2-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor and restart PM2 processes if they crash
export PATH="$PATH:/usr/bin:/usr/local/bin"
LOG_FILE="$HOME/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
mkdir -p "$HOME/logs"

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

if ! command -v pm2 &> /dev/null; then
    echo "[$DATE] ⚠️  PM2 not found" >> "$LOG_FILE"
    exit 1
fi

# Check backend
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] ⚠️  Backend not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/backend"
    if [ -f "dist/server.js" ]; then
        pm2 restart optiohire-backend --update-env 2>/dev/null || \
        pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null
        echo "[$DATE] ✅ Backend restarted" >> "$LOG_FILE"
    fi
fi

# Check frontend
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] ⚠️  Frontend not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/frontend"
    pm2 restart optiohire-frontend 2>/dev/null || \
    pm2 start npm --name optiohire-frontend -- start 2>/dev/null
    echo "[$DATE] ✅ Frontend restarted" >> "$LOG_FILE"
fi

pm2 save --force 2>/dev/null || true
EOF
    chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
    print_status 0 "pm2-monitor.sh created"
fi

# Setup @reboot cron job
if crontab -l 2>/dev/null | grep -q "start-all.sh"; then
    print_status 0 "@reboot cron job exists"
else
    print_warning "Adding @reboot cron job..."
    (crontab -l 2>/dev/null | grep -v "@reboot.*start-all.sh"; echo "@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $LOG_DIR/startup.log 2>&1") | crontab -
    print_status 0 "@reboot cron job added"
fi

# Setup monitoring cron job (every 2 minutes)
if crontab -l 2>/dev/null | grep -q "pm2-monitor.sh"; then
    print_status 0 "Monitoring cron job exists"
else
    print_warning "Adding monitoring cron job (every 2 minutes)..."
    (crontab -l 2>/dev/null | grep -v "pm2-monitor.sh"; echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $LOG_DIR/pm2-monitor.log 2>&1") | crontab -
    print_status 0 "Monitoring cron job added"
fi
echo ""

echo "Step 11: Verifying Cron Jobs..."
echo "-----------------------------------"
echo "Current cron jobs:"
crontab -l 2>/dev/null | grep -E "start-all|pm2-monitor" || echo "   No cron jobs found"
echo ""

echo "Step 12: Final Status Check..."
echo "-----------------------------------"
echo "PM2 Processes:"
pm2 list
echo ""

echo "Backend Health:"
curl -s http://localhost:3001/health 2>/dev/null | head -5 || echo "   Backend not responding"
echo ""

echo "Email Reader Status:"
curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "   Email reader endpoint not responding"
echo ""

echo "=========================================="
echo "Diagnostic Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- PM2 processes should be running"
echo "- Auto-start configured (systemd + cron)"
echo "- Monitoring script runs every 2 minutes"
echo "- @reboot script will start services on boot"
echo ""
echo "If backend is still not processing emails:"
echo "1. Check ENABLE_EMAIL_READER=true in backend/.env"
echo "2. Check IMAP credentials are correct"
echo "3. Check backend logs: pm2 logs optiohire-backend"
echo "4. Restart backend: pm2 restart optiohire-backend"
echo ""

