#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_DIR="/opt/optiohire"
DEPLOY_USER="${DEPLOY_USER:-root}"

echo -e "${GREEN}🚀 Deploying OptioHire to production...${NC}"

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm install --production=false
npm run build
cd ..

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm install --production=false
npm run build
cd ..

# Copy files to server (if deploying remotely)
if [ -n "$REMOTE_HOST" ]; then
    echo -e "${YELLOW}Copying files to remote server...${NC}"
    rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
        ./ $REMOTE_HOST:$APP_DIR/
    
    echo -e "${YELLOW}Installing production dependencies on server...${NC}"
    ssh $REMOTE_HOST "cd $APP_DIR/backend && npm install --production"
    ssh $REMOTE_HOST "cd $APP_DIR/frontend && npm install --production"
    
    echo -e "${YELLOW}Restarting services...${NC}"
    ssh $REMOTE_HOST "pm2 restart ecosystem.config.js --update-env"
    ssh $REMOTE_HOST "pm2 save"
else
    echo -e "${YELLOW}Local deployment mode${NC}"
    echo "If deploying locally, run:"
    echo "  pm2 restart ecosystem.config.js --update-env"
    echo "  pm2 save"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"

