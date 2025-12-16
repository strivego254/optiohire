#!/bin/bash
# Test database connection

DB_USER="hirebit_user"
DB_PASSWORD="HireBit@254#.$"
DB_NAME="hirebit"

echo "Testing database connection..."

# Test 1: Direct connection
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" 2>&1

echo ""
echo "---"
echo ""

# Test 2: Check if user exists
sudo -u postgres psql -c "\du" | grep "$DB_USER"

echo ""
echo "---"
echo ""

# Test 3: Check if database exists
sudo -u postgres psql -c "\l" | grep "$DB_NAME"

echo ""
echo "---"
echo ""

# Test 4: Try with URL-encoded password in connection string
echo "Testing with URL-encoded connection string..."
PGPASSWORD="$DB_PASSWORD" psql "postgresql://hirebit_user:HireBit%40254%23.%24@localhost:5432/hirebit" -c "SELECT current_database(), current_user;"

