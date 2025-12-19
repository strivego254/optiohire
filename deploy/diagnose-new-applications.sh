#!/bin/bash

echo "🔍 DIAGNOSING NEW APPLICATION PROCESSING ISSUE"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check PM2 status
echo "1️⃣ Checking PM2 Status..."
echo "------------------------"
pm2 list
echo ""

# 2. Check email reader health
echo "2️⃣ Checking Email Reader Health..."
echo "-----------------------------------"
curl -s http://localhost:3001/health/email-reader | jq '.' 2>/dev/null || curl -s http://localhost:3001/health/email-reader
echo ""
echo ""

# 3. Check recent backend logs for errors
echo "3️⃣ Recent Backend Logs (Last 50 lines)..."
echo "------------------------------------------"
pm2 logs optiohire-backend --lines 50 --nostream | tail -50
echo ""

# 4. Check if email reader is enabled in .env
echo "4️⃣ Checking Email Reader Configuration..."
echo "------------------------------------------"
cd ~/optiohire/backend
if [ -f .env ]; then
    echo "ENABLE_EMAIL_READER: $(grep ENABLE_EMAIL_READER .env || echo 'NOT SET')"
    echo "IMAP_HOST: $(grep IMAP_HOST .env | cut -d'=' -f2 || echo 'NOT SET')"
    echo "IMAP_USER: $(grep IMAP_USER .env | cut -d'=' -f2 | cut -c1-10)***"
else
    echo "${RED}❌ .env file not found${NC}"
fi
echo ""

# 5. Check recent applications in database
echo "5️⃣ Checking Recent Applications (Last 10)..."
echo "---------------------------------------------"
cd ~/optiohire/backend
if [ -f .env ]; then
    # Source .env and export variables
    set -a
    source .env
    set +a
    if [ -n "$DATABASE_PASSWORD" ] && [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_USER" ] && [ -n "$DATABASE_NAME" ]; then
        PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "
            SELECT 
                a.application_id,
                a.created_at,
                a.ai_status,
                a.candidate_email,
                jp.job_title,
                jp.status as job_status
            FROM applications a
            JOIN job_postings jp ON a.job_posting_id = jp.job_posting_id
            ORDER BY a.created_at DESC
            LIMIT 10;
        " 2>/dev/null || echo "${YELLOW}⚠️ Could not query database (check credentials)${NC}"
    else
        echo "${YELLOW}⚠️ Database credentials not found in .env${NC}"
    fi
else
    echo "${YELLOW}⚠️ .env file not found, cannot query database${NC}"
fi
echo ""

# 6. Check active job postings
echo "6️⃣ Checking Active Job Postings..."
echo "-----------------------------------"
cd ~/optiohire/backend
if [ -f .env ]; then
    # Source .env and export variables
    set -a
    source .env
    set +a
    if [ -n "$DATABASE_PASSWORD" ] && [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_USER" ] && [ -n "$DATABASE_NAME" ]; then
        PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "
            SELECT 
                job_posting_id,
                job_title,
                status,
                created_at
            FROM job_postings
            WHERE (status IS NULL OR UPPER(TRIM(status)) = 'ACTIVE' OR status = '')
            ORDER BY created_at DESC
            LIMIT 10;
        " 2>/dev/null || echo "${YELLOW}⚠️ Could not query database (check credentials)${NC}"
    else
        echo "${YELLOW}⚠️ Database credentials not found in .env${NC}"
    fi
else
    echo "${YELLOW}⚠️ .env file not found, cannot query database${NC}"
fi
echo ""

# 7. Check for unprocessed emails (recent logs)
echo "7️⃣ Checking for Email Processing Errors..."
echo "-------------------------------------------"
pm2 logs optiohire-backend --lines 100 --nostream | grep -i "email\|imap\|application\|error" | tail -20
echo ""

# 8. Test email reader connection
echo "8️⃣ Testing Email Reader Connection..."
echo "--------------------------------------"
cd ~/optiohire/backend
if [ -f .env ]; then
    source .env
    if [ "$ENABLE_EMAIL_READER" = "true" ]; then
        echo "${GREEN}✅ Email reader is enabled${NC}"
    else
        echo "${RED}❌ Email reader is DISABLED (ENABLE_EMAIL_READER=$ENABLE_EMAIL_READER)${NC}"
        echo "   To enable: Set ENABLE_EMAIL_READER=true in .env and restart backend"
    fi
else
    echo "${RED}❌ .env file not found${NC}"
fi
echo ""

echo "=============================================="
echo "✅ Diagnosis Complete"
echo ""
echo "💡 Next Steps:"
echo "   1. If email reader is disabled, enable it in .env"
echo "   2. Check if email subject matches job title exactly"
echo "   3. Verify IMAP credentials are correct"
echo "   4. Check Gmail inbox for unread emails"
echo "   5. Review logs for specific errors"
echo ""

