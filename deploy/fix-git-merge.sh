#!/bin/bash
# Fix git merge conflict by removing conflicting files and pulling

echo "Fixing git merge conflict..."
echo ""

cd ~/optiohire || exit 1

# Backup existing files if they exist
if [ -f "deploy/pm2-monitor.sh" ]; then
    echo "Backing up existing pm2-monitor.sh..."
    mv deploy/pm2-monitor.sh deploy/pm2-monitor.sh.backup
fi

if [ -f "deploy/start-all.sh" ]; then
    echo "Backing up existing start-all.sh..."
    mv deploy/start-all.sh deploy/start-all.sh.backup
fi

# Now pull
echo "Pulling latest changes..."
git pull origin main

echo ""
echo "✅ Git pull complete!"
echo ""
echo "Now run:"
echo "  chmod +x deploy/setup-production-24-7.sh"
echo "  ./deploy/setup-production-24-7.sh"

