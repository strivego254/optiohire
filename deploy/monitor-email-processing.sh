#!/bin/bash

echo "📧 Real-Time Email Processing Monitor"
echo "======================================"
echo ""
echo "Watching for new applications being processed..."
echo "Press Ctrl+C to stop"
echo ""
echo "----------------------------------------"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Monitor PM2 logs in real-time, filtering for email processing events
pm2 logs optiohire-backend --lines 0 --nostream | tail -20

echo ""
echo "Starting real-time monitoring..."
echo ""

# Watch for key events
pm2 logs optiohire-backend --lines 0 | grep --line-buffered -E "(Found.*unread|MATCH FOUND|Processing email|Successfully processed|NO MATCH|Error|FLAGGED|SHORTLIST|REJECT)" | while read line; do
    if echo "$line" | grep -q "Found.*unread"; then
        echo "${GREEN}📬 $(echo "$line" | sed 's/.*Found/Found/')${NC}"
    elif echo "$line" | grep -q "MATCH FOUND"; then
        echo "${GREEN}✅ $(echo "$line" | sed 's/.*MATCH FOUND/MATCH FOUND/')${NC}"
    elif echo "$line" | grep -q "Processing email"; then
        echo "${GREEN}📧 $(echo "$line" | sed 's/.*Processing email/Processing email/')${NC}"
    elif echo "$line" | grep -q "Successfully processed"; then
        echo "${GREEN}✅ $(echo "$line" | sed 's/.*Successfully processed/Successfully processed/')${NC}"
    elif echo "$line" | grep -q "NO MATCH"; then
        echo "${YELLOW}⚠️  $(echo "$line" | sed 's/.*NO MATCH/NO MATCH/')${NC}"
    elif echo "$line" | grep -q "FLAGGED\|SHORTLIST\|REJECT"; then
        echo "${GREEN}📊 $(echo "$line" | sed 's/.*Processed CV/Processed CV/')${NC}"
    elif echo "$line" | grep -q "Error"; then
        echo "${YELLOW}❌ $(echo "$line" | sed 's/.*Error/Error/')${NC}"
    fi
done

