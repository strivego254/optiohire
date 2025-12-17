#!/bin/bash
# Test database connection (no secrets in repo)
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

echo "Testing database connection..."

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Using DATABASE_URL from $ENV_FILE"
  # Do not print full URL (it may contain password)
  MASKED="$(echo "$DATABASE_URL" | sed -E 's#(postgresql://[^:]+:)[^@]+(@)#\\1***\\2#')"
  echo "DATABASE_URL (masked): $MASKED"
  echo ""
  psql "$DATABASE_URL" -c "SELECT current_database(), current_user, version();" 2>&1
  exit 0
fi

# Fallback to individual vars (if you use them)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-hirebit_user}"
DB_NAME="${DB_NAME:-hirebit}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: DATABASE_URL is not set and DB_PASSWORD is empty."
  echo "Set DATABASE_URL in backend/.env (recommended), or set DB_PASSWORD/DB_USER/DB_NAME."
  exit 1
fi

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT current_database(), current_user, version();" 2>&1


