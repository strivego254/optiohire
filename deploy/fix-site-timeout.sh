#!/bin/bash

# Fix site timeout issues - ensures all services are running and configured

set -e

echo "🔧 Fixing Site Timeout Issues..."
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/OPTIOHIRE PROJECT/optiohire"
cd "$PROJECT_DIR"

# Step 1: Ensure backend is built
echo "1️⃣  Building Backend..."
cd backend
if [ ! -d "dist" ] || [ "src/server.ts" -nt "dist/server.js" ]; then
    echo "   Building TypeScript..."
    npm run build
    echo -e "${GREEN}✅ Backend built${NC}"
else
    echo -e "${GREEN}✅ Backend already built${NC}"
fi
cd ..

# Step 2: Ensure frontend is built
echo ""
echo "2️⃣  Building Frontend..."
cd frontend
if [ ! -d ".next" ]; then
    echo "   Building Next.js..."
    npm run build
    echo -e "${GREEN}✅ Frontend built${NC}"
else
    echo -e "${GREEN}✅ Frontend already built${NC}"
fi
cd ..

# Step 3: Start/restart PM2 processes
echo ""
echo "3️⃣  Starting PM2 Processes..."
pm2 delete optiohire-backend optiohire-frontend 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ PM2 processes started${NC}"

# Step 4: Check and configure Nginx
echo ""
echo "4️⃣  Configuring Nginx..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "   Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Create Nginx config if it doesn't exist
if [ ! -f "/etc/nginx/sites-available/optiohire" ]; then
    echo "   Creating Nginx config..."
    sudo cp deploy/nginx.conf /etc/nginx/sites-available/optiohire
    sudo ln -sf /etc/nginx/sites-available/optiohire /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✅ Nginx config created${NC}"
else
    echo -e "${GREEN}✅ Nginx config exists${NC}"
fi

# Test Nginx config
echo "   Testing Nginx config..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx config is valid${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx config has errors - check manually${NC}"
fi

# Start/restart Nginx
echo "   Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx failed to start - check logs: sudo journalctl -u nginx${NC}"
fi

# Step 5: Configure firewall
echo ""
echo "5️⃣  Configuring Firewall..."
if command -v ufw &> /dev/null; then
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall rules added${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not installed - install with: sudo apt-get install ufw${NC}"
fi

# Step 6: Wait a moment and verify
echo ""
echo "6️⃣  Verifying Services..."
sleep 3

echo ""
echo "PM2 Status:"
pm2 list

echo ""
echo "Port Listeners:"
netstat -tuln 2>/dev/null | grep -E ":(80|443|3000|3001)" || ss -tuln 2>/dev/null | grep -E ":(80|443|3000|3001)"

echo ""
echo "Testing Local Connections:"
if curl -s -o /dev/null -w "Backend (3001): %{http_code}\n" http://localhost:3001/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not responding yet (may need a moment)${NC}"
fi

if curl -s -o /dev/null -w "Frontend (3000): %{http_code}\n" http://localhost:3000 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not responding yet (may need a moment)${NC}"
fi

if curl -s -o /dev/null -w "Nginx (80): %{http_code}\n" http://localhost 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx not responding - check: sudo tail -f /var/log/nginx/error.log${NC}"
fi

echo ""
echo "================================="
echo -e "${GREEN}✅ Fix Complete!${NC}"
echo "================================="
echo ""
echo "Next Steps:"
echo "  1. Check DigitalOcean firewall allows ports 80/443 (inbound)"
echo "  2. Verify DNS points to your server IP"
echo "  3. Wait 2-3 minutes for services to fully start"
echo "  4. Test: curl http://your-server-ip"
echo ""
echo "If still timing out, run: ./deploy/diagnose-site-timeout.sh"

