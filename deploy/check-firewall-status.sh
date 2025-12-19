#!/bin/bash
# Check firewall and DNS status

echo "=========================================="
echo "🔍 CHECKING FIREWALL & DNS STATUS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Test DNS Resolution
echo "Step 1: Testing DNS resolution..."
echo "----------------------------------------"

echo -n "Testing DNS (google.com)... "
if timeout 3 nslookup google.com > /dev/null 2>&1 || timeout 3 host google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS is working${NC}"
    DNS_OK=true
else
    echo -e "${RED}❌ DNS is NOT working${NC}"
    DNS_OK=false
fi

echo -n "Testing DNS (smtp.gmail.com)... "
if timeout 3 nslookup smtp.gmail.com > /dev/null 2>&1 || timeout 3 host smtp.gmail.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Can resolve smtp.gmail.com${NC}"
    SMTP_DNS_OK=true
else
    echo -e "${RED}❌ Cannot resolve smtp.gmail.com${NC}"
    SMTP_DNS_OK=false
fi

echo ""

# Step 2: Test Port Connectivity (using IP if DNS fails)
echo "Step 2: Testing SMTP port connectivity..."
echo "----------------------------------------"

# Get Gmail SMTP IP (if DNS works)
if [ "$SMTP_DNS_OK" = true ]; then
    SMTP_IP=$(getent hosts smtp.gmail.com | awk '{print $1}' | head -1)
    echo "Gmail SMTP IP: $SMTP_IP"
else
    # Use known Gmail SMTP IPs
    SMTP_IP="74.125.28.108"  # One of Gmail's SMTP IPs
    echo "Using fallback IP: $SMTP_IP (DNS not working)"
fi

echo ""

# Test port 465
echo -n "Testing port 465 to $SMTP_IP... "
if timeout 5 bash -c "echo > /dev/tcp/$SMTP_IP/465" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 465 is accessible${NC}"
    PORT_465_OK=true
else
    echo -e "${RED}❌ Port 465 is BLOCKED${NC}"
    PORT_465_OK=false
fi

# Test port 587
echo -n "Testing port 587 to $SMTP_IP... "
if timeout 5 bash -c "echo > /dev/tcp/$SMTP_IP/587" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 587 is accessible${NC}"
    PORT_587_OK=true
else
    echo -e "${RED}❌ Port 587 is BLOCKED${NC}"
    PORT_587_OK=false
fi

echo ""

# Step 3: Check UFW Status
echo "Step 3: Checking UFW firewall..."
echo "----------------------------------------"
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

# Step 4: Summary and Recommendations
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

if [ "$DNS_OK" = false ]; then
    echo -e "${RED}❌ CRITICAL: DNS is not working${NC}"
    echo ""
    echo "The firewall may be blocking DNS (port 53)."
    echo ""
    echo "In DigitalOcean firewall, add OUTBOUND rule:"
    echo "  - Type: Custom"
    echo "  - Protocol: UDP"
    echo "  - Port Range: 53"
    echo "  - Destination: All IPv4"
    echo "  - Description: DNS"
    echo ""
    echo "Also add:"
    echo "  - Type: Custom"
    echo "  - Protocol: TCP"
    echo "  - Port Range: 53"
    echo "  - Destination: All IPv4"
    echo "  - Description: DNS TCP"
    echo ""
fi

if [ "$PORT_465_OK" = false ] || [ "$PORT_587_OK" = false ]; then
    echo -e "${RED}❌ SMTP ports are still blocked${NC}"
    echo ""
    echo "Make sure:"
    echo "1. ✅ Firewall is CREATED in DigitalOcean dashboard"
    echo "2. ✅ OUTBOUND rules for ports 465 and 587 are added"
    echo "3. ⚠️  Firewall is APPLIED to your droplet (most important!)"
    echo "4. ⚠️  Wait 2-3 minutes for changes to propagate"
    echo ""
    echo "To apply firewall to droplet:"
    echo "1. Go to: https://cloud.digitalocean.com/networking/firewalls"
    echo "2. Click on your 'OptioHire' firewall"
    echo "3. Click 'Edit' or scroll to 'Apply to Droplets'"
    echo "4. Select your droplet and save"
    echo ""
fi

if [ "$DNS_OK" = true ] && [ "$PORT_465_OK" = true ] && [ "$PORT_587_OK" = true ]; then
    echo -e "${GREEN}✅ Everything is working!${NC}"
    echo ""
    echo "DNS: ✅"
    echo "Port 465: ✅"
    echo "Port 587: ✅"
    echo ""
    echo "SMTP should work now. Restart backend:"
    echo "  pm2 restart optiohire-backend --update-env"
fi

echo ""

