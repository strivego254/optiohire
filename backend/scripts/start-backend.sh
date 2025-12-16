#!/bin/bash
# Start backend with PM2

cd ~/optiohire/backend

# Check if dist/server.js exists
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found. Run 'npm run build' first."
    exit 1
fi

# Start with PM2
pm2 start dist/server.js --name backend --update-env

# Save PM2 configuration
pm2 save

echo "✅ Backend started with PM2"
echo "View logs: pm2 logs backend"
echo "View status: pm2 status"


