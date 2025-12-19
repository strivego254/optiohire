#!/bin/bash
# Complete Production Setup for OptioHire 24/7 Operation
# This script sets up PM2 + Systemd for reliable 24/7 operation
# Best for: TypeScript/Node.js applications (Next.js + Express)

set -e

echo "=========================================="
echo "OptioHire Production Setup - 24/7 Operation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current user and app directory
CURRENT_USER=$(whoami)
APP_DIR="$HOME/optiohire"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/optiohire"
fi

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Error: Application directory not found at $HOME/optiohire or /opt/optiohire${NC}"
    echo "Please ensure the application is cloned to one of these locations."
    exit 1
fi

echo -e "${GREEN}✅ Application directory: $APP_DIR${NC}"
echo -e "${GREEN}✅ Running as user: $CURRENT_USER${NC}"
echo ""

# Step 1: Install PM2 globally if not present
echo "Step 1: Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 is installed (version $PM2_VERSION)${NC}"
fi
echo ""

# Step 2: Build Backend
echo "Step 2: Building backend..."
cd "$APP_DIR/backend"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: backend/package.json not found${NC}"
    exit 1
fi

echo "Installing backend dependencies..."
npm install --production=false

echo "Building backend TypeScript..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo -e "${RED}❌ Error: Backend build failed - dist/server.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend built successfully${NC}"
echo ""

# Step 3: Build Frontend
echo "Step 3: Building frontend..."
cd "$APP_DIR/frontend"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: frontend/package.json not found${NC}"
    exit 1
fi

echo "Installing frontend dependencies..."
npm install

echo "Building frontend Next.js application..."
# Use low-memory build if available, otherwise regular build
if npm run | grep -q "build:low-memory"; then
    npm run build:low-memory
else
    NODE_OPTIONS='--max-old-space-size=2048' npm run build
fi

if [ ! -d ".next" ]; then
    echo -e "${RED}❌ Error: Frontend build failed - .next directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 4: Ensure environment variables are set
echo "Step 4: Checking environment configuration..."
cd "$APP_DIR"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env not found${NC}"
    echo "Please ensure backend/.env is configured with:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - IMAP credentials (IMAP_HOST, IMAP_USER, IMAP_PASS)"
    echo "  - SMTP credentials (MAIL_HOST, MAIL_USER, MAIL_PASS)"
    echo "  - ENABLE_EMAIL_READER=true"
    echo ""
else
    # Ensure email reader is enabled
    if ! grep -q "^ENABLE_EMAIL_READER=true" "$APP_DIR/backend/.env"; then
        echo "Enabling email reader in backend/.env..."
        if grep -q "^ENABLE_EMAIL_READER" "$APP_DIR/backend/.env"; then
            sed -i 's/^ENABLE_EMAIL_READER=.*/ENABLE_EMAIL_READER=true/' "$APP_DIR/backend/.env"
        else
            echo "" >> "$APP_DIR/backend/.env"
            echo "# Email Reader Configuration" >> "$APP_DIR/backend/.env"
            echo "ENABLE_EMAIL_READER=true" >> "$APP_DIR/backend/.env"
        fi
    fi
    
    # Ensure polling interval is set to 1 second
    if ! grep -q "^IMAP_POLL_MS=" "$APP_DIR/backend/.env"; then
        echo "IMAP_POLL_MS=1000" >> "$APP_DIR/backend/.env"
    elif grep -q "^IMAP_POLL_MS=10000" "$APP_DIR/backend/.env"; then
        sed -i 's/^IMAP_POLL_MS=10000/IMAP_POLL_MS=1000/' "$APP_DIR/backend/.env"
    fi
    
    echo -e "${GREEN}✅ Environment configuration verified${NC}"
fi
echo ""

# Step 5: Create logs directory
echo "Step 5: Setting up logs directory..."
mkdir -p "$HOME/logs"
echo -e "${GREEN}✅ Logs directory: $HOME/logs${NC}"
echo ""

# Step 6: Stop any existing PM2 processes
echo "Step 6: Stopping existing PM2 processes..."
cd "$APP_DIR"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✅ Existing processes stopped${NC}"
echo ""

# Step 7: Start services with PM2 using ecosystem config
echo "Step 7: Starting services with PM2..."
cd "$APP_DIR"

# Set environment variable for ecosystem config
export OPTIOHIRE_ROOT="$APP_DIR"

# Start using ecosystem config
pm2 start deploy/ecosystem.config.js --update-env

# Wait a moment for services to start
sleep 3

# Check if services are running
if pm2 list | grep -q "optiohire-backend.*online" && pm2 list | grep -q "optiohire-frontend.*online"; then
    echo -e "${GREEN}✅ Both services started successfully${NC}"
else
    echo -e "${RED}❌ Error: Services failed to start${NC}"
    echo "Checking PM2 status:"
    pm2 list
    echo ""
    echo "Checking logs:"
    pm2 logs --lines 20
    exit 1
fi
echo ""

