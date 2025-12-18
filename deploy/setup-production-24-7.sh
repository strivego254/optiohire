#!/bin/bash
# Comprehensive Production Setup for 24/7 Operation
# This script ensures everything runs automatically without manual intervention

set -e

echo "=========================================="
echo "OptioHire Production 24/7 Setup"
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

echo "Step 1: Ensuring backend is built..."
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

echo "Step 2: Configuring backend .env for email reader..."
echo "-----------------------------------"
cd backend || exit 1
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Ensure ENABLE_EMAIL_READER is enabled
if grep -q "^ENABLE_EMAIL_READER=false" .env; then
    echo "Enabling email reader..."
    sed -i 's/^ENABLE_EMAIL_READER=false/# ENABLE_EMAIL_READER=false/' .env
fi

if ! grep -q "^ENABLE_EMAIL_READER" .env; then
    echo "" >> .env
    echo "# Email Reader Configuration" >> .env
    echo "ENABLE_EMAIL_READER=true" >> .env
fi

# Ensure IMAP_POLL_MS is set to 1000 (1 second)
if ! grep -q "^IMAP_POLL_MS=" .env; then
    echo "IMAP_POLL_MS=1000" >> .env
elif grep -q "^IMAP_POLL_MS=10000" .env; then
    sed -i 's/^IMAP_POLL_MS=10000/IMAP_POLL_MS=1000/' .env
fi

echo -e "${GREEN}✅ Email reader configuration updated${NC}"
cd "$APP_DIR" || exit 1
echo ""

echo "Step 3: Setting up PM2 processes..."
echo "-----------------------------------"
# Ensure PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop existing processes
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# Start using ecosystem config
if [ -f "$APP_DIR/deploy/ecosystem.config.js" ]; then
    pm2 start "$APP_DIR/deploy/ecosystem.config.js" --update-env
    echo -e "${GREEN}✅ PM2 processes started${NC}"
else
    echo -e "${RED}❌ ecosystem.config.js not found!${NC}"
    exit 1
fi

# Save PM2 state
pm2 save --force
echo ""

echo "Step 4: Setting up auto-start on reboot (cron method)..."
echo "-----------------------------------"
# Create logs directory
mkdir -p "$HOME/logs"

# Create/update start-all.sh
cat > "$APP_DIR/deploy/start-all.sh" << 'EOF'
#!/bin/bash
# Start all OptioHire services using PM2 ecosystem config
# This script is called on boot and by the monitor

export PATH="$PATH:/usr/bin:/usr/local/bin"
export NODE_ENV=production

# Get app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR" || exit 1

# Ensure logs directory exists
mkdir -p "$HOME/logs"

# Ensure backend is built
if [ ! -f "$APP_DIR/backend/dist/server.js" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building backend..."
    cd "$APP_DIR/backend"
    npm install --production=false
    npm run build
    cd "$APP_DIR"
fi

# Ensure email reader is enabled in backend .env
if [ -f "$APP_DIR/backend/.env" ]; then
    # Remove any ENABLE_EMAIL_READER=false
    sed -i 's/^ENABLE_EMAIL_READER=false/# ENABLE_EMAIL_READER=false/' "$APP_DIR/backend/.env" 2>/dev/null || true
    
    # Ensure ENABLE_EMAIL_READER is set (add if missing)
    if ! grep -q "^ENABLE_EMAIL_READER" "$APP_DIR/backend/.env"; then
        echo "" >> "$APP_DIR/backend/.env"
        echo "# Email Reader Configuration" >> "$APP_DIR/backend/.env"
        echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
    fi
    
    # Ensure IMAP_POLL_MS is set to 1000 (1 second)
    if ! grep -q "^IMAP_POLL_MS=" "$APP_DIR/backend/.env"; then
        echo "IMAP_POLL_MS=1000" >> "$APP_DIR/backend/.env"
    elif grep -q "^IMAP_POLL_MS=10000" "$APP_DIR/backend/.env"; then
        sed -i 's/^IMAP_POLL_MS=10000/IMAP_POLL_MS=1000/' "$APP_DIR/backend/.env"
    fi
fi

# Start services using PM2 ecosystem config
if [ -f "$APP_DIR/deploy/ecosystem.config.js" ]; then
    # Use ecosystem config (recommended)
    pm2 start "$APP_DIR/deploy/ecosystem.config.js" --update-env 2>/dev/null || pm2 restart ecosystem.config.js --update-env 2>/dev/null || true
else
    # Fallback: start manually
    # Start backend if not running
    if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
        cd "$APP_DIR/backend"
        if [ -f "dist/server.js" ]; then
            pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null || true
        fi
    fi
    
    # Start frontend if not running
    if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
        cd "$APP_DIR/frontend"
        pm2 start npm --name optiohire-frontend -- start 2>/dev/null || true
    fi
fi

# Save PM2 state
pm2 save --force 2>/dev/null || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Services started"
EOF

chmod +x "$APP_DIR/deploy/start-all.sh"
echo -e "${GREEN}✅ Startup script created${NC}"

# Create/update pm2-monitor.sh
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
    APP_DIR="$HOME/optiohire"
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="/opt/optiohire"
    fi
    cd "$APP_DIR/backend"
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
    APP_DIR="$HOME/optiohire"
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="/opt/optiohire"
    fi
    cd "$APP_DIR/frontend"
    pm2 restart optiohire-frontend 2>/dev/null || pm2 start npm --name optiohire-frontend -- start 2>/dev/null
    echo "[$DATE] ✅ Frontend restarted" >> "$LOG_FILE"
fi

# Save PM2 state periodically
pm2 save --force 2>/dev/null || true
EOF

chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
echo -e "${GREEN}✅ Monitor script created${NC}"

# Setup cron jobs
echo "Setting up cron jobs..."
# Remove existing cron jobs for optiohire
(crontab -l 2>/dev/null | grep -v "@reboot.*optiohire" | grep -v "@reboot.*start-all.sh" | grep -v "pm2-monitor.sh"; cat << EOF
@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1
*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1
EOF
) | crontab -

echo -e "${GREEN}✅ Cron jobs configured${NC}"
echo ""

echo "Step 5: Verifying setup..."
echo "-----------------------------------"
sleep 3

echo "PM2 Status:"
pm2 list
echo ""

echo "Email Reader Health:"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>&1)
if [ $? -eq 0 ]; then
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠️  Backend not responding yet (may need a few more seconds)${NC}"
fi
echo ""

echo "Cron Jobs:"
crontab -l | grep -E "optiohire|start-all|pm2-monitor" || echo "No cron jobs found"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Production 24/7 Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application is now configured for 24/7 operation:"
echo "  ✅ Backend runs automatically"
echo "  ✅ Frontend runs automatically"
echo "  ✅ Email reader processes applications every 1 second"
echo "  ✅ Auto-starts on server reboot"
echo "  ✅ Auto-restarts if processes crash"
echo "  ✅ Email notifications sent to shortlisted/rejected candidates"
echo ""
echo "To verify everything is working:"
echo "  1. Check PM2: pm2 list"
echo "  2. Check email reader: curl http://localhost:3001/health/email-reader"
echo "  3. Check logs: pm2 logs optiohire-backend"
echo "  4. Monitor cron: tail -f ~/logs/pm2-monitor.log"
echo ""

