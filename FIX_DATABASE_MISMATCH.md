# Fix Database Mismatch Issue

## 🔍 Problem Identified

Your **frontend** and **backend** are using **different databases**:

- **Backend**: `hirebit_local` (local PostgreSQL on localhost)
- **Frontend**: Supabase (remote cloud database)

This is why:
- ✅ Jobs appear in your dashboard (frontend reads from Supabase)
- ❌ Email reader finds 0 jobs (backend reads from local PostgreSQL which is empty)

## ✅ Solution: Use Same Database for Both

You need to update `frontend/.env.local` to use the same database as the backend.

### Step 1: Update Frontend .env.local

Edit `frontend/.env.local` and change:

**FROM (Supabase):**
```env
DATABASE_URL=postgresql://postgres.qijibjotmwbikzwtkcut:***@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
DB_SSL=true
```

**TO (Local PostgreSQL - same as backend):**
```env
DATABASE_URL=postgresql://hirebit_user:hirebit_local_dev@localhost:5432/hirebit_local
DB_SSL=false
```

### Step 2: Restart Frontend

```bash
cd frontend
# Stop the dev server (Ctrl+C if running)
npm run dev
```

### Step 3: Verify

After restarting, check:
1. Dashboard should still show your jobs (if they exist in local DB)
2. Email reader should now find the jobs

## ⚠️ Important: Data Migration

**If your jobs are currently in Supabase**, you have two options:

### Option A: Migrate Data from Supabase to Local PostgreSQL

1. Export jobs from Supabase
2. Import into local PostgreSQL
3. Update frontend to use local database

### Option B: Recreate Jobs in Local Database

1. Update frontend to use local database
2. Recreate your job postings through the dashboard
3. They will now be in the local database that both frontend and backend use

## 🧪 Quick Test

After updating, run this to verify both are using the same database:

```bash
./scripts/check-database-connections.sh
```

Should show: `✅ Both are using the same database: hirebit_local`

## 📝 Summary

**Root Cause**: Frontend and backend using different databases
**Fix**: Update `frontend/.env.local` DATABASE_URL to match `backend/.env`
**Result**: Both will use local PostgreSQL, email reader will find jobs

