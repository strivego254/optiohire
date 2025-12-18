#!/bin/bash
# Test SMTP connection to Gmail

echo "Testing SMTP connection to Gmail..."
echo ""

echo "Step 1: Testing network connectivity to smtp.gmail.com..."
echo "-----------------------------------"
if ping -c 3 smtp.gmail.com > /dev/null 2>&1; then
    echo "✅ Can reach smtp.gmail.com"
else
    echo "❌ Cannot reach smtp.gmail.com"
fi
echo ""

echo "Step 2: Testing port 587 (TLS)..."
echo "-----------------------------------"
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/587" 2>/dev/null; then
    echo "✅ Port 587 is accessible"
else
    echo "❌ Port 587 is NOT accessible (may be blocked by firewall)"
fi
echo ""

echo "Step 3: Testing port 465 (SSL)..."
echo "-----------------------------------"
if timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/465" 2>/dev/null; then
    echo "✅ Port 465 is accessible"
else
    echo "❌ Port 465 is NOT accessible (may be blocked by firewall)"
fi
echo ""

echo "Step 4: Testing with telnet (if available)..."
echo "-----------------------------------"
if command -v telnet &> /dev/null; then
    timeout 5 telnet smtp.gmail.com 587 < /dev/null 2>&1 | head -3 || echo "Connection failed"
else
    echo "telnet not installed (this is normal)"
fi
echo ""

echo "Step 5: Checking firewall rules..."
echo "-----------------------------------"
if command -v ufw &> /dev/null; then
    echo "UFW status:"
    sudo ufw status | grep -E "587|465|smtp" || echo "No specific SMTP rules found"
else
    echo "UFW not installed"
fi
echo ""

echo "=========================================="
echo "Recommendations:"
echo "=========================================="
echo ""
echo "If ports 587 and 465 are blocked:"
echo "  1. Check DigitalOcean firewall settings"
echo "  2. Ensure outbound SMTP traffic is allowed"
echo "  3. Try using port 465 with secure: true"
echo "  4. Check if your server IP is blocked by Gmail"
echo ""

