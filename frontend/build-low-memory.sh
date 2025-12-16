#!/bin/bash

# Memory-optimized build script for low-memory servers (1GB RAM)
# This script handles memory constraints during Next.js builds

set -e

echo "🚀 Starting memory-optimized build process..."

# Check if swap is available
if ! swapon --show | grep -q .; then
    echo "⚠️  Warning: No swap space detected. Consider adding swap for better build stability."
    echo "   Run: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
fi

# Clean previous build artifacts to free memory
echo "🧹 Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=1536"

# Increase Node.js max memory for child processes
export NODE_OPTIONS="$NODE_OPTIONS --max-semi-space-size=128"

# Run build with memory optimizations
echo "📦 Building Next.js application..."
npm run build:low-memory

echo "✅ Build completed successfully!"

