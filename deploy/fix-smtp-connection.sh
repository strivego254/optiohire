#!/bin/bash
# Fix SMTP Connection Timeout Issue
# This script diagnoses and fixes SMTP connectivity problems

set -e

echo "=========================================="
echo "🔧 FIXING SMTP CONNECTION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Test SMTP Port Connectivity
echo "Step 1: Testing SMTP port connectivity..."
echo "----------------------------------------"

# Test port 465 (SSL)
echo -n "Testing port 465 (SSL) to smtp.gmail.com... "
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/465" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 465 is accessible${NC}"
    PORT_465_OK=true
else
    echo -e "${RED}❌ Port 465 is BLOCKED${NC}"
    PORT_465_OK=false
fi

# Test port 587 (TLS)
echo -n "Testing port 587 (TLS) to smtp.gmail.com... "
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/587" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 587 is accessible${NC}"
    PORT_587_OK=true
else
    echo -e "${RED}❌ Port 587 is BLOCKED${NC}"
    PORT_587_OK=false
fi

echo ""

# Step 2: Check UFW Firewall Rules
echo "Step 2: Checking UFW firewall rules..."
echo "----------------------------------------"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 || echo "inactive")
    echo "UFW Status: $UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo ""
        echo "Current UFW rules for SMTP:"
        sudo ufw status | grep -E "465|587|smtp" || echo "  No SMTP rules found"
        
        if [ "$PORT_465_OK" = false ] || [ "$PORT_587_OK" = false ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Adding UFW rules to allow SMTP outbound traffic...${NC}"
            echo "Run these commands:"
            echo "  sudo ufw allow out 465/tcp"
            echo "  sudo ufw allow out 587/tcp"
            echo "  sudo ufw reload"
        fi
    else
        echo -e "${GREEN}✅ UFW is inactive (not blocking)${NC}"
    fi
else
    echo "UFW not installed"
fi
echo ""

# Step 3: Check DigitalOcean Firewall
echo "Step 3: DigitalOcean Firewall Configuration"
echo "----------------------------------------"
echo -e "${YELLOW}⚠️  IMPORTANT: DigitalOcean Firewall must allow outbound SMTP${NC}"
echo ""
echo "You need to configure this in the DigitalOcean dashboard:"
echo "1. Go to: https://cloud.digitalocean.com/networking/firewalls"
echo "2. Find your server's firewall"
echo "3. Add OUTBOUND rules:"
echo "   - Type: Custom"
echo "   - Protocol: TCP"
echo "   - Port Range: 465"
echo "   - Destination: All IPv4"
echo ""
echo "   - Type: Custom"
echo "   - Protocol: TCP"
echo "   - Port Range: 587"
echo "   - Destination: All IPv4"
echo ""
echo "4. Save the firewall rules"
echo ""

# Step 4: Try Alternative Port (587 instead of 465)
echo "Step 4: Updating email service configuration..."
echo "----------------------------------------"
APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

if [ -f "$APP_DIR/backend/.env" ]; then
    # Check current port
    CURRENT_PORT=$(grep "^MAIL_PORT\|^SMTP_PORT" "$APP_DIR/backend/.env" | head -1 | cut -d'=' -f2 | tr -d ' ' || echo "465")
    
    if [ "$PORT_465_OK" = false ] && [ "$PORT_587_OK" = true ]; then
        echo -e "${YELLOW}⚠️  Port 465 is blocked, but 587 works. Switching to port 587...${NC}"
        
        # Update .env to use port 587
        if grep -q "^MAIL_PORT=" "$APP_DIR/backend/.env"; then
            sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' "$APP_DIR/backend/.env"
        elif grep -q "^SMTP_PORT=" "$APP_DIR/backend/.env"; then
            sed -i 's/^SMTP_PORT=.*/SMTP_PORT=587/' "$APP_DIR/backend/.env"
        else
            echo "MAIL_PORT=587" >> "$APP_DIR/backend/.env"
        fi
        
        echo -e "${GREEN}✅ Updated to use port 587 (TLS)${NC}"
    elif [ "$PORT_465_OK" = true ]; then
        echo -e "${GREEN}✅ Port 465 is accessible, keeping current configuration${NC}"
    else
        echo -e "${RED}❌ Both ports are blocked. You MUST configure firewall rules.${NC}"
    fi
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
fi
echo ""

# Step 5: Verify SMTP Credentials
echo "Step 5: Verifying SMTP credentials..."
echo "----------------------------------------"
if [ -f "$APP_DIR/backend/.env" ]; then
    MAIL_USER=$(grep "^MAIL_USER\|^SMTP_USER" "$APP_DIR/backend/.env" | head -1 | cut -d'=' -f2 | tr -d ' ' || echo "")
    MAIL_PASS=$(grep "^MAIL_PASS\|^SMTP_PASS" "$APP_DIR/backend/.env" | head -1 | cut -d'=' -f2 | tr -d ' ' || echo "")
    
    if [ -z "$MAIL_USER" ] || [ -z "$MAIL_PASS" ]; then
        echo -e "${RED}❌ SMTP credentials not configured${NC}"
        echo ""
        echo "Please add to backend/.env:"
        echo "  MAIL_USER=your-email@gmail.com"
        echo "  MAIL_PASS=your-app-password"
        echo ""
        echo "For Gmail, you MUST use an App Password (not your regular password):"
        echo "1. Enable 2-Step Verification: https://myaccount.google.com/security"
        echo "2. Generate App Password: https://myaccount.google.com/apppasswords"
        echo "3. Select 'Mail' and your device"
        echo "4. Copy the 16-character password"
        echo "5. Set MAIL_PASS to that password"
    else
        echo -e "${GREEN}✅ SMTP credentials are configured${NC}"
        echo "  User: ${MAIL_USER:0:10}***"
        
        # Check if it looks like an app password (16 chars, with or without spaces)
        if [ -n "$MAIL_PASS" ]; then
            # Remove spaces and check length
            PASS_NO_SPACES=$(echo "$MAIL_PASS" | tr -d ' ')
            PASS_LEN=${#PASS_NO_SPACES}
            
            if [ "$PASS_LEN" -eq 16 ]; then
                echo -e "${GREEN}✅ Password format looks like Gmail App Password (16 characters)${NC}"
            else
                echo -e "${YELLOW}⚠️  Password doesn't look like a Gmail App Password${NC}"
                echo "   Gmail App Passwords are 16 characters (format: xxxx xxxx xxxx xxxx)"
                echo "   Current length: $PASS_LEN characters"
                echo "   If you're using your regular password, it won't work!"
            fi
        fi
    fi
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
fi
echo ""

# Step 6: Test SMTP Connection (if credentials are available)
echo "Step 6: Testing SMTP connection..."
echo "----------------------------------------"
if [ -f "$APP_DIR/backend/.env" ] && [ ! -z "$MAIL_USER" ] && [ ! -z "$MAIL_PASS" ]; then
    cd "$APP_DIR/backend"
    
    # Create a test script
    cat > /tmp/test-smtp.js << 'TEST_EOF'
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS;
const mailPort = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '465', 10);
const useSecure = mailPort === 465;

console.log(`Testing SMTP connection to ${mailHost}:${mailPort}...`);
console.log(`User: ${mailUser}`);
console.log(`Secure: ${useSecure}`);

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: useSecure,
  auth: {
    user: mailUser,
    pass: mailPass
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SMTP connection failed:');
    console.error(error.message);
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\nThis is a network/firewall issue. Check:');
      console.error('1. UFW firewall rules (sudo ufw allow out 465/tcp)');
      console.error('2. DigitalOcean firewall settings');
      console.error('3. Network connectivity');
    } else if (error.responseCode === 530 || error.message.includes('Authentication')) {
      console.error('\nThis is an authentication issue. Check:');
      console.error('1. You are using a Gmail App Password (not regular password)');
      console.error('2. 2-Step Verification is enabled');
      console.error('3. App Password is correct');
    }
    process.exit(1);
  });
