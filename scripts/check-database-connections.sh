#!/bin/bash
# Check which databases frontend and backend are connecting to

echo "🔍 Checking Database Connections"
echo "=================================="
echo ""

echo "📦 Backend Database:"
echo "-------------------"
cd backend
if [ -f .env ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | head -1)
    DB_SSL=$(grep "^DB_SSL=" .env | cut -d'=' -f2- | head -1)
    
    if [ -n "$DATABASE_URL" ]; then
        # Mask password in connection string
        MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
        echo "DATABASE_URL: $MASKED_URL"
        echo "DB_SSL: ${DB_SSL:-not set}"
        
        # Extract database name
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        echo "Database Name: $DB_NAME"
    else
        echo "❌ DATABASE_URL not found in backend/.env"
    fi
else
    echo "❌ backend/.env not found"
fi

echo ""
echo "🌐 Frontend Database:"
echo "---------------------"
cd ../frontend
if [ -f .env.local ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | head -1)
    DB_SSL=$(grep "^DB_SSL=" .env.local | cut -d'=' -f2- | head -1)
    
    if [ -n "$DATABASE_URL" ]; then
        # Mask password in connection string
        MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
        echo "DATABASE_URL: $MASKED_URL"
        echo "DB_SSL: ${DB_SSL:-not set}"
        
        # Extract database name
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        echo "Database Name: $DB_NAME"
    else
        echo "❌ DATABASE_URL not found in frontend/.env.local"
    fi
else
    echo "❌ frontend/.env.local not found"
fi

echo ""
echo "=================================="
echo ""

# Check if they match
cd ../backend
BACKEND_DB=$(grep "^DATABASE_URL=" .env 2>/dev/null | cut -d'=' -f2- | sed -n 's/.*\/\([^?]*\).*/\1/p')
cd ../frontend
FRONTEND_DB=$(grep "^DATABASE_URL=" .env.local 2>/dev/null | cut -d'=' -f2- | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -n "$BACKEND_DB" ] && [ -n "$FRONTEND_DB" ]; then
    if [ "$BACKEND_DB" = "$FRONTEND_DB" ]; then
        echo "✅ Both are using the same database: $BACKEND_DB"
    else
        echo "❌ DATABASE MISMATCH!"
        echo "   Backend:  $BACKEND_DB"
        echo "   Frontend: $FRONTEND_DB"
        echo ""
        echo "   This is why jobs appear in dashboard but email reader can't find them!"
        echo "   Solution: Update frontend/.env.local to use the same DATABASE_URL as backend/.env"
    fi
fi

