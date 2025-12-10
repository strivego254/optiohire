#!/bin/bash
set -e

echo "🚀 Setting up OptioHire production server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
echo -e "${YELLOW}Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt-get install -y nginx

# Install PostgreSQL client (for database migrations)
echo -e "${YELLOW}Installing PostgreSQL client...${NC}"
apt-get install -y postgresql-client

# Install build essentials (for native modules)
echo -e "${YELLOW}Installing build essentials...${NC}"
apt-get install -y build-essential python3

# Install Git
echo -e "${YELLOW}Installing Git...${NC}"
apt-get install -y git

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /opt/optiohire
mkdir -p /var/log/optiohire
chown -R $SUDO_USER:$SUDO_USER /opt/optiohire
chown -R $SUDO_USER:$SUDO_USER /var/log/optiohire

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Setup PM2 startup script
echo -e "${YELLOW}Setting up PM2 startup script...${NC}"
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo -e "${GREEN}✅ Server setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy your application files to /opt/optiohire"
echo "2. Install dependencies: cd /opt/optiohire/backend && npm install"
echo "3. Install dependencies: cd /opt/optiohire/frontend && npm install"
echo "4. Build backend: cd /opt/optiohire/backend && npm run build"
echo "5. Build frontend: cd /opt/optiohire/frontend && npm run build"
echo "6. Copy environment files (.env) to backend and frontend directories"
echo "7. Copy nginx.conf to /etc/nginx/sites-available/optiohire"
echo "8. Enable nginx site: ln -s /etc/nginx/sites-available/optiohire /etc/nginx/sites-enabled/"
echo "9. Start PM2: pm2 start /opt/optiohire/deploy/ecosystem.config.js"
echo "10. Save PM2: pm2 save"