# Step 8: Save PM2 configuration
echo "Step 8: Saving PM2 configuration..."
pm2 save --force
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 configuration saved${NC}"
else
    echo -e "${RED}❌ Failed to save PM2 configuration${NC}"
    exit 1
fi
echo ""

# Step 9: Setup Systemd service for PM2 (most reliable for auto-start)
echo "Step 9: Setting up Systemd service for PM2 auto-start..."
cd "$APP_DIR"

# Generate systemd startup script
pm2 startup systemd -u "$CURRENT_USER" --hp "$HOME" > /tmp/pm2-startup.txt 2>&1 || true

# Check if sudo command is needed
if grep -q "sudo" /tmp/pm2-startup.txt; then
    echo -e "${YELLOW}⚠️  PM2 startup command requires sudo.${NC}"
    echo "Please run the following command (it will be displayed):"
    echo ""
    cat /tmp/pm2-startup.txt | grep "sudo"
    echo ""
    echo -e "${YELLOW}After running the sudo command, press Enter to continue...${NC}"
    read -r
else
    # Try to run the command directly if no sudo needed
    STARTUP_CMD=$(cat /tmp/pm2-startup.txt | grep -v "PM2" | grep -v "Copy" | grep -v "paste" | head -1)
    if [ ! -z "$STARTUP_CMD" ]; then
        eval "$STARTUP_CMD" 2>/dev/null || true
    fi
fi

# Verify systemd service exists
if systemctl list-units --type=service --user 2>/dev/null | grep -q "pm2-$CURRENT_USER.service" || \
   systemctl list-units --type=service 2>/dev/null | grep -q "pm2-$CURRENT_USER.service"; then
    echo -e "${GREEN}✅ Systemd service configured${NC}"
else
    echo -e "${YELLOW}⚠️  Systemd service not found. This is okay if you're using cron instead.${NC}"
fi
echo ""

# Step 10: Setup cron-based monitoring as backup
echo "Step 10: Setting up cron-based monitoring (backup)..."
cd "$APP_DIR"

# Create monitoring script
cat > "$APP_DIR/deploy/pm2-health-check.sh" << 'EOF'
#!/bin/bash
# Health check script for PM2 processes
# Runs every 2 minutes via cron

export PATH="$PATH:/usr/bin:/usr/local/bin"
LOG_FILE="$HOME/logs/pm2-health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$HOME/logs"

APP_DIR="$HOME/optiohire"
[ ! -d "$APP_DIR" ] && APP_DIR="/opt/optiohire"

# Check PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo "[$DATE] PM2 not found" >> "$LOG_FILE"
    exit 1
fi

# Check backend health
if ! pm2 list 2>/dev/null | grep -q "optiohire-backend.*online"; then
    echo "[$DATE] Backend offline, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR"
    pm2 start deploy/ecosystem.config.js --only optiohire-backend --update-env >> "$LOG_FILE" 2>&1
fi

# Check frontend health
if ! pm2 list 2>/dev/null | grep -q "optiohire-frontend.*online"; then
    echo "[$DATE] Frontend offline, restarting..." >> "$LOG_FILE"
    cd "$APP_DIR"
    pm2 start deploy/ecosystem.config.js --only optiohire-frontend >> "$LOG_FILE" 2>&1
fi

# Save PM2 state
pm2 save --force >> "$LOG_FILE" 2>&1 || true
EOF

chmod +x "$APP_DIR/deploy/pm2-health-check.sh"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -v "pm2-health-check.sh"; echo "*/2 * * * * $APP_DIR/deploy/pm2-health-check.sh >> $HOME/logs/cron.log 2>&1") | crontab -

echo -e "${GREEN}✅ Cron monitoring configured (runs every 2 minutes)${NC}"
echo ""

# Step 11: Verify services are running
echo "Step 11: Verifying services..."
sleep 2

echo "PM2 Status:"
pm2 list
echo ""

# Test backend health
echo "Testing backend health endpoint..."
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may need a moment to start)${NC}"
fi

# Test frontend
echo "Testing frontend..."
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed (may need a moment to start)${NC}"
fi
echo ""

# Step 12: Display useful commands
echo "=========================================="
echo -e "${GREEN}✅ Production Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Useful Commands:"
echo "  View status:        pm2 list"
echo "  View logs:         pm2 logs"
echo "  Restart all:       pm2 restart all"
echo "  Stop all:          pm2 stop all"
echo "  Monitor:           pm2 monit"
echo ""
echo "Log Files:"
echo "  Backend:           $HOME/logs/backend-combined.log"
echo "  Frontend:          $HOME/logs/frontend-combined.log"
echo "  Health checks:     $HOME/logs/pm2-health-check.log"
echo ""
echo "Service Management:"
echo "  Check systemd:     systemctl status pm2-$CURRENT_USER"
echo "  Enable on boot:    systemctl enable pm2-$CURRENT_USER"
echo ""
echo -e "${GREEN}Your application is now running 24/7!${NC}"
echo ""

