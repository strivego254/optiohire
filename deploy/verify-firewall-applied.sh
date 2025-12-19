#!/bin/bash
# Verify firewall is applied and troubleshoot

echo "=========================================="
echo "🔍 VERIFYING FIREWALL STATUS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "✅ DNS is working (smtp.gmail.com resolved)"
echo "❌ SMTP ports 465 and 587 are still blocked"
echo ""
echo "This usually means:"
echo "1. Firewall is not applied to your droplet"
echo "2. Firewall changes haven't propagated yet (wait longer)"
echo "3. There's another firewall blocking (check UFW)"
echo ""

# Check UFW
echo "Checking UFW firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 || echo "inactive")
    echo "UFW Status: $UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo ""
        echo "UFW rules for SMTP:"
        sudo ufw status | grep -E "465|587" || echo "  No SMTP rules in UFW"
    fi
else
    echo "UFW not installed"
fi

echo ""
echo "=========================================="
echo "🔧 TROUBLESHOOTING STEPS"
echo "=========================================="
echo ""

echo "Step 1: Verify Firewall is Applied to Droplet"
echo "----------------------------------------"
echo "Go to DigitalOcean dashboard:"
echo "1. https://cloud.digitalocean.com/networking/firewalls"
echo "2. Click on your 'OptioHire' firewall"
echo "3. Scroll to 'Apply to Droplets' section"
echo "4. Verify your droplet is listed there"
echo ""
echo "If droplet is NOT listed:"
echo "  - Click 'Edit' button"
echo "  - Scroll to 'Apply to Droplets'"
echo "  - Search for your droplet name"
echo "  - Select it and click 'Save'"
echo ""

echo "Step 2: Wait Longer"
echo "----------------------------------------"
echo "Firewall changes can take 3-5 minutes to propagate."
echo "If you just applied the firewall, wait 3-5 minutes and test again."
echo ""

echo "Step 3: Test Using Direct IP"
echo "----------------------------------------"
echo "Let's test using the IP address directly (bypasses DNS):"
SMTP_IP="172.253.63.108"  # From your DNS lookup
echo "Testing port 465 to $SMTP_IP..."
if timeout 5 bash -c "echo > /dev/tcp/$SMTP_IP/465" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 465 works with direct IP!${NC}"
    echo "This means firewall rules are correct, just need to wait for propagation."
else
    echo -e "${RED}❌ Port 465 still blocked even with direct IP${NC}"
    echo "Firewall is definitely not applied or not working."
fi

echo ""
echo "Testing port 587 to $SMTP_IP..."
if timeout 5 bash -c "echo > /dev/tcp/$SMTP_IP/587" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 587 works with direct IP!${NC}"
    echo "This means firewall rules are correct, just need to wait for propagation."
else
    echo -e "${RED}❌ Port 587 still blocked even with direct IP${NC}"
    echo "Firewall is definitely not applied or not working."
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Verify firewall is applied to droplet (most important!)"
echo "2. Wait 3-5 minutes after applying"
echo "3. Run this test again:"
echo "   timeout 5 bash -c \"echo > /dev/tcp/smtp.gmail.com/465\" && echo '✅ Works' || echo '❌ Blocked'"
echo ""