TEST_EOF

    if node /tmp/test-smtp.js 2>&1; then
        echo -e "${GREEN}✅ SMTP connection test PASSED${NC}"
    else
        echo -e "${RED}❌ SMTP connection test FAILED${NC}"
    fi
    
    rm -f /tmp/test-smtp.js
else
    echo "Skipping test (credentials not configured)"
fi
echo ""

# Step 7: Restart Backend
echo "Step 7: Restarting backend to apply changes..."
echo "----------------------------------------"
pm2 restart optiohire-backend --update-env
sleep 3

if pm2 list | grep -q "optiohire-backend.*online"; then
    echo -e "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "${RED}❌ Backend failed to restart${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary & Next Steps"
echo "=========================================="
echo ""

if [ "$PORT_465_OK" = false ] && [ "$PORT_587_OK" = false ]; then
    echo -e "${RED}❌ CRITICAL: Both SMTP ports are blocked${NC}"
    echo ""
    echo "You MUST configure firewall rules:"
    echo ""
    echo "1. UFW (on server):"
    echo "   sudo ufw allow out 465/tcp"
    echo "   sudo ufw allow out 587/tcp"
    echo "   sudo ufw reload"
    echo ""
    echo "2. DigitalOcean Firewall (in dashboard):"
    echo "   - Add OUTBOUND rules for ports 465 and 587"
    echo "   - Protocol: TCP"
    echo "   - Destination: All IPv4"
    echo ""
elif [ "$PORT_465_OK" = false ] && [ "$PORT_587_OK" = true ]; then
    echo -e "${YELLOW}⚠️  Port 465 blocked, but 587 works. Configuration updated.${NC}"
    echo "Backend will use port 587 (TLS) instead of 465 (SSL)."
    echo ""
elif [ "$PORT_465_OK" = true ]; then
    echo -e "${GREEN}✅ Port 465 is accessible. SMTP should work.${NC}"
    echo ""
fi

echo "Monitor email sending:"
echo "  pm2 logs optiohire-backend | grep -i 'email\|smtp'"
echo ""
echo "Test email sending:"
echo "  curl http://localhost:3001/health/email-reader"
echo ""

