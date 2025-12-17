#!/bin/bash

# ============================================================================
# PostgreSQL Database Viewer Script
# ============================================================================
# This script helps you view tables and data in your local PostgreSQL database
# Usage: ./scripts/view-database.sh [command]
# ============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ----------------------------------------------------------------------------
# Load backend environment variables (preferred)
# - Never hardcode passwords in this repo.
# - Prefer DATABASE_URL from backend/.env so scripts match the running backend.
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

# Fallback database configuration (only if DATABASE_URL is not set)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hirebit}"
DB_USER="${DB_USER:-hirebit_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

psql_cmd() {
    if [ -n "${DATABASE_URL:-}" ]; then
        # Use connection string directly (supports URL-encoded passwords)
        psql "$DATABASE_URL" "$@"
        return $?
    fi

    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL is not set and DB_PASSWORD is empty.${NC}"
        echo -e "${YELLOW}Set DATABASE_URL in backend/.env (recommended) or export DB_PASSWORD before running this script.${NC}"
        return 1
    fi

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Function to list all tables
list_tables() {
    if [ -n "${DATABASE_URL:-}" ]; then
        echo -e "${BLUE}📊 Listing all tables using DATABASE_URL${NC}"
    else
        echo -e "${BLUE}📊 Listing all tables in database: ${DB_NAME}${NC}"
    fi
    echo ""
    psql_cmd -c "\dt"
}

# Function to show table structure
show_table_structure() {
    if [ -z "$1" ]; then
        echo -e "${YELLOW}⚠️  Please provide a table name${NC}"
        echo "Usage: $0 structure <table_name>"
        echo "Example: $0 structure users"
        exit 1
    fi
    echo -e "${BLUE}📋 Structure of table: $1${NC}"
    echo ""
    psql_cmd -c "\d $1"
}

# Function to view table data
view_table_data() {
    if [ -z "$1" ]; then
        echo -e "${YELLOW}⚠️  Please provide a table name${NC}"
        echo "Usage: $0 data <table_name> [limit]"
        echo "Example: $0 data users"
        echo "Example: $0 data users 10"
        exit 1
    fi
    
    LIMIT=${2:-20}
    echo -e "${BLUE}📄 Data from table: $1 (showing first $LIMIT rows)${NC}"
    echo ""
    psql_cmd -c "SELECT * FROM $1 LIMIT $LIMIT;"
}

# Function to count rows in table
count_rows() {
    if [ -z "$1" ]; then
        echo -e "${YELLOW}⚠️  Please provide a table name${NC}"
        echo "Usage: $0 count <table_name>"
        exit 1
    fi
    echo -e "${BLUE}🔢 Row count in table: $1${NC}"
    echo ""
    psql_cmd -c "SELECT COUNT(*) as total_rows FROM $1;"
}

# Function to show all data from a table (no limit)
view_all_data() {
    if [ -z "$1" ]; then
        echo -e "${YELLOW}⚠️  Please provide a table name${NC}"
        echo "Usage: $0 all <table_name>"
        exit 1
    fi
    echo -e "${BLUE}📄 All data from table: $1${NC}"
    echo ""
    psql_cmd -c "SELECT * FROM $1;"
}

# Function to show database info
show_db_info() {
    echo -e "${BLUE}ℹ️  Database Information${NC}"
    echo ""
    if [ -n "${DATABASE_URL:-}" ]; then
        echo "Connection: DATABASE_URL"
    else
        echo "Database: $DB_NAME"
        echo "User: $DB_USER"
        echo "Host: $DB_HOST"
        echo "Port: $DB_PORT"
    fi
    echo ""
    psql_cmd -c "SELECT version();"
    echo ""
    if [ -n "${DATABASE_URL:-}" ]; then
        # Works for any DB in DATABASE_URL
        psql_cmd -c "SELECT current_database() AS db, pg_size_pretty(pg_database_size(current_database())) AS size;"
    else
        psql_cmd -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database WHERE datname = '$DB_NAME';"
    fi
}

# Function to show help
show_help() {
    echo -e "${GREEN}PostgreSQL Database Viewer${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  tables                    - List all tables"
    echo "  structure <table>         - Show table structure"
    echo "  data <table> [limit]      - View table data (default: 20 rows)"
    echo "  all <table>               - View all data from table"
    echo "  count <table>             - Count rows in table"
    echo "  info                      - Show database information"
    echo "  connect                   - Connect to database interactively"
    echo "  help                      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 tables"
    echo "  $0 structure users"
    echo "  $0 data users 10"
    echo "  $0 count applications"
    echo "  $0 connect"
    echo ""
}

# Function to connect interactively
connect_db() {
    echo -e "${GREEN}🔌 Connecting to database...${NC}"
    echo "Type '\\q' to exit"
    echo ""
    psql_cmd
}

# Main command handler
case "$1" in
    tables)
        list_tables
        ;;
    structure)
        show_table_structure "$2"
        ;;
    data)
        view_table_data "$2" "$3"
        ;;
    all)
        view_all_data "$2"
        ;;
    count)
        count_rows "$2"
        ;;
    info)
        show_db_info
        ;;
    connect)
        connect_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            echo -e "${YELLOW}Unknown command: $1${NC}"
            echo ""
            show_help
        fi
        ;;
esac
