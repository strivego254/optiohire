#!/bin/bash
# Fix DATABASE_URL in .env file

cd ~/optiohire/backend

# Remove duplicate DATABASE_URL= prefix and fix URL encoding
sed -i 's|^DATABASE_URL=DATABASE_URL=|DATABASE_URL=|' .env
sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://hirebit_user:HireBit%40254%23.%24@localhost:5432/hirebit|' .env
sed -i 's|^DB_SSL=.*|DB_SSL=false|' .env

echo "✅ Fixed .env file"
echo "Current DATABASE_URL:"
grep "^DATABASE_URL=" .env


