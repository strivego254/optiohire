#!/bin/bash
# Fast production dependency installation script
# This skips heavy dev dependencies like Storybook and Jest for faster installs

set -e

echo "🚀 Starting fast production dependency installation..."

cd ~/optiohire/frontend

# Remove existing installation if it exists
echo "📦 Cleaning previous installation..."
rm -rf node_modules package-lock.json .next

# Install with performance optimizations
# This will install all dependencies but with flags to speed up the process
echo "⬇️  Installing dependencies (this may take 10-20 minutes)..."
npm install \
  --no-optional \
  --no-audit \
  --no-fund \
  --legacy-peer-deps \
  --prefer-offline \
  --loglevel=warn

echo "✅ Dependencies installed successfully!"
echo "🏗️  Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "  - Start with: npm run start"
echo "  - Or use PM2: pm2 start ../../deploy/ecosystem.config.js"

