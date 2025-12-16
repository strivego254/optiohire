# Local Development Migration Plan

## 🎯 Strategy: Local → GitHub → Server

This document outlines the step-by-step plan to migrate from Supabase to local PostgreSQL, starting with localhost development, then pushing to GitHub, and finally deploying to the production server.

---

## 📋 Phase 1: Local Development Setup

### **Step 1: Install PostgreSQL Locally**

#### **On macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or using Postgres.app (GUI)
# Download from: https://postgresapp.com/
```

#### **On Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **On Windows:**
```bash
# Download installer from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

### **Step 2: Create Local Database**

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE hirebit_local;
CREATE USER hirebit_user WITH PASSWORD 'your_local_password';
GRANT ALL PRIVILEGES ON DATABASE hirebit_local TO hirebit_user;

# Exit
\q
```

### **Step 3: Test Connection**

```bash
psql -h localhost -U hirebit_user -d hirebit_local
# Enter password when prompted
# Type \q to exit
```

---

## 📋 Phase 2: Local Environment Configuration

### **Step 1: Create Local Backend `.env`**

Create `backend/.env.local` (for local development):

```bash
# ============================================================================
# LOCAL DEVELOPMENT - PostgreSQL Configuration
# ============================================================================
DATABASE_URL=postgresql://hirebit_user:your_local_password@localhost:5432/hirebit_local
DB_SSL=false

# ============================================================================
# Keep Supabase Storage for CVs (or use local storage for testing)
# ============================================================================
# Option 1: Use Supabase Storage (recommended - same as production)
S3_BUCKET=resumes
S3_ACCESS_KEY=your_supabase_access_key
S3_SECRET_KEY=your_supabase_secret_key
S3_ENDPOINT=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET_URL=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/object/public/resumes

# Option 2: Use Local Storage (for testing without Supabase)
# FILE_STORAGE_DIR=./storage
# (Comment out S3_* variables above)

# ============================================================================
# Backend Server Configuration
# ============================================================================
PORT=3001
NODE_ENV=development
JWT_SECRET=your_local_jwt_secret

# ============================================================================
# Other configurations (keep as-is)
# ============================================================================
# Email, IMAP, AI, etc. - same as before
```

### **Step 2: Update `.gitignore`**

Ensure `.env.local` is ignored:

```bash
# In backend/.gitignore
.env.local
.env.development
```

---

## 📋 Phase 3: Run Schema on Local Database

### **Step 1: Run Complete Schema**

```bash
cd backend
psql -h localhost -U hirebit_user -d hirebit_local -f src/db/complete_schema.sql
```

### **Step 2: Verify Tables Created**

```bash
psql -h localhost -U hirebit_user -d hirebit_local -c "\dt"
# Should show all tables: users, companies, job_postings, applications, etc.
```

---

## 📋 Phase 4: Update Code for Local PostgreSQL

### **Step 1: Update Database Connection**

**File**: `backend/src/db/index.ts`

```typescript
import pg from 'pg'
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

