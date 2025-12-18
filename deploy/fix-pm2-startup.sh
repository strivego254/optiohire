#!/bin/bash
# Fix PM2 startup service issues

set -e

CURRENT_USER=$(whoami)
echo "=========================================="
echo "Fixing PM2 Startup Service"
echo "=========================================="
echo ""

# Step 1: Check current service status
echo "Step 1: Checking current service status..."
sudo systemctl status pm2-${CURRENT_USER}.service --no-pager -l | head -20 || true
echo ""

# Step 2: Check service logs
echo "Step 2: Checking service logs..."
sudo journalctl -u pm2-${CURRENT_USER}.service --no-pager -n 20 || true
echo ""

# Step 3: Stop the service if it's in a bad state
echo "Step 3: Stopping service (if running)..."
sudo systemctl stop pm2-${CURRENT_USER}.service 2>/dev/null || true
echo ""

# Step 4: Regenerate PM2 startup
echo "Step 4: Regenerating PM2 startup configuration..."
pm2 kill 2>/dev/null || true
pm2 save --force
echo ""

# Step 5: Get the startup command
echo "Step 5: Generating new startup command..."
echo "⚠️  Run this command (it will be shown below):"
echo ""
pm2 startup systemd -u $CURRENT_USER --hp $HOME
echo ""
echo "⚠️  Copy the command shown above and run it with sudo"
echo ""

# Step 6: Alternative - manually fix the service file
echo "Step 6: Checking service file location..."
if [ -f "/etc/systemd/system/pm2-${CURRENT_USER}.service" ]; then
    echo "✅ Service file exists at /etc/systemd/system/pm2-${CURRENT_USER}.service"
    echo ""
    echo "Current service file content:"
    sudo cat /etc/systemd/system/pm2-${CURRENT_USER}.service
    echo ""
else
    echo "⚠️  Service file not found"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Run: pm2 startup systemd -u $CURRENT_USER --hp $HOME"
echo "2. Copy the command it shows"
echo "3. Run that command with sudo"
echo "4. Then run: sudo systemctl daemon-reload"
echo "5. Then run: sudo systemctl enable pm2-${CURRENT_USER}.service"
echo "6. Then run: sudo systemctl start pm2-${CURRENT_USER}.service"
echo "7. Verify with: sudo systemctl status pm2-${CURRENT_USER}.service"
echo ""

