#!/bin/bash
# Verify and fix DATABASE_URL connection

cd ~/optiohire/backend

echo "=== Current .env DATABASE_URL ==="
grep "^DATABASE_URL=" .env || echo "DATABASE_URL not found in .env"

echo ""
echo "=== Testing direct PostgreSQL connection ==="
PGPASSWORD='HireBit@254#.$' psql -h localhost -U hirebit_user -d hirebit -c "SELECT version();" 2>&1

echo ""
echo "=== Fixing DATABASE_URL with proper URL encoding ==="
# Password: HireBit@254#.$ 
# Encoded: HireBit%40254%23.%24
# @ = %40, # = %23, $ = %24, . = . (safe)

# Backup .env
cp .env .env.backup

# Fix DATABASE_URL
sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://hirebit_user:HireBit%40254%23.%24@localhost:5432/hirebit|' .env
sed -i 's|^DB_SSL=.*|DB_SSL=false|' .env

echo "✅ Updated .env file"
echo ""
echo "=== New DATABASE_URL ==="
grep "^DATABASE_URL=" .env
grep "^DB_SSL=" .env

echo ""
echo "=== Testing connection string parsing ==="
node -e "
const url = 'postgresql://hirebit_user:HireBit%40254%23.%24@localhost:5432/hirebit';
const parsed = new URL(url);
console.log('Parsed hostname:', parsed.hostname);
console.log('Parsed username:', parsed.username);
console.log('Parsed password (decoded):', decodeURIComponent(parsed.password));
console.log('Parsed database:', parsed.pathname.slice(1));
"

