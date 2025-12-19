#!/bin/bash
# Quick SMTP Test - No git required
# Run this directly on the server

echo "=========================================="
echo "🔍 TESTING SMTP CONNECTION"
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

# Step 2: Check Backend Status
echo "Step 2: Checking backend status..."
echo "----------------------------------------"

if pm2 list | grep -q "optiohire-backend.*online"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    
    # Check recent SMTP logs
    echo ""
    echo "Recent SMTP connection attempts:"
    pm2 logs optiohire-backend --lines 30 --nostream 2>/dev/null | grep -i "smtp\|email service" | tail -5 || echo "  No SMTP logs found yet"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Starting backend..."
    pm2 restart optiohire-backend --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env
    sleep 3
fi

echo ""

# Step 3: Test SMTP Connection
echo "Step 3: Testing SMTP connection..."
echo "----------------------------------------"

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

if [ -f "$APP_DIR/backend/.env" ]; then
    cd "$APP_DIR/backend"
    
    # Quick SMTP test
    node -e "
    const nodemailer = require('nodemailer');
    require('dotenv').config({ path: '.env' });
    
    const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
    const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS;
    const mailPort = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '465', 10);
    const useSecure = mailPort === 465;
    
    if (!mailUser || !mailPass) {
        console.log('❌ SMTP credentials not configured in .env');
        console.log('   Set MAIL_USER and MAIL_PASS in backend/.env');
        process.exit(1);
    }
    
    console.log(\`Testing SMTP to \${mailHost}:\${mailPort}...\`);
    console.log(\`User: \${mailUser}\`);
    
    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: useSecure,
      auth: { user: mailUser, pass: mailPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false }
    });
    
    transporter.verify()
      .then(() => {
        console.log('✅ SMTP connection successful!');
        console.log('✅ Emails can now be sent automatically');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ SMTP connection failed:');
        console.error(\`   \${error.message}\`);
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
          console.error('');
          console.error('⚠️  Network/firewall issue.');
          console.error('   Make sure firewall is applied to droplet');
          console.error('   Wait 1-2 minutes for changes to propagate');
        } else if (error.responseCode === 530 || error.message.includes('Authentication')) {
          console.error('');
          console.error('⚠️  Authentication issue.');
          console.error('   Use Gmail App Password (not regular password)');
        }
        process.exit(1);
      });
    " 2>&1
    
    TEST_RESULT=$?
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ SMTP CONNECTION TEST PASSED!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  SMTP test failed. Check the error above.${NC}"
    fi
else
    echo -e "${RED}❌ backend/.env file not found at $APP_DIR/backend/.env${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ "$PORT_465_OK" = true ] && [ "$PORT_587_OK" = true ]; then
    echo -e "${GREEN}✅ Both SMTP ports are accessible${NC}"
    echo -e "${GREEN}✅ Firewall configuration is working!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart backend: pm2 restart optiohire-backend --update-env"
    echo "2. Monitor logs: pm2 logs optiohire-backend | grep -i smtp"
    echo ""
    echo "Emails will now be sent automatically! 🎉"
elif [ "$PORT_465_OK" = false ] && [ "$PORT_587_OK" = false ]; then
    echo -e "${RED}❌ Both ports are still blocked${NC}"
    echo ""
    echo "Make sure:"
    echo "1. Firewall is created and saved in DigitalOcean"
    echo "2. Firewall is applied to your droplet"
    echo "3. Wait 1-2 minutes for changes to propagate"
    echo "4. Run this script again: ./deploy/test-smtp-now.sh"
else
    echo -e "${YELLOW}⚠️  One port works, one doesn't${NC}"
    echo "This is unusual. Check firewall rules again."
fi

echo ""

