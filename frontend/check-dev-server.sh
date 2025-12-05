#!/bin/bash
echo "Checking dev server status..."
ps aux | grep "next dev" | grep -v grep
echo ""
echo "Checking port 3000..."
netstat -tlnp 2>/dev/null | grep :3000 || lsof -i :3000 2>/dev/null
echo ""
echo "Testing HTTP response..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000
