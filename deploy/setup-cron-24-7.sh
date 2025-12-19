#!/bin/bash
# Setup 24/7 auto-start using Cron (Primary Method)
# This ensures the backend runs continuously using Cron + PM2

set -e

echo "=========================================="
echo "Setting Up 24/7 Auto-Start with Cron"
echo "=========================================="
echo ""

# Detect app directory
if [ -d "$HOME/optiohire" ]; then
    APP_DIR="$HOME/optiohire"
elif [ -d "/opt/optiohire" ]; then
    APP_DIR="/opt/optiohire"
else
    echo "❌ Could not find optiohire directory"
    echo "   Please run this from the optiohire directory or set APP_DIR"
    exit 1
fi

CURRENT_USER=$(whoami)
LOG_DIR="$HOME/logs"
mkdir -p "$LOG_DIR"

echo "📁 App directory: $APP_DIR"
echo "👤 User: $CURRENT_USER"
echo ""

# Step 1: Ensure backend is built
echo "Step 1: Building backend..."
echo "-----------------------------------"
cd "$APP_DIR/backend" || exit 1

if [ ! -f "dist/server.js" ]; then
    echo "   Building backend..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Backend build failed"
        exit 1
    fi
fi
echo "✅ Backend is built"
echo ""

# Step 2: Ensure email reader is enabled
echo "Step 2: Configuring email reader..."
echo "-----------------------------------"
if [ -f ".env" ]; then
    # Enable email reader
    sed -i 's/^ENABLE_EMAIL_READER=false/ENABLE_EMAIL_READER=true/' .env 2>/dev/null || true
    
    if ! grep -q "^ENABLE_EMAIL_READER=" .env; then
        echo "" >> .env
        echo "# Email Reader Configuration" >> .env
        echo "ENABLE_EMAIL_READER=true" >> .env
    fi
    
    # Set polling interval to 1 second for real-time processing
    if ! grep -q "^IMAP_POLL_MS=" .env; then
        echo "IMAP_POLL_MS=1000" >> .env
    else
        sed -i 's/^IMAP_POLL_MS=.*/IMAP_POLL_MS=1000/' .env
    fi
    
    echo "✅ Email reader configured"
else
    echo "⚠️  .env file not found"
fi
echo ""

# Step 3: Create/Update startup script
echo "Step 3: Creating startup script..."
echo "-----------------------------------"
cat > "$APP_DIR/deploy/start-all.sh" << 'EOF'
#!/bin/bash
# Start all OptioHire services using PM2
# This script is called on boot (@reboot) and by the monitor

export PATH="$PATH:/usr/bin:/usr/local/bin"
export NODE_ENV=production

# Detect app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR" || exit 1

# Ensure logs directory exists
mkdir -p "$HOME/logs"

LOG_FILE="$HOME/logs/startup.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$DATE] Starting OptioHire services..." >> "$LOG_FILE"

# Ensure backend is built
if [ ! -f "$APP_DIR/backend/dist/server.js" ]; then
    echo "[$DATE] Building backend..." >> "$LOG_FILE"
    cd "$APP_DIR/backend"
    npm run build >> "$LOG_FILE" 2>&1
    cd "$APP_DIR"
fi

# Ensure email reader is enabled
if [ -f "$APP_DIR/backend/.env" ]; then
    # Enable email reader if not already enabled
    if ! grep -q "^ENABLE_EMAIL_READER=true" "$APP_DIR/backend/.env"; then
        sed -i 's/^ENABLE_EMAIL_READER=false/ENABLE_EMAIL_READER=true/' "$APP_DIR/backend/.env" 2>/dev/null || true
        if ! grep -q "^ENABLE_EMAIL_READER=" "$APP_DIR/backend/.env"; then
            echo "" >> "$APP_DIR/backend/.env"
            echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
        fi
    fi
fi

