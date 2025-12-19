#!/bin/bash
# Quick fix for auto-start and email reader issues

set -e

echo "=========================================="
echo "Quick Fix: Auto-Start & Email Reader"
echo "=========================================="
echo ""

# Detect app directory
if [ -d "$HOME/optiohire" ]; then
    APP_DIR="$HOME/optiohire"
elif [ -d "/opt/optiohire" ]; then
    APP_DIR="/opt/optiohire"
else
    echo "❌ Could not find optiohire directory"
    exit 1
fi

echo "📁 App directory: $APP_DIR"
cd "$APP_DIR" || exit 1

# Step 1: Ensure backend is built
echo ""
echo "Step 1: Building backend..."
cd backend
if [ ! -f "dist/server.js" ]; then
    echo "   Building backend..."
    npm run build
fi
echo "✅ Backend is built"
echo ""

# Step 2: Ensure email reader is enabled
echo "Step 2: Enabling email reader..."
if [ -f ".env" ]; then
    # Remove any ENABLE_EMAIL_READER=false
    sed -i 's/^ENABLE_EMAIL_READER=false/ENABLE_EMAIL_READER=true/' .env 2>/dev/null || true
    
    # Add if missing
    if ! grep -q "^ENABLE_EMAIL_READER=" .env; then
        echo "" >> .env
        echo "ENABLE_EMAIL_READER=true" >> .env
    fi
    
    echo "✅ Email reader enabled in .env"
else
    echo "⚠️  .env file not found"
fi
echo ""

# Step 3: Start/restart backend with PM2
echo "Step 3: Starting backend with PM2..."
cd "$APP_DIR"

# Use ecosystem config if available
if [ -f "deploy/ecosystem.config.js" ]; then
    # Update ecosystem config path if needed
    CURRENT_DIR=$(pwd)
    sed -i "s|/home/optiohire/optiohire|$CURRENT_DIR|g" deploy/ecosystem.config.js 2>/dev/null || true
    
    pm2 delete optiohire-backend 2>/dev/null || true
    pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env
else
    # Fallback: start directly
    cd backend
    pm2 delete optiohire-backend 2>/dev/null || true
    pm2 start dist/server.js --name optiohire-backend --update-env
fi

sleep 3

# Verify it's running
if pm2 list | grep -q "optiohire-backend.*online"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start. Checking logs..."
    pm2 logs optiohire-backend --lines 20 --nostream
    exit 1
fi
echo ""

# Step 4: Save PM2 state
echo "Step 4: Saving PM2 state..."
pm2 save --force
echo "✅ PM2 state saved"
echo ""

# Step 5: Setup auto-start
echo "Step 5: Setting up auto-start..."

# Ensure scripts exist
if [ ! -f "deploy/start-all.sh" ]; then
    echo "   Creating start-all.sh..."
    cat > deploy/start-all.sh << 'EOFSCRIPT'
#!/bin/bash
export PATH="$PATH:/usr/bin:/usr/local/bin"
cd "$HOME/optiohire" || cd "/opt/optiohire" || exit 1

# Build backend if needed
if [ ! -f "backend/dist/server.js" ]; then
    cd backend && npm run build && cd ..
fi

# Start backend
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    cd backend
    pm2 start dist/server.js --name optiohire-backend --update-env 2>/dev/null || true
fi

# Start frontend
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    cd frontend
    pm2 start npm --name optiohire-frontend -- start 2>/dev/null || true
fi

pm2 save --force 2>/dev/null || true
EOFSCRIPT
    chmod +x deploy/start-all.sh
fi

# Setup cron jobs
(crontab -l 2>/dev/null | grep -v "@reboot.*start-all.sh" | grep -v "pm2-monitor.sh"; \
 echo "@reboot sleep 30 && $APP_DIR/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1"; \
 echo "*/2 * * * * $APP_DIR/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -

echo "✅ Auto-start configured (cron)"
echo ""

# Step 6: Check email reader status
echo "Step 6: Checking email reader status..."
sleep 2
HEALTH=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "FAILED")
if [ "$HEALTH" != "FAILED" ]; then
    echo "   Email reader status: $HEALTH"
    if echo "$HEALTH" | grep -q "enabled.*true"; then
        echo "✅ Email reader is enabled and running"
    else
        echo "⚠️  Email reader may not be enabled"
    fi
else
    echo "⚠️  Could not check email reader status"
fi
echo ""

# Step 7: Show final status
echo "=========================================="
echo "Final Status"
echo "=========================================="
pm2 list
echo ""
echo "Backend logs (last 10 lines):"
pm2 logs optiohire-backend --lines 10 --nostream 2>/dev/null | tail -10 || echo "   Could not read logs"
echo ""
echo "✅ Quick fix complete!"
echo ""
echo "Next steps:"
echo "1. Check if applications are being processed: pm2 logs optiohire-backend --lines 50"
echo "2. Verify email reader: curl http://localhost:3001/health/email-reader"
echo "3. Monitor logs: pm2 logs optiohire-backend"
echo ""

