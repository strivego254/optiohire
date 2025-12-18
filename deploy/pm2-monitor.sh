#!/bin/bash
# Monitor and restart PM2 processes if they crash
# This ensures 24/7 operation even if processes fail

export PATH="$PATH:/usr/bin:/usr/local/bin"
LOG_FILE="$HOME/logs/pm2-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure log directory exists
mkdir -p "$HOME/logs"

# Get app directory
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    echo "[$DATE] ⚠️  PM2 not found in PATH" >> "$LOG_FILE"
    exit 1
fi

# Check if backend is running
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] ⚠️  Backend is not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/backend"
    if [ -f "dist/server.js" ]; then
        pm2 restart optiohire-backend --update-env 2>/dev/null || pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null
        echo "[$DATE] ✅ Backend restarted" >> "$LOG_FILE"
    else
        echo "[$DATE] ❌ Backend dist/server.js not found" >> "$LOG_FILE"
    fi
fi

# Check if frontend is running
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] ⚠️  Frontend is not running, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR/frontend"
    pm2 restart optiohire-frontend 2>/dev/null || pm2 start npm --name optiohire-frontend -- start 2>/dev/null
    echo "[$DATE] ✅ Frontend restarted" >> "$LOG_FILE"
fi

# Save PM2 state periodically
pm2 save --force 2>/dev/null || true

