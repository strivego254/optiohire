#!/bin/bash
# Test SMTP connection and send emails after firewall fix

echo "=========================================="
echo "Testing SMTP and Sending Emails"
echo "=========================================="
echo ""

APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

cd "$APP_DIR" || exit 1

echo "Step 1: Testing SMTP connectivity..."
echo "-----------------------------------"
./deploy/test-smtp-connection.sh
echo ""

echo "Step 2: Updating .env to use port 465..."
echo "-----------------------------------"
cd backend || exit 1

# Update or add SMTP_PORT
if grep -q "^SMTP_PORT=" .env; then
    sed -i 's/^SMTP_PORT=.*/SMTP_PORT=465/' .env
    echo "✅ Updated SMTP_PORT to 465"
else
    echo "SMTP_PORT=465" >> .env
    echo "✅ Added SMTP_PORT=465"
fi

# Also add MAIL_PORT if not exists
if ! grep -q "^MAIL_PORT=" .env; then
    echo "MAIL_PORT=465" >> .env
    echo "✅ Added MAIL_PORT=465"
fi

echo ""
echo "Step 3: Rebuilding backend..."
echo "-----------------------------------"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful"
echo ""

echo "Step 4: Restarting backend..."
echo "-----------------------------------"
pm2 restart optiohire-backend --update-env
sleep 3
echo "✅ Backend restarted"
echo ""

echo "Step 5: Testing email sending..."
echo "-----------------------------------"
echo "Sending emails to shortlisted/rejected applicants..."
npx tsx scripts/resend-email-notifications.ts
echo ""

echo "=========================================="
echo "Complete!"
echo "=========================================="
echo ""
echo "Check the output above to see if emails were sent successfully."
echo "If you see '✅ ... email sent successfully', the emails are working!"
echo ""

