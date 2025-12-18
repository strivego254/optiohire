#!/bin/bash
# Quick script to check backend health and email reader status

echo "=========================================="
echo "Backend Health Check"
echo "=========================================="
echo ""

# Check PM2 status
echo "📊 PM2 Status:"
pm2 list
echo ""

# Check if backend is running on port 3001
echo "🔍 Checking backend on port 3001..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
    echo ""
    echo "Health endpoint response:"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
    echo ""
    echo "Email reader status:"
    curl -s http://localhost:3001/health/email-reader | jq . 2>/dev/null || curl -s http://localhost:3001/health/email-reader
else
    echo "❌ Backend is NOT responding on port 3001"
    echo ""
    echo "Checking if port 3001 is in use:"
    netstat -tlnp | grep 3001 || ss -tlnp | grep 3001
    echo ""
    echo "Checking backend logs:"
    pm2 logs optiohire-backend --lines 20 --nostream
fi

echo ""
echo "=========================================="
echo "Through Nginx (if configured):"
echo "=========================================="
echo ""
echo "Try: curl http://optiohire.com/health/email-reader"
echo ""

