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

