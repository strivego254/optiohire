#!/bin/bash

# ============================================================================
# Local PostgreSQL Setup Script
# ============================================================================
# This script helps set up a local PostgreSQL database for development
# Usage: ./scripts/setup-local-db.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Setting up local PostgreSQL database for HireBit development..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS:   brew install postgresql@15"
    echo "  Linux:   sudo apt install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Database configuration
DB_NAME="hirebit_local"
DB_USER="hirebit_user"
DB_PASSWORD="${DB_PASSWORD:-hirebit_local_dev}"  # Default password, can override with env var

echo ""
echo "Database configuration:"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""

# Detect OS and set PostgreSQL command prefix
# On Linux, we need to use sudo -u postgres for peer authentication
# On macOS, we can use psql -U postgres directly
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PSQL_CMD="sudo -u postgres psql"
    PSQL_LIST_CMD="sudo -u postgres psql -lqt"
    echo -e "${YELLOW}ℹ️  Detected Linux - using sudo for PostgreSQL operations${NC}"
    echo ""
else
    PSQL_CMD="psql -U postgres"
    PSQL_LIST_CMD="psql -U postgres -lqt"
fi

# Check if database already exists
DB_EXISTS=false
if $PSQL_LIST_CMD 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    DB_EXISTS=true
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        $PSQL_CMD -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        $PSQL_CMD -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
        DB_EXISTS=false
    else
        echo "Keeping existing database. Exiting."
        exit 0
    fi
fi

# Create database and user
if [ "$DB_EXISTS" = false ]; then
    echo ""
    echo "Creating database and user..."

    # Create user (if not exists)
    $PSQL_CMD -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"

    # Create database
    $PSQL_CMD -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    # Grant privileges
    $PSQL_CMD -d $DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

    echo -e "${GREEN}✅ Database and user created${NC}"
else
    echo -e "${GREEN}✅ Using existing database${NC}"
fi

# Run schema
echo ""
echo "Running database schema..."
SCHEMA_FILE="src/db/complete_schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply schema${NC}"
    exit 1
fi

# Create .env.local if it doesn't exist
echo ""
echo "Creating .env.local file..."

ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    read -p "Do you want to update DATABASE_URL? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Update DATABASE_URL if it exists, or append if it doesn't
        if grep -q "DATABASE_URL=" "$ENV_FILE"; then
            # Use sed to update (works on macOS and Linux)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME|" "$ENV_FILE"
            else
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME|" "$ENV_FILE"
            fi
            # Update DB_SSL
            if grep -q "DB_SSL=" "$ENV_FILE"; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s|DB_SSL=.*|DB_SSL=false|" "$ENV_FILE"
                else
                    sed -i "s|DB_SSL=.*|DB_SSL=false|" "$ENV_FILE"
                fi
            else
                echo "DB_SSL=false" >> "$ENV_FILE"
            fi
        else
            echo "" >> "$ENV_FILE"
            echo "# Local PostgreSQL Configuration" >> "$ENV_FILE"
            echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME" >> "$ENV_FILE"
            echo "DB_SSL=false" >> "$ENV_FILE"
        fi
        echo -e "${GREEN}✅ Updated .env.local${NC}"
    fi
else
    # Create new .env.local
    cat > "$ENV_FILE" << EOF
# ============================================================================
# LOCAL DEVELOPMENT - PostgreSQL Configuration
# ============================================================================
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
DB_SSL=false

# ============================================================================
# Copy other variables from .env as needed
# ============================================================================
# PORT=3001
# NODE_ENV=development
# JWT_SECRET=your_local_jwt_secret
# etc...
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please copy other environment variables from .env to .env.local${NC}"
fi

# Summary
echo ""
echo ""
echo ""
echo -e "${GREEN}✅ Local database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy other environment variables from .env to .env.local"
echo "  2. Start the backend: npm run dev"
echo "  3. Test the connection: curl http://localhost:3001/health/db"
echo ""

