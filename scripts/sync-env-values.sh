#!/bin/bash
# Sync actual VALUES from backend/.env to root .env.local

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f "backend/.env" ]; then
  echo "❌ backend/.env not found"
  exit 1
fi

echo "🔄 Syncing VALUES from backend/.env to root .env.local..."
echo ""

# Create root .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
  touch .env.local
fi

# Read all key=value pairs from backend/.env and update root .env.local
updated=0
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove any existing entry for this key in root .env.local
  if grep -q "^${key}=" .env.local 2>/dev/null; then
    # Update existing value
    sed -i "s|^${key}=.*|${key}=${value}|" .env.local 2>/dev/null || \
    sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local
    updated=$((updated + 1))
  else
    # Add new key=value
    echo "${key}=${value}" >> .env.local
    updated=$((updated + 1))
  fi
done < <(grep -v "^#" backend/.env | grep -v "^$" | grep "=")

echo "✅ Updated $updated variables in root .env.local"
echo ""

# Also create/update root .env as master copy (with placeholder values from env.example)
if [ ! -f ".env" ]; then
  echo "📝 Creating root .env (master template)..."
  cp env.example .env 2>/dev/null || touch .env
fi

echo "✅ Sync complete!"
