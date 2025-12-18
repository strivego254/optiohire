# Fix Database Mismatch on Server

## 🔍 Problem
Frontend and backend on server are using different databases, causing email reader to find 0 jobs.

## ✅ Solution: Update Server Configuration

### Step 1: Connect to Server
```bash
ssh root@134.122.1.7
# or
ssh optiohire@134.122.1.7
```

### Step 2: Check Current Database Connections
```bash
cd ~/optiohire
./scripts/check-database-connections.sh
```

This will show which databases frontend and backend are using.

### Step 3: Update Frontend .env.local

```bash
cd ~/optiohire/frontend
nano .env.local
```

**Update DATABASE_URL to match backend:**
- Find the line with `DATABASE_URL=`
- Change it to use the same database as backend (check `backend/.env` for the exact connection string)
- Set `DB_SSL=false` (if using local PostgreSQL) or `DB_SSL=true` (if using Supabase)

**Example (if backend uses local PostgreSQL):**
```env
DATABASE_URL=postgresql://hirebit_user:password@localhost:5432/hirebit_local
DB_SSL=false
```

**Example (if backend uses Supabase):**
```env
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DB_SSL=true
```

### Step 4: Update Backend .env (Polling Interval)

```bash
cd ~/optiohire/backend
nano .env
```

**Ensure IMAP_POLL_MS is set to 1000 (1 second):**
```env
IMAP_POLL_MS=1000
```

### Step 5: Restart Services

```bash
cd ~/optiohire
pm2 restart all --update-env
pm2 save
```

### Step 6: Verify

```bash
# Check database connections match
./scripts/check-database-connections.sh

# Check email reader status
curl http://localhost:3001/health/email-reader

# Check PM2 logs
pm2 logs optiohire-backend --lines 30
```

## 🎯 Expected Result

After fixing:
- ✅ Both frontend and backend use the same database
- ✅ Email reader finds jobs in database
- ✅ Applicants are processed automatically
- ✅ Polling happens every 1 second

