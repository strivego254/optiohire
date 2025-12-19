#!/bin/bash

# Diagnose why optiohire.com is timing out
# This script checks all components needed for the site to work

echo "🔍 Diagnosing Site Timeout Issue..."
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PM2 processes
echo "1️⃣  Checking PM2 Processes..."
echo "----------------------------"
pm2 list
echo ""

# Check if backend is running
echo "2️⃣  Checking Backend (Port 3001)..."
echo "-----------------------------------"
if pm2 list | grep -q "optiohire-backend.*online"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    BACKEND_RUNNING=false
fi

# Check if frontend is running
echo ""
echo "3️⃣  Checking Frontend (Port 3000)..."
echo "------------------------------------"
if pm2 list | grep -q "optiohire-frontend.*online"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    FRONTEND_RUNNING=false
fi

# Check if services are listening on ports
echo ""
echo "4️⃣  Checking Port Listeners..."
echo "-------------------------------"
if netstat -tuln 2>/dev/null | grep -q ":3001.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":3001"; then
    echo -e "${GREEN}✅ Port 3001 (backend) is listening${NC}"
else
    echo -e "${RED}❌ Port 3001 (backend) is NOT listening${NC}"
fi

if netstat -tuln 2>/dev/null | grep -q ":3000.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000 (frontend) is listening${NC}"
else
    echo -e "${RED}❌ Port 3000 (frontend) is NOT listening${NC}"
fi

# Check Nginx
echo ""
echo "5️⃣  Checking Nginx..."
echo "---------------------"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
    NGINX_RUNNING=true
else
    echo -e "${RED}❌ Nginx is NOT running${NC}"
    NGINX_RUNNING=false
fi

# Check Nginx config
if [ -f "/etc/nginx/sites-enabled/optiohire" ] || [ -f "/etc/nginx/sites-available/optiohire" ]; then
    echo -e "${GREEN}✅ Nginx config exists${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx config not found${NC}"
fi

# Test Nginx config
if command -v nginx &> /dev/null; then
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✅ Nginx config is valid${NC}"
    else
        echo -e "${RED}❌ Nginx config has errors:${NC}"
        nginx -t
    fi
fi

# Check firewall
echo ""
echo "6️⃣  Checking Firewall (UFW)..."
echo "-------------------------------"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    echo "Status: $UFW_STATUS"
    
    if ufw status | grep -q "80/tcp.*ALLOW"; then
        echo -e "${GREEN}✅ Port 80 (HTTP) is allowed${NC}"
    else
        echo -e "${RED}❌ Port 80 (HTTP) is NOT allowed${NC}"
    fi
    
    if ufw status | grep -q "443/tcp.*ALLOW"; then
        echo -e "${GREEN}✅ Port 443 (HTTPS) is allowed${NC}"
    else
        echo -e "${YELLOW}⚠️  Port 443 (HTTPS) is NOT allowed (optional)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  UFW not installed${NC}"
fi

# Check if ports 80/443 are listening (Nginx should be)
echo ""
echo "7️⃣  Checking HTTP/HTTPS Ports..."
echo "---------------------------------"
if netstat -tuln 2>/dev/null | grep -q ":80.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":80"; then
    echo -e "${GREEN}✅ Port 80 (HTTP) is listening${NC}"
else
    echo -e "${RED}❌ Port 80 (HTTP) is NOT listening (Nginx should be here)${NC}"
fi

if netstat -tuln 2>/dev/null | grep -q ":443.*LISTEN" || ss -tuln 2>/dev/null | grep -q ":443"; then
    echo -e "${GREEN}✅ Port 443 (HTTPS) is listening${NC}"
else
    echo -e "${YELLOW}⚠️  Port 443 (HTTPS) is NOT listening (optional)${NC}"
fi

# Check recent PM2 logs for errors
echo ""
echo "8️⃣  Recent Backend Errors (last 20 lines)..."
echo "---------------------------------------------"
pm2 logs optiohire-backend --lines 20 --nostream 2>/dev/null | grep -i "error\|failed\|crash" | tail -5 || echo "No recent errors found"

echo ""
echo "9️⃣  Recent Frontend Errors (last 20 lines)..."
echo "---------------------------------------------"
pm2 logs optiohire-frontend --lines 20 --nostream 2>/dev/null | grep -i "error\|failed\|crash" | tail -5 || echo "No recent errors found"

# Summary and recommendations
echo ""
echo "===================================="
echo "📋 SUMMARY & RECOMMENDATIONS"
echo "===================================="
echo ""

if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${RED}❌ CRITICAL: Services are not running!${NC}"
    echo ""
    echo "Fix:"
    echo "  cd ~/optiohire"
    echo "  pm2 start deploy/ecosystem.config.js"
    echo "  pm2 save"
    exit 1
fi

if [ "$NGINX_RUNNING" = false ]; then
    echo -e "${RED}❌ CRITICAL: Nginx is not running!${NC}"
    echo ""
    echo "Fix:"
    echo "  sudo systemctl start nginx"
    echo "  sudo systemctl enable nginx"
    exit 1
fi

# Check if we can reach services locally
echo ""
echo "🔟 Testing Local Connectivity..."
echo "---------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Backend responds on localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend does NOT respond on localhost:3001${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Frontend responds on localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend does NOT respond on localhost:3000${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Nginx responds on localhost:80${NC}"
else
    echo -e "${RED}❌ Nginx does NOT respond on localhost:80${NC}"
fi

echo ""
echo "✅ Diagnosis complete!"
echo ""
echo "If services are running but site still times out:"
echo "  1. Check DigitalOcean firewall allows ports 80/443"
echo "  2. Check DNS points to correct IP"
echo "  3. Check Nginx config: sudo nginx -t"
echo "  4. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"

