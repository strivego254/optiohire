# Deployment Guide: Local → GitHub → Server

## 📋 Step-by-Step Deployment Process

---

## **Phase 1: Commit and Push to GitHub**

### **Step 1: Review Changes**

```bash
cd "/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/OPTIOHIRE PROJECT/optiohire"
git status
```

### **Step 2: Add Files to Staging**

```bash
# Add code changes
git add backend/src/db/complete_schema.sql
git add backend/src/db/index.ts

# Add new scripts and guides
git add backend/scripts/setup-local-db.sh
git add backend/scripts/view-database.sh
git add backend/scripts/fix-missing-function.sql

# Add documentation
git add ARCHITECTURE_MIGRATION_GUIDE.md
git add LOCAL_DEVELOPMENT_MIGRATION.md
git add MIGRATION_QUICK_START.md
git add SUPABASE_CLEANUP_GUIDE.md
git add backend/scripts/SETUP_SCRIPT_FIXES.md
git add backend/scripts/VIEW_DATABASE_GUIDE.md

# Note: frontend/package-lock.json is auto-generated, you can add it if needed
# git add frontend/package-lock.json
```

### **Step 3: Commit Changes**

```bash
git commit -m "feat: migrate database from Supabase to local PostgreSQL

- Update database connection to support local PostgreSQL
- Fix schema: move update_updated_at_column() function earlier
- Add local development setup script
- Add database viewer script
- Update SSL configuration for local development
- Add comprehensive migration guides
- Keep Supabase Storage for CV files"
```

### **Step 4: Push to GitHub**

```bash
git push origin main
```

**If you get authentication errors:**
```bash
# Use SSH (if configured)
git push origin main

# Or use HTTPS with token
git push https://github.com/your-username/your-repo.git main
```

---

## **Phase 2: Deploy to Server**

### **Step 1: SSH to Server**

```bash
ssh optiohire@134.122.1.7
```

### **Step 2: Navigate to Project Directory**

```bash
# Find your project directory (adjust path as needed)
cd ~/optiohire
# or
cd /var/www/optiohire
# or wherever your project is located
```

### **Step 3: Pull Latest Changes**

```bash
git pull origin main
```

**If you get conflicts:**
```bash
# Backup current changes
git stash

# Pull changes
git pull origin main

# Apply stashed changes if needed
git stash pop
```

### **Step 4: Install/Update Dependencies**

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (if needed)
cd ../frontend
npm install
```

### **Step 5: Update Environment Variables**

**Important:** Don't overwrite your production `.env` file!

```bash
cd backend

# Check if .env exists
ls -la .env

# Update DATABASE_URL to point to local PostgreSQL on server
# Edit .env file (use nano, vim, or your preferred editor)
nano .env
```

**Update these variables in `.env`:**
```bash
# Change from Supabase to local PostgreSQL
DATABASE_URL=postgresql://hirebit_user:your_secure_password@localhost:5432/hirebit
DB_SSL=false

# Keep Supabase Storage (no change needed)
S3_BUCKET=resumes
S3_ACCESS_KEY=your_supabase_access_key
S3_SECRET_KEY=your_supabase_secret_key
S3_ENDPOINT=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET_URL=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/object/public/resumes
```

### **Step 6: Set Up PostgreSQL on Server** (if not already done)

```bash
# Install PostgreSQL (if not installed)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE hirebit;
CREATE USER hirebit_user WITH PASSWORD 'your_secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE hirebit TO hirebit_user;
\q

# Run schema
cd ~/optiohire/backend
PGPASSWORD=your_secure_production_password psql -h localhost -U hirebit_user -d hirebit -f src/db/complete_schema.sql
```

### **Step 7: Migrate Data from Supabase** (if needed)

```bash
# Export from Supabase (run from server or your local machine)
pg_dump -h db.qijibjotmwbikzwtkcut.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --inserts \
        > data_export.sql

# Import to local PostgreSQL on server
PGPASSWORD=your_secure_production_password psql -h localhost -U hirebit_user -d hirebit -f data_export.sql
```

### **Step 8: Build and Restart Services**

#### **If using PM2:**

```bash
# Build backend
cd backend
npm run build

# Restart PM2 process
pm2 restart backend
# or
pm2 restart all

# Check status
pm2 status
pm2 logs backend
```

#### **If using systemd:**

```bash
# Build backend
cd backend
npm run build

# Restart service
sudo systemctl restart optiohire-backend

# Check status
sudo systemctl status optiohire-backend
```

#### **If using manual process:**

```bash
# Stop current process (Ctrl+C or kill process)
# Then start again
cd backend
npm run build
npm start
```

### **Step 9: Verify Deployment**

```bash
# Test backend health
curl http://localhost:3001/health
curl http://localhost:3001/health/db

# Test database connection
cd backend
./scripts/view-database.sh tables
```

---

## **Quick Deployment Script**

You can create a deployment script on the server:

```bash
# Create deploy.sh on server
cat > ~/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project
cd ~/optiohire

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install

# Build
echo "🔨 Building..."
cd ../backend && npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart backend || npm start

echo "✅ Deployment complete!"
EOF

chmod +x ~/deploy.sh
```

Then just run:
```bash
~/deploy.sh
```

---

## **Troubleshooting**

### **Git Pull Fails**

```bash
# If you have local changes
git stash
git pull origin main
git stash pop
```

### **Database Connection Fails**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
PGPASSWORD=your_password psql -h localhost -U hirebit_user -d hirebit -c "SELECT version();"
```

### **Build Fails**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Service Won't Start**

```bash
# Check logs
pm2 logs backend
# or
journalctl -u optiohire-backend -f

# Check environment variables
cd backend
cat .env | grep DATABASE_URL
```

---

## **Rollback Plan**

If something goes wrong:

```bash
# Revert to previous commit
git log  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Or switch back to Supabase temporarily
# Update DATABASE_URL in .env to Supabase connection string
nano backend/.env
# Change DATABASE_URL back to Supabase
pm2 restart backend
```

---

## **Summary Checklist**

### **Local (Before Push):**
- [ ] Review all changes
- [ ] Test locally
- [ ] Commit changes
- [ ] Push to GitHub

### **Server (After SSH):**
- [ ] Pull latest changes
- [ ] Install/update dependencies
- [ ] Update .env (DATABASE_URL, DB_SSL)
- [ ] Set up PostgreSQL (if needed)
- [ ] Run schema (if new database)
- [ ] Migrate data (if needed)
- [ ] Build application
- [ ] Restart services
- [ ] Verify deployment

---

**Ready to deploy?** Follow the steps above! 🚀