# Start backend if not running
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] Starting backend..." >> "$LOG_FILE"
    cd "$APP_DIR/backend"
    
    # Try using ecosystem config first
    if [ -f "$APP_DIR/deploy/ecosystem.config.js" ]; then
        # Update paths in ecosystem config if needed
        CURRENT_DIR="$APP_DIR"
        sed -i "s|/home/optiohire/optiohire|$CURRENT_DIR|g" "$APP_DIR/deploy/ecosystem.config.js" 2>/dev/null || true
        sed -i "s|/opt/optiohire|$CURRENT_DIR|g" "$APP_DIR/deploy/ecosystem.config.js" 2>/dev/null || true
        
        pm2 start "$APP_DIR/deploy/ecosystem.config.js" --only optiohire-backend --update-env >> "$LOG_FILE" 2>&1 || \
        pm2 start dist/server.js --name optiohire-backend --update-env >> "$LOG_FILE" 2>&1
    else
        pm2 start dist/server.js --name optiohire-backend --update-env >> "$LOG_FILE" 2>&1
    fi
    
    echo "[$DATE] Backend started" >> "$LOG_FILE"
else
    echo "[$DATE] Backend already running" >> "$LOG_FILE"
fi

# Start frontend if not running
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] Starting frontend..." >> "$LOG_FILE"
    cd "$APP_DIR/frontend"
    
    if [ -f "$APP_DIR/deploy/ecosystem.config.js" ]; then
        pm2 start "$APP_DIR/deploy/ecosystem.config.js" --only optiohire-frontend >> "$LOG_FILE" 2>&1 || \
        pm2 start npm --name optiohire-frontend -- start >> "$LOG_FILE" 2>&1
    else
        pm2 start npm --name optiohire-frontend -- start >> "$LOG_FILE" 2>&1
    fi
    
    echo "[$DATE] Frontend started" >> "$LOG_FILE"
else
    echo "[$DATE] Frontend already running" >> "$LOG_FILE"
fi

# Save PM2 state
pm2 save --force >> "$LOG_FILE" 2>&1 || true

DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$DATE] ✅ All services started" >> "$LOG_FILE"
EOF

chmod +x "$APP_DIR/deploy/start-all.sh"
echo "✅ Startup script created: $APP_DIR/deploy/start-all.sh"
echo ""

# Step 4: Create/Update monitoring script
echo "Step 4: Creating monitoring script..."
echo "-----------------------------------"
cat > "$APP_DIR/deploy/pm2-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor and restart PM2 processes if they crash
# This script runs every 2 minutes via cron to ensure 24/7 operation

export PATH="$PATH:/usr/bin:/usr/local/bin"
export NODE_ENV=production

LOG_FILE="$HOME/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
mkdir -p "$HOME/logs"

# Detect app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo "[$DATE] ❌ PM2 not found in PATH" >> "$LOG_FILE"
    exit 1
fi

# Check backend
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] ⚠️  Backend is not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/backend"
    
    if [ -f "dist/server.js" ]; then
        # Try restart first, then start if not found
        pm2 restart optiohire-backend --update-env >> "$LOG_FILE" 2>&1 || \
        pm2 start dist/server.js --name optiohire-backend --update-env >> "$LOG_FILE" 2>&1
        
        sleep 2
        
        if pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
            echo "[$DATE] ✅ Backend restarted successfully" >> "$LOG_FILE"
        else
            echo "[$DATE] ❌ Backend failed to start" >> "$LOG_FILE"
        fi
    else
        echo "[$DATE] ❌ Backend dist/server.js not found" >> "$LOG_FILE"
    fi
fi

# Check frontend
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] ⚠️  Frontend is not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/frontend"
    
    pm2 restart optiohire-frontend >> "$LOG_FILE" 2>&1 || \
    pm2 start npm --name optiohire-frontend -- start >> "$LOG_FILE" 2>&1
    
    sleep 2
    
    if pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
        echo "[$DATE] ✅ Frontend restarted successfully" >> "$LOG_FILE"
    else
        echo "[$DATE] ❌ Frontend failed to start" >> "$LOG_FILE"
    fi
fi

# Save PM2 state periodically (every 10th run, ~20 minutes)
RANDOM_CHECK=$((RANDOM % 10))
if [ $RANDOM_CHECK -eq 0 ]; then
    pm2 save --force >> "$LOG_FILE" 2>&1 || true
fi
EOF

