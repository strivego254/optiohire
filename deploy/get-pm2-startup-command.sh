#!/bin/bash
# Get the PM2 startup command that needs to be run

echo "Getting PM2 startup command..."
echo ""

CURRENT_USER=$(whoami)
HOME_DIR="$HOME"

# Run pm2 startup to get the command
pm2 startup systemd -u $CURRENT_USER --hp $HOME_DIR

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Copy the 'sudo env PATH=...' command shown above"
echo "2. Run it to enable PM2 auto-start on boot"
echo "3. Then run: sudo systemctl enable pm2-${CURRENT_USER}"
echo "4. Verify: systemctl status pm2-${CURRENT_USER}"
echo ""