export const pool = new Pool({
  connectionString,
  // SSL only for remote connections (Supabase), not local
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}
```

### **Step 2: Create Seed Data Script (Optional)**

Create `backend/scripts/seed-local.ts`:

```typescript
import { query } from '../src/db/index.js'
import bcrypt from 'bcrypt'

async function seedLocal() {
  try {
    // Create admin user
    const passwordHash = await bcrypt.hash('Admin@hirebit2025', 10)
    
    await query(`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['hirebitapplications@gmail.com', passwordHash, 'admin', true])
    
    console.log('✅ Local database seeded successfully')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedLocal()
```

Run it:
```bash
cd backend
tsx scripts/seed-local.ts
```

---

## 📋 Phase 5: Test Locally

### **Step 1: Start Backend**

```bash
cd backend
npm run dev
```

### **Step 2: Test Database Connection**

```bash
curl http://localhost:3001/health/db
# Should return: {"status":"ok","database":"connected",...}
```

### **Step 3: Test Authentication**

```bash
# Sign up
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "company_role": "hr",
    "organization_name": "Test Company",
    "company_email": "test@company.com"
  }'

# Sign in
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### **Step 4: Test CV Upload**

1. Create a job posting via frontend
2. Send test email with CV attachment
3. Verify CV is saved (to Supabase Storage or local storage)
4. Verify application is saved to local PostgreSQL

---

## 📋 Phase 6: Commit to GitHub

### **Step 1: Review Changes**

```bash
git status
git diff
```

### **Step 2: Stage Changes**

```bash
# Only commit code changes, NOT .env files
git add backend/src/db/index.ts
git add backend/scripts/seed-local.ts
git add ARCHITECTURE_MIGRATION_GUIDE.md
git add LOCAL_DEVELOPMENT_MIGRATION.md
# Add any other code changes
```

### **Step 3: Commit**

```bash
git commit -m "feat: migrate database from Supabase to local PostgreSQL

- Update database connection to support local PostgreSQL
- Add local development setup guide
- Update SSL configuration for local development
- Add seed script for local database
- Keep Supabase Storage for CV files"
```

### **Step 4: Push to GitHub**

```bash
git push origin main
# or
git push origin develop
```

---

## 📋 Phase 7: Deploy to Production Server

### **Step 1: SSH to Server**

```bash
ssh optiohire@134.122.1.7
```

### **Step 2: Pull Latest Code**

```bash
cd /path/to/optiohire
git pull origin main
```

### **Step 3: Install PostgreSQL on Server** (if not already installed)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **Step 4: Create Production Database**

```bash
sudo -u postgres psql

CREATE DATABASE hirebit;
CREATE USER hirebit_user WITH PASSWORD 'your_secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE hirebit TO hirebit_user;
\q
```

### **Step 5: Run Schema on Production**

```bash
cd /path/to/optiohire/backend
psql -h localhost -U hirebit_user -d hirebit -f src/db/complete_schema.sql
```

### **Step 6: Migrate Data from Supabase**

```bash
# Export from Supabase (run from your local machine or server)
pg_dump -h db.qijibjotmwbikzwtkcut.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --inserts \
        > data_export.sql

# Import to production database
psql -h localhost -U hirebit_user -d hirebit -f data_export.sql
```

### **Step 7: Update Production Environment Variables**

Edit `backend/.env` on server:

```bash
# OLD (Supabase)
# DATABASE_URL=postgresql://postgres:...@db.qijibjotmwbikzwtkcut.supabase.co:5432/postgres

# NEW (Local PostgreSQL)
DATABASE_URL=postgresql://hirebit_user:your_secure_production_password@localhost:5432/hirebit
DB_SSL=false

# Keep Supabase Storage (no change)
S3_BUCKET=resumes
S3_ACCESS_KEY=your_supabase_access_key
S3_SECRET_KEY=your_supabase_secret_key
S3_ENDPOINT=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET_URL=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/object/public/resumes
```

### **Step 8: Restart Backend**

```bash
# If using PM2
pm2 restart backend

# Or if using systemd
sudo systemctl restart optiohire-backend

# Or manually
cd backend
npm run build
npm start
```

### **Step 9: Verify Production**

```bash
# Test database connection
curl http://localhost:3001/health/db

# Test authentication
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

---

## 🔄 Development Workflow

### **Daily Development:**

1. **Work Locally**
   ```bash
   # Use local PostgreSQL
   DATABASE_URL=postgresql://hirebit_user:password@localhost:5432/hirebit_local
   ```

2. **Test Changes**
   ```bash
   npm run dev
   # Test all features
   ```

3. **Commit & Push**
   ```bash
   git add .
   git commit -m "description"
   git push
   ```

4. **Deploy to Server** (when ready)
   ```bash
   ssh optiohire@134.122.1.7
   git pull
   # Update .env if needed
   pm2 restart backend
   ```

---

## 📝 Environment Variable Strategy

### **Local Development:**
- Use `backend/.env.local` (gitignored)
- Points to `localhost:5432`
- `DB_SSL=false`

### **Production Server:**
- Use `backend/.env` (not in git, managed on server)
- Points to `localhost:5432` (on server)
- `DB_SSL=false`

### **Both:**
- Keep Supabase Storage credentials (same for both)

---

## ✅ Checklist

### **Local Setup:**
- [ ] Install PostgreSQL locally
- [ ] Create local database
- [ ] Run schema on local database
- [ ] Update `backend/.env.local`
- [ ] Update `backend/src/db/index.ts`
- [ ] Test database connection
- [ ] Test authentication
- [ ] Test CV upload
- [ ] All features working locally

### **GitHub:**
- [ ] Review all changes
- [ ] Commit code changes (not .env files)
- [ ] Push to GitHub
- [ ] Verify changes are on GitHub

### **Production:**
- [ ] SSH to server
- [ ] Pull latest code
- [ ] Install PostgreSQL (if needed)
- [ ] Create production database
- [ ] Run schema
- [ ] Migrate data from Supabase
- [ ] Update production `.env`
- [ ] Restart backend
- [ ] Test production
- [ ] Monitor for issues

---

## 🎯 Benefits of This Approach

1. **Safety**: Test locally before production
2. **Version Control**: All changes tracked in GitHub
3. **Rollback**: Can revert if issues arise
4. **Documentation**: Changes documented in commits
5. **Team Collaboration**: Others can pull and test locally
6. **CI/CD Ready**: Can add automated testing later

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - They contain secrets
2. **Test thoroughly locally** - Catch issues before production
3. **Backup Supabase data** - Before migrating production
4. **Keep Supabase as backup** - Don't delete immediately
5. **Monitor production** - Watch for issues after deployment

---

## 🚀 Quick Start Commands

### **Local Setup:**
```bash
# Install PostgreSQL
brew install postgresql@15  # macOS
# or
sudo apt install postgresql  # Linux

# Create database
createdb hirebit_local
createuser hirebit_user

# Run schema
cd backend
psql -h localhost -U hirebit_user -d hirebit_local -f src/db/complete_schema.sql

# Start backend
npm run dev
```

### **Production Deploy:**
```bash
ssh optiohire@134.122.1.7
cd /path/to/optiohire
git pull
# Update .env
pm2 restart backend
```

---

This approach ensures you test everything locally first, have version control, and can safely deploy to production! 🎉

