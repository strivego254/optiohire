#!/bin/bash
# Fix Database Mismatch on Server
# Run this script on your server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Database Mismatch on Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect app directory - check current directory first, then common locations
if [ -d "backend" ] && [ -d "frontend" ]; then
    APP_DIR="$(pwd)"
elif [ -d "$HOME/optiohire" ]; then
    APP_DIR="$HOME/optiohire"
elif [ -d "/opt/optiohire" ]; then
    APP_DIR="/opt/optiohire"
else
    echo -e "${RED}Error: Could not find optiohire directory${NC}"
    echo "Current directory: $(pwd)"
    echo "Please run this script from the optiohire directory or ensure it exists in ~/optiohire or /opt/optiohire"
    exit 1
fi

BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_ENV="$BACKEND_DIR/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env.local"

echo -e "${GREEN}✓ Found app directory: $APP_DIR${NC}"
echo ""

# Step 1: Check current database connections
echo -e "${YELLOW}Step 1: Checking current database connections...${NC}"
if [ -f "$APP_DIR/scripts/check-database-connections.sh" ]; then
    bash "$APP_DIR/scripts/check-database-connections.sh"
else
    echo "Checking manually..."
    
    if [ -f "$BACKEND_ENV" ]; then
        BACKEND_DB=$(grep "^DATABASE_URL=" "$BACKEND_ENV" | cut -d'=' -f2- | sed -n 's/.*\/\([^?]*\).*/\1/p')
        echo "Backend database: ${BACKEND_DB:-unknown}"
    fi
    
    if [ -f "$FRONTEND_ENV" ]; then
        FRONTEND_DB=$(grep "^DATABASE_URL=" "$FRONTEND_ENV" | cut -d'=' -f2- | sed -n 's/.*\/\([^?]*\).*/\1/p')
        echo "Frontend database: ${FRONTEND_DB:-unknown}"
    fi
fi

echo ""

# Step 2: Get backend DATABASE_URL
echo -e "${YELLOW}Step 2: Reading backend DATABASE_URL...${NC}"
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${RED}✗ Error: $BACKEND_ENV not found!${NC}"
    exit 1
fi

BACKEND_DATABASE_URL=$(grep "^DATABASE_URL=" "$BACKEND_ENV" | cut -d'=' -f2- | head -1)
BACKEND_DB_SSL=$(grep "^DB_SSL=" "$BACKEND_ENV" | cut -d'=' -f2- | head -1 || echo "false")

if [ -z "$BACKEND_DATABASE_URL" ]; then
    echo -e "${RED}✗ Error: DATABASE_URL not found in backend/.env${NC}"
    exit 1
fi

# Mask password for display
MASKED_BACKEND_URL=$(echo "$BACKEND_DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
echo -e "${GREEN}✓ Backend DATABASE_URL: $MASKED_BACKEND_URL${NC}"
echo -e "${GREEN}✓ Backend DB_SSL: ${BACKEND_DB_SSL}${NC}"
echo ""

# Step 3: Update frontend .env.local
echo -e "${YELLOW}Step 3: Updating frontend/.env.local...${NC}"
if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}⚠ frontend/.env.local not found, creating it...${NC}"
    touch "$FRONTEND_ENV"
fi

# Backup existing file
cp "$FRONTEND_ENV" "$FRONTEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backed up existing .env.local${NC}"

# Update DATABASE_URL
if grep -q "^DATABASE_URL=" "$FRONTEND_ENV"; then
    # Replace existing DATABASE_URL
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$BACKEND_DATABASE_URL|" "$FRONTEND_ENV"
    echo -e "${GREEN}✓ Updated existing DATABASE_URL${NC}"
else
    # Add new DATABASE_URL
    echo "DATABASE_URL=$BACKEND_DATABASE_URL" >> "$FRONTEND_ENV"
    echo -e "${GREEN}✓ Added DATABASE_URL${NC}"
fi

# Update DB_SSL
if grep -q "^DB_SSL=" "$FRONTEND_ENV"; then
    sed -i "s|^DB_SSL=.*|DB_SSL=$BACKEND_DB_SSL|" "$FRONTEND_ENV"
    echo -e "${GREEN}✓ Updated existing DB_SSL${NC}"
else
    echo "DB_SSL=$BACKEND_DB_SSL" >> "$FRONTEND_ENV"
    echo -e "${GREEN}✓ Added DB_SSL${NC}"
fi

echo ""

# Step 4: Update backend IMAP_POLL_MS
echo -e "${YELLOW}Step 4: Updating backend IMAP_POLL_MS to 1000ms (1 second)...${NC}"
if grep -q "^IMAP_POLL_MS=" "$BACKEND_ENV"; then
    sed -i 's|^IMAP_POLL_MS=.*|IMAP_POLL_MS=1000|' "$BACKEND_ENV"
    echo -e "${GREEN}✓ Updated IMAP_POLL_MS to 1000${NC}"
else
    echo "IMAP_POLL_MS=1000" >> "$BACKEND_ENV"
    echo -e "${GREEN}✓ Added IMAP_POLL_MS=1000${NC}"
fi

echo ""

# Step 5: Verify changes
echo -e "${YELLOW}Step 5: Verifying changes...${NC}"
FRONTEND_DATABASE_URL=$(grep "^DATABASE_URL=" "$FRONTEND_ENV" | cut -d'=' -f2- | head -1)

if [ "$BACKEND_DATABASE_URL" = "$FRONTEND_DATABASE_URL" ]; then
    echo -e "${GREEN}✅ SUCCESS: Frontend and backend now use the same database!${NC}"
else
    echo -e "${RED}✗ WARNING: DATABASE_URL still doesn't match${NC}"
    echo "Backend:  $(echo $BACKEND_DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
    echo "Frontend: $(echo $FRONTEND_DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
fi

echo ""

# Step 6: Restart services
echo -e "${YELLOW}Step 6: Restarting services...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart all --update-env
    pm2 save
    echo -e "${GREEN}✓ Services restarted${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not found. Please restart services manually.${NC}"
fi

echo ""

# Step 7: Wait and check status
echo -e "${YELLOW}Step 7: Checking email reader status...${NC}"
sleep 5
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health/email-reader 2>/dev/null || echo "ERROR")

if [ "$HEALTH_RESPONSE" != "ERROR" ]; then
    echo "Health check response:"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Could not connect to health endpoint${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Fix script completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check if jobs exist in the database: cd backend && npx tsx scripts/check-jobs.ts"
echo "2. If no jobs, recreate them through the dashboard"
echo "3. Monitor logs: pm2 logs optiohire-backend --lines 0"
echo "4. Test with a new application email"

