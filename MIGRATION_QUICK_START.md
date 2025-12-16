# Migration Quick Start Guide

## 🎯 Your Plan: Local → GitHub → Server

This is the **perfect approach**! Here's the quick start guide.

---

## ✅ Step-by-Step Summary

### **Phase 1: Local Development (Your Machine)**

1. **Install PostgreSQL locally**
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Run setup script**
   ```bash
   cd backend
   ./scripts/setup-local-db.sh
   ```
   This will:
   - Create `hirebit_local` database
   - Create `hirebit_user` user
   - Run the schema
   - Create/update `.env.local`

3. **Copy environment variables**
   ```bash
   # Copy from .env to .env.local, then update:
   # DATABASE_URL=postgresql://hirebit_user:password@localhost:5432/hirebit_local
   # DB_SSL=false
   ```

4. **Test locally**
   ```bash
   cd backend
   npm run dev
   
   # Test connection
   curl http://localhost:3001/health/db
   ```

### **Phase 2: Commit to GitHub**

1. **Review changes**
   ```bash
   git status
   git diff backend/src/db/index.ts
   ```

2. **Commit**
   ```bash
   git add backend/src/db/index.ts
   git add backend/scripts/setup-local-db.sh
   git add ARCHITECTURE_MIGRATION_GUIDE.md
   git add LOCAL_DEVELOPMENT_MIGRATION.md
   git add MIGRATION_QUICK_START.md
   
   git commit -m "feat: migrate database from Supabase to local PostgreSQL

   - Update database connection to support local PostgreSQL
   - Add local development setup script
   - Update SSL configuration for local development
   - Keep Supabase Storage for CV files"
   ```

3. **Push**
   ```bash
   git push origin main
   ```

### **Phase 3: Deploy to Server**

1. **SSH to server**
   ```bash
   ssh optiohire@134.122.1.7
   ```

2. **Pull latest code**
   ```bash
   cd /path/to/optiohire
   git pull origin main
   ```

3. **Install PostgreSQL** (if not installed)
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

4. **Create production database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE hirebit;
   CREATE USER hirebit_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE hirebit TO hirebit_user;
   \q
   ```

5. **Run schema**
   ```bash
   cd backend
   psql -h localhost -U hirebit_user -d hirebit -f src/db/complete_schema.sql
   ```

6. **Migrate data from Supabase**
   ```bash
   # Export from Supabase
   pg_dump -h db.qijibjotmwbikzwtkcut.supabase.co \
           -U postgres \
           -d postgres \
           --data-only \
           --inserts \
           > data_export.sql
   
   # Import to local PostgreSQL
   psql -h localhost -U hirebit_user -d hirebit -f data_export.sql
   ```

7. **Update production .env**
   ```bash
   # Edit backend/.env
   DATABASE_URL=postgresql://hirebit_user:secure_password@localhost:5432/hirebit
   DB_SSL=false
   
   # Keep Supabase Storage variables (no change)
   ```

8. **Restart backend**
   ```bash
   pm2 restart backend
   # or
   sudo systemctl restart optiohire-backend
   ```

9. **Test**
   ```bash
   curl http://localhost:3001/health/db
   ```

---

## 📝 Files Changed

### **Code Changes:**
- ✅ `backend/src/db/index.ts` - Updated SSL configuration

### **New Files:**
- ✅ `backend/scripts/setup-local-db.sh` - Local setup script
- ✅ `ARCHITECTURE_MIGRATION_GUIDE.md` - Detailed architecture guide
- ✅ `LOCAL_DEVELOPMENT_MIGRATION.md` - Step-by-step migration plan
- ✅ `MIGRATION_QUICK_START.md` - This file

### **Environment Files (NOT committed):**
- ⚠️ `backend/.env.local` - Local development (gitignored)
- ⚠️ `backend/.env` - Production (managed on server)

---

## 🎯 Key Points

1. **Test locally first** - Catch issues before production
2. **Version control** - All changes tracked in GitHub
3. **Safe rollback** - Can revert if needed
4. **Keep Supabase Storage** - CV files stay in Supabase
5. **Minimal code changes** - Only database connection updated

---

## ✅ Checklist

### **Local:**
- [ ] Install PostgreSQL
- [ ] Run setup script
- [ ] Update `.env.local`
- [ ] Test database connection
- [ ] Test authentication
- [ ] Test all features

### **GitHub:**
- [ ] Review changes
- [ ] Commit code changes
- [ ] Push to GitHub

### **Production:**
- [ ] Pull latest code
- [ ] Install PostgreSQL (if needed)
- [ ] Create database
- [ ] Run schema
- [ ] Migrate data
- [ ] Update `.env`
- [ ] Restart backend
- [ ] Test production

---

## 🚀 Ready to Start?

1. Start with **Phase 1** (Local Development)
2. Test everything works locally
3. Then proceed to **Phase 2** (GitHub)
4. Finally **Phase 3** (Server)

Good luck! 🎉

