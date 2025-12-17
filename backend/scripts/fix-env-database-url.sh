#!/bin/bash
# Fix DATABASE_URL in .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"

cd "$BACKEND_DIR"

# Remove duplicate DATABASE_URL= prefix and fix URL encoding
sed -i 's|^DATABASE_URL=DATABASE_URL=|DATABASE_URL=|' "$ENV_FILE"

# For local PostgreSQL, DB_SSL should typically be false
if grep -q '^DB_SSL=' "$ENV_FILE"; then
  sed -i 's|^DB_SSL=.*|DB_SSL=false|' "$ENV_FILE"
else
  echo "DB_SSL=false" >> "$ENV_FILE"
fi

echo "✅ Fixed .env file"
echo "Current DATABASE_URL:"
grep "^DATABASE_URL=" "$ENV_FILE" | sed -E 's#(postgresql://[^:]+:)[^@]+(@)#\\1***\\2#'