chmod +x "$APP_DIR/deploy/pm2-monitor.sh"
echo "✅ Monitoring script created: $APP_DIR/deploy/pm2-monitor.sh"
echo ""

# Step 5: Setup Cron Jobs
echo "Step 5: Setting up Cron jobs..."
echo "-----------------------------------"

# Remove any existing optiohire cron jobs
TEMP_CRON=$(mktemp)
crontab -l 2>/dev/null | grep -v "optiohire" | grep -v "start-all.sh" | grep -v "pm2-monitor.sh" > "$TEMP_CRON" || true

# Add @reboot job (starts 30 seconds after boot to ensure system is ready)
echo "@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $LOG_DIR/startup.log 2>&1" >> "$TEMP_CRON"

# Add monitoring job (runs every 2 minutes)
echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $LOG_DIR/pm2-monitor.log 2>&1" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✅ Cron jobs installed:"
echo "   - @reboot: Starts services 30 seconds after boot"
echo "   - */2 * * * *: Monitors and restarts every 2 minutes"
echo ""

# Step 6: Verify Cron Jobs
echo "Step 6: Verifying Cron jobs..."
echo "-----------------------------------"
echo "Current cron jobs:"
crontab -l | grep -E "start-all|pm2-monitor" || echo "   No cron jobs found (this shouldn't happen)"
echo ""

# Step 7: Start services now (don't wait for reboot)
echo "Step 7: Starting services now..."
echo "-----------------------------------"
"$APP_DIR/deploy/start-all.sh"
sleep 3
echo ""

# Step 8: Verify everything is running
echo "Step 8: Verifying services..."
echo "-----------------------------------"
echo "PM2 Status:"
pm2 list
echo ""

echo "Backend Health:"
BACKEND_HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null || echo "FAILED")
if [ "$BACKEND_HEALTH" != "FAILED" ]; then
    echo "   ✅ Backend is responding"
else
    echo "   ⚠️  Backend not responding (may need a moment to start)"
fi
echo ""

echo "Email Reader Status:"
EMAIL_READER_STATUS=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "FAILED")
if [ "$EMAIL_READER_STATUS" != "FAILED" ]; then
    echo "   Response: $EMAIL_READER_STATUS"
    if echo "$EMAIL_READER_STATUS" | grep -q "enabled.*true"; then
        echo "   ✅ Email reader is enabled"
    else
        echo "   ⚠️  Email reader may not be enabled"
    fi
else
    echo "   ⚠️  Could not check email reader status"
fi
echo ""

# Step 9: Save PM2 state
echo "Step 9: Saving PM2 state..."
echo "-----------------------------------"
pm2 save --force
echo "✅ PM2 state saved"
echo ""

echo "=========================================="
echo "✅ 24/7 Auto-Start Setup Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ Startup script: $APP_DIR/deploy/start-all.sh"
echo "✅ Monitoring script: $APP_DIR/deploy/pm2-monitor.sh"
echo "✅ @reboot cron job: Starts services on boot"
echo "✅ Monitoring cron job: Checks every 2 minutes"
echo "✅ PM2 state saved"
echo ""
echo "How it works:"
echo "------------"
echo "1. On server boot: Cron runs start-all.sh after 30 seconds"
echo "2. Every 2 minutes: Cron runs pm2-monitor.sh to check processes"
echo "3. If backend/frontend crash: pm2-monitor.sh restarts them"
echo "4. PM2 handles: Process management, logging, auto-restart on crash"
echo ""
echo "Logs:"
echo "-----"
echo "Startup logs: $LOG_DIR/startup.log"
echo "Monitor logs: $LOG_DIR/pm2-monitor.log"
echo "PM2 logs: pm2 logs optiohire-backend"
echo ""
echo "Commands:"
echo "---------"
echo "View PM2 status: pm2 list"
echo "View logs: pm2 logs optiohire-backend"
echo "Check cron jobs: crontab -l"
echo "View startup log: tail -f $LOG_DIR/startup.log"
echo "View monitor log: tail -f $LOG_DIR/pm2-monitor.log"
echo ""
echo "✅ Your backend will now run 24/7 automatically!"
echo ""

