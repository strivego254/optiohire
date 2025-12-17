#!/bin/bash
# Verify DATABASE_URL connection (no secrets in repo)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

echo "=== Current backend/.env DATABASE_URL (masked) ==="
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

MASKED="$(echo "$DATABASE_URL" | sed -E 's#(postgresql://[^:]+:)[^@]+(@)#\\1***\\2#')"
echo "$MASKED"

echo ""
echo "=== Testing PostgreSQL connection via DATABASE_URL ==="
psql "$DATABASE_URL" -c "SELECT current_database(), current_user, version();" 2>&1

echo ""
echo "✅ Connection OK"

