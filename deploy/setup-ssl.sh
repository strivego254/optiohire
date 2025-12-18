#!/bin/bash
# Setup SSL Certificate for optiohire.com using Let's Encrypt (Free)
# This script will:
# 1. Install certbot
# 2. Obtain SSL certificate
# 3. Configure nginx for HTTPS
# 4. Set up auto-renewal

set -e

echo "=========================================="
echo "SSL Certificate Setup for optiohire.com"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if domain is set
DOMAIN="optiohire.com"
WWW_DOMAIN="www.optiohire.com"

echo "📋 Domain: $DOMAIN"
echo "📋 WWW Domain: $WWW_DOMAIN"
echo ""

# Step 1: Update system
echo "Step 1: Updating system packages..."
apt-get update -qq

# Step 2: Install certbot
echo ""
echo "Step 2: Installing certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Step 3: Check nginx configuration
echo ""
echo "Step 3: Checking nginx configuration..."
NGINX_CONFIG="/etc/nginx/sites-available/optiohire"
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "⚠️  Nginx config not found at $NGINX_CONFIG"
    echo "   Looking for nginx config..."
    NGINX_CONFIG=$(find /etc/nginx -name "*optiohire*" -o -name "*default*" | head -1)
    if [ -z "$NGINX_CONFIG" ]; then
        echo "❌ Could not find nginx configuration"
        exit 1
    fi
    echo "   Found: $NGINX_CONFIG"
fi

# Step 4: Ensure nginx is running
echo ""
echo "Step 4: Ensuring nginx is running..."
systemctl start nginx
systemctl enable nginx

# Step 5: Check if port 80 is open
echo ""
echo "Step 5: Checking if port 80 is accessible..."
if ! curl -s http://localhost > /dev/null; then
    echo "⚠️  Warning: Port 80 might not be accessible from outside"
    echo "   Make sure your firewall allows HTTP (port 80) and HTTPS (port 443)"
fi

# Step 6: Obtain SSL certificate
echo ""
echo "Step 6: Obtaining SSL certificate from Let's Encrypt..."
echo "   This will verify domain ownership and install the certificate"
echo ""

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "⚠️  SSL certificate already exists for $DOMAIN"
    read -p "   Do you want to renew it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        certbot renew --dry-run
        echo "✅ Certificate renewal test successful"
    else
        echo "✅ Using existing certificate"
    fi
else
    # Obtain new certificate
    certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate obtained successfully!"
    else
        echo "❌ Failed to obtain SSL certificate"
        echo "   Common issues:"
        echo "   - Domain DNS not pointing to this server"
        echo "   - Port 80 not accessible from internet"
        echo "   - Firewall blocking HTTP/HTTPS"
        exit 1
    fi
fi

# Step 7: Test nginx configuration
echo ""
echo "Step 7: Testing nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded with SSL configuration"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Step 8: Set up auto-renewal
echo ""
echo "Step 8: Setting up automatic certificate renewal..."
# Certbot automatically sets up a systemd timer, but let's verify
systemctl status certbot.timer > /dev/null 2>&1
if [ $? -eq 0 ]; then
    systemctl enable certbot.timer
    systemctl start certbot.timer
    echo "✅ Auto-renewal timer is enabled"
else
    # Create a cron job as fallback
    (crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet --nginx") | crontab -
    echo "✅ Auto-renewal cron job created"
fi

# Step 9: Verify SSL
echo ""
echo "Step 9: Verifying SSL certificate..."
sleep 2
if curl -s https://$DOMAIN > /dev/null; then
    echo "✅ HTTPS is working! Visit https://$DOMAIN"
else
    echo "⚠️  HTTPS test failed, but certificate was installed"
    echo "   It may take a few minutes for DNS to propagate"
fi

echo ""
echo "=========================================="
echo "✅ SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo "  https://$WWW_DOMAIN"
echo ""
echo "Certificate will auto-renew before expiration."
echo ""

