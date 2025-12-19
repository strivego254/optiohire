#!/bin/bash
# Verify SMTP works after firewall is configured

echo "=========================================="
echo "🔍 VERIFYING SMTP CONNECTION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Test Port Connectivity
echo "Step 1: Testing SMTP port connectivity..."
echo "----------------------------------------"

# Test port 465 (SSL)
echo -n "Testing port 465 (SSL) to smtp.gmail.com... "
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/465" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 465 is accessible${NC}"
    PORT_465_OK=true
else
    echo -e "${RED}❌ Port 465 is still BLOCKED${NC}"
    PORT_465_OK=false
fi

# Test port 587 (TLS)
echo -n "Testing port 587 (TLS) to smtp.gmail.com... "
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/587" 2>/dev/null; then
    echo -e "${GREEN}✅ Port 587 is accessible${NC}"
    PORT_587_OK=true
else
    echo -e "${RED}❌ Port 587 is still BLOCKED${NC}"
    PORT_587_OK=false
fi

echo ""

# Step 2: Check Backend SMTP Status
echo "Step 2: Checking backend SMTP connection..."
echo "----------------------------------------"

# Wait a moment for backend to initialize
sleep 2

# Check if backend is running
if ! pm2 list | grep -q "optiohire-backend.*online"; then
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Starting backend..."
    pm2 restart optiohire-backend --update-env
    sleep 3
fi

# Check recent logs for SMTP status
echo "Recent SMTP connection attempts:"
pm2 logs optiohire-backend --lines 20 --nostream 2>/dev/null | grep -i "smtp\|email service" | tail -5 || echo "No SMTP logs found yet"

echo ""

# Step 3: Test SMTP Connection via Backend
echo "Step 3: Testing SMTP via backend service..."
echo "----------------------------------------"

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

if [ -f "$APP_DIR/backend/.env" ]; then
    cd "$APP_DIR/backend"
    
    # Create a quick test
    cat > /tmp/test-smtp-quick.js << 'TEST_EOF'
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS;
const mailPort = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '465', 10);
const useSecure = mailPort === 465;

if (!mailUser || !mailPass) {
    console.log('⚠️  SMTP credentials not configured in .env');
    process.exit(1);
}

console.log(`Testing SMTP to ${mailHost}:${mailPort}...`);

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
    console.log('✅ Emails can now be sent automatically');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SMTP connection failed:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('⚠️  This is still a network/firewall issue.');
      console.error('   Make sure:');
      console.error('   1. Firewall is applied to your droplet');
      console.error('   2. Outbound rules for ports 465 and 587 are active');
      console.error('   3. Wait 1-2 minutes for changes to propagate');
    } else if (error.responseCode === 530 || error.message.includes('Authentication')) {
      console.error('');
      console.error('⚠️  This is an authentication issue.');
      console.error('   Make sure you are using a Gmail App Password (not regular password)');
    }
    process.exit(1);
  });
TEST_EOF

    if node /tmp/test-smtp-quick.js 2>&1; then
        echo ""
        echo -e "${GREEN}✅ SMTP CONNECTION TEST PASSED!${NC}"
        echo ""
        echo "Your email service is now working correctly."
    else
        echo ""
        echo -e "${YELLOW}⚠️  SMTP test failed. Check the error above.${NC}"
    fi
    
    rm -f /tmp/test-smtp-quick.js
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ "$PORT_465_OK" = true ] && [ "$PORT_587_OK" = true ]; then
    echo -e "${GREEN}✅ Both SMTP ports are accessible${NC}"
    echo -e "${GREEN}✅ Firewall configuration is correct${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make sure firewall is applied to your droplet"
    echo "2. Restart backend: pm2 restart optiohire-backend --update-env"
    echo "3. Monitor logs: pm2 logs optiohire-backend | grep -i smtp"
    echo ""
    echo "Emails will now be sent automatically when applications are processed!"
elif [ "$PORT_465_OK" = false ] && [ "$PORT_587_OK" = false ]; then
    echo -e "${RED}❌ Both ports are still blocked${NC}"
    echo ""
    echo "Make sure:"
    echo "1. Firewall is created and saved"
    echo "2. Firewall is applied to your droplet (in 'Apply to Droplets' section)"
    echo "3. Wait 1-2 minutes for changes to propagate"
    echo "4. Run this script again to verify"
else
    echo -e "${YELLOW}⚠️  One port works, one doesn't${NC}"
    echo "This is unusual. Check firewall rules again."
fi

echo ""

