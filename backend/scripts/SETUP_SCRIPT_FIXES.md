# Setup Script Fixes

## Issues Fixed

### 1. **PostgreSQL Authentication Error**
**Problem**: On Linux, PostgreSQL uses peer authentication by default, which requires using `sudo -u postgres` instead of `psql -U postgres`.

**Fix**: Added OS detection to automatically use the correct command:
- **Linux**: Uses `sudo -u postgres psql` 
- **macOS**: Uses `psql -U postgres`

### 2. **Database Existence Check**
**Problem**: The check was trying to run as the current user instead of postgres.

**Fix**: Now uses the correct command based on OS detection.

### 3. **Long Separator Line**
**Problem**: Extremely long unicode separator line causing script issues.

**Fix**: Replaced with simple empty line.

---

## Before Running the Script

### Ensure PostgreSQL is Running

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Enable auto-start on boot
```

---

## Running the Script

```bash
cd backend
./scripts/setup-local-db.sh
```

The script will now:
1. ✅ Detect Linux and use `sudo -u postgres` automatically
2. ✅ Create database and user with proper permissions
3. ✅ Run the schema successfully
4. ✅ Create/update `.env.local` file

---

## If You Still Get Errors

### Error: "Peer authentication failed"
This means PostgreSQL is not allowing peer authentication. Try:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# If needed, restart PostgreSQL
sudo systemctl restart postgresql
```

### Error: "Permission denied"
Make sure you have sudo privileges:

```bash
# Test sudo access
sudo -v
```

### Manual Setup (Alternative)
If the script still doesn't work, you can set up manually:

```bash
# Connect as postgres user
sudo -u postgres psql

# Run these commands:
CREATE DATABASE hirebit_local;
CREATE USER hirebit_user WITH PASSWORD 'hirebit_local_dev';
GRANT ALL PRIVILEGES ON DATABASE hirebit_local TO hirebit_user;
\q

# Run schema
cd backend
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -f src/db/complete_schema.sql
```

---

## Success Indicators

When the script runs successfully, you should see:
- ✅ PostgreSQL is installed
- ✅ Detected Linux - using sudo for PostgreSQL operations
- ✅ Database and user created
- ✅ Schema applied successfully
- ✅ Created/Updated .env.local

Then you can test:
```bash
npm run dev
curl http://localhost:3001/health/db
```

