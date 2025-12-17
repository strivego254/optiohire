#!/bin/bash
# Fix Email Reader Issues on Server
# Run this script on your server to diagnose and fix email processing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OptioHire Email Reader Fix Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect app directory
if [ -d "/opt/optiohire" ]; then
    APP_DIR="/opt/optiohire"
elif [ -d "$HOME/optiohire" ]; then
    APP_DIR="$HOME/optiohire"
else
    echo -e "${RED}Error: Could not find optiohire directory${NC}"
    echo "Please run this script from the optiohire directory or set APP_DIR"
    exit 1
fi

BACKEND_DIR="$APP_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"

echo -e "${GREEN}✓ Found app directory: $APP_DIR${NC}"
echo ""

# Step 1: Check if .env file exists
echo -e "${YELLOW}Step 1: Checking environment variables...${NC}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ Error: $ENV_FILE not found!${NC}"
    echo "Please create the .env file with required variables"
    exit 1
fi
echo -e "${GREEN}✓ .env file exists${NC}"

# Step 2: Check required IMAP variables
echo ""
echo -e "${YELLOW}Step 2: Checking IMAP configuration...${NC}"
MISSING_VARS=()

if ! grep -q "^IMAP_HOST=" "$ENV_FILE"; then
    MISSING_VARS+=("IMAP_HOST")
fi
if ! grep -q "^IMAP_USER=" "$ENV_FILE"; then
    MISSING_VARS+=("IMAP_USER")
fi
if ! grep -q "^IMAP_PASS=" "$ENV_FILE"; then
    MISSING_VARS+=("IMAP_PASS")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing required IMAP variables: ${MISSING_VARS[*]}${NC}"
    echo ""
    echo "Please add these to $ENV_FILE:"
    echo "  IMAP_HOST=imap.gmail.com"
    echo "  IMAP_PORT=993"
    echo "  IMAP_USER=hirebitapplications@gmail.com"
    echo "  IMAP_PASS=your_app_password"
    echo "  IMAP_SECURE=true"
    echo "  IMAP_POLL_MS=10000"
    echo ""
    echo "Also ensure ENABLE_EMAIL_READER is NOT set to 'false':"
    echo "  # ENABLE_EMAIL_READER=false  <-- Comment this out or remove it"
    exit 1
fi
echo -e "${GREEN}✓ All required IMAP variables found${NC}"

# Check if email reader is disabled
if grep -q "^ENABLE_EMAIL_READER=false" "$ENV_FILE"; then
    echo -e "${RED}✗ WARNING: ENABLE_EMAIL_READER is set to 'false'${NC}"
    echo "This will prevent the email reader from starting!"
    echo ""
    read -p "Do you want to enable it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i 's/^ENABLE_EMAIL_READER=false/# ENABLE_EMAIL_READER=false/' "$ENV_FILE"
        echo -e "${GREEN}✓ Enabled email reader${NC}"
    else
        echo -e "${YELLOW}⚠ Email reader will remain disabled${NC}"
    fi
fi

# Step 3: Rebuild backend
echo ""
echo -e "${YELLOW}Step 3: Rebuilding backend with latest fixes...${NC}"
cd "$BACKEND_DIR"

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: package.json not found in $BACKEND_DIR${NC}"
    exit 1
fi

echo "Installing dependencies..."
npm install --production=false

echo "Building TypeScript..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo -e "${RED}✗ Error: Build failed - dist/server.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend built successfully${NC}"

# Step 4: Check PM2 status
echo ""
echo -e "${YELLOW}Step 4: Checking PM2 processes...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}✗ PM2 not installed. Installing...${NC}"
    npm install -g pm2
fi

pm2 status

# Step 5: Restart backend with updated environment
echo ""
echo -e "${YELLOW}Step 5: Restarting backend with updated code...${NC}"

# Find backend process name
BACKEND_PROCESS=$(pm2 list | grep -E "backend|optiohire-backend" | awk '{print $2}' | head -1)

if [ -z "$BACKEND_PROCESS" ]; then
    echo -e "${YELLOW}⚠ No backend process found. Starting new process...${NC}"
    cd "$APP_DIR"
    if [ -f "deploy/ecosystem.config.js" ]; then
        pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env
    else
        cd "$BACKEND_DIR"
        pm2 start dist/server.js --name optiohire-backend --update-env
    fi
else
    echo "Restarting process: $BACKEND_PROCESS"
    pm2 restart "$BACKEND_PROCESS" --update-env
fi

pm2 save
echo -e "${GREEN}✓ Backend restarted${NC}"

# Step 6: Wait a moment for startup
echo ""
echo -e "${YELLOW}Step 6: Waiting for backend to start...${NC}"
sleep 5

# Step 7: Check email reader status
echo ""
echo -e "${YELLOW}Step 7: Checking email reader status...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "ERROR")

if [ "$HEALTH_RESPONSE" = "ERROR" ]; then
    echo -e "${RED}✗ Could not connect to backend health endpoint${NC}"
    echo "Checking PM2 logs..."
    pm2 logs "$BACKEND_PROCESS" --lines 20 --nostream
else
    echo "Health check response:"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
    echo ""
    
    # Parse response (basic check)
    if echo "$HEALTH_RESPONSE" | grep -q '"enabled":true'; then
        echo -e "${GREEN}✓ Email reader is enabled${NC}"
    else
        echo -e "${RED}✗ Email reader is NOT enabled${NC}"
    fi
    
    if echo "$HEALTH_RESPONSE" | grep -q '"running":true'; then
        echo -e "${GREEN}✓ Email reader is running${NC}"
    else
        echo -e "${YELLOW}⚠ Email reader is NOT running${NC}"
        if echo "$HEALTH_RESPONSE" | grep -q "disabledReason"; then
            echo "Reason:"
            echo "$HEALTH_RESPONSE" | grep -o '"disabledReason":"[^"]*"' | cut -d'"' -f4
        fi
    fi
fi

# Step 8: Show recent logs
echo ""
echo -e "${YELLOW}Step 8: Recent backend logs (last 30 lines)...${NC}"
echo -e "${BLUE}========================================${NC}"
pm2 logs "$BACKEND_PROCESS" --lines 30 --nostream || pm2 logs --lines 30 --nostream
echo -e "${BLUE}========================================${NC}"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check email reader status: curl http://localhost:3001/health/email-reader"
echo "2. Monitor logs: pm2 logs $BACKEND_PROCESS"
echo "3. Check PM2 status: pm2 status"
echo ""
echo "If email reader is still not running:"
echo "1. Verify IMAP credentials in $ENV_FILE"
echo "2. Check that ENABLE_EMAIL_READER is not set to 'false'"
echo "3. Review PM2 logs for errors: pm2 logs $BACKEND_PROCESS"
echo ""
echo -e "${GREEN}✅ Fix script completed!${NC}"

