# Supabase Cleanup Guide

## ⚠️ IMPORTANT: Don't Delete Supabase Tables Yet!

Now that you've successfully migrated to local PostgreSQL, here's what you should do with Supabase.

---

## ✅ What You Still Need from Supabase

### **1. Supabase Storage (KEEP THIS!)**
- **Purpose**: CV file storage
- **Status**: Still actively used
- **Action**: **DO NOT DELETE** - Your application still uses this

Your backend uploads CV files to Supabase Storage via the S3-compatible API. This is separate from the database and should remain active.

**Storage Configuration** (in your `.env`):
```bash
S3_BUCKET=resumes
S3_ACCESS_KEY=your_supabase_access_key
S3_SECRET_KEY=your_supabase_secret_key
S3_ENDPOINT=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/s3
S3_BUCKET_URL=https://qijibjotmwbikzwtkcut.supabase.co/storage/v1/object/public/resumes
```

---

## 📊 What to Do with Supabase Database

### **Option 1: Keep as Backup (RECOMMENDED)**

**Why:**
- Safety net if something goes wrong with local PostgreSQL
- Can restore data if needed
- No cost if you're on free tier
- Easy to reference old data

**Action:**
- **DO NOT DELETE** the tables
- Keep Supabase database as read-only backup
- You can access it anytime via Supabase dashboard

**Duration:** Keep for at least 1-2 months, or until you're 100% confident everything works perfectly.

---

### **Option 2: Export Data and Delete (After Verification)**

**When to do this:**
- ✅ After 1-2 months of successful operation
- ✅ After verifying all features work correctly
- ✅ After confirming you have proper backups of local PostgreSQL
- ✅ When you're confident you won't need the data

**Steps:**

1. **Export all data from Supabase** (as backup):
   ```bash
   # Export entire database
   pg_dump -h db.qijibjotmwbikzwtkcut.supabase.co \
           -U postgres \
           -d postgres \
           --data-only \
           --inserts \
           > supabase_backup_$(date +%Y%m%d).sql
   ```

2. **Verify backup file exists and has data**:
   ```bash
   ls -lh supabase_backup_*.sql
   head -20 supabase_backup_*.sql
   ```

3. **Store backup safely** (cloud storage, external drive, etc.)

4. **Then delete tables** (if you really want to):
   - Go to Supabase Dashboard
   - Table Editor
   - Drop tables one by one
   - **OR** use SQL Editor:
     ```sql
     DROP TABLE IF EXISTS applications CASCADE;
     DROP TABLE IF EXISTS job_postings CASCADE;
     DROP TABLE IF EXISTS companies CASCADE;
     DROP TABLE IF EXISTS users CASCADE;
     -- etc.
     ```

---

## 🔄 Recommended Approach

### **Phase 1: Keep Everything (Now - 1-2 months)**

1. ✅ **Keep Supabase Database** - As backup
2. ✅ **Keep Supabase Storage** - Still in use
3. ✅ **Monitor local PostgreSQL** - Ensure it's working well
4. ✅ **Test all features** - Make sure nothing breaks

### **Phase 2: After Verification (1-2 months later)**

1. ✅ **Export Supabase data** - Full backup
2. ✅ **Verify local backups** - Ensure you have automated backups
3. ✅ **Test restore process** - Make sure you can restore if needed
4. ⚠️ **Then consider deleting** - Only if you're confident

### **Phase 3: Cleanup (Optional)**

1. ✅ **Delete Supabase tables** - If you want to clean up
2. ✅ **Keep Supabase Storage** - Still needed for CV files
3. ✅ **Keep backup files** - Store safely

---

## 📋 Checklist Before Deleting Supabase Tables

- [ ] Local PostgreSQL has been running successfully for 1-2 months
- [ ] All features tested and working correctly
- [ ] Automated backups set up for local PostgreSQL
- [ ] Tested restore process from backups
- [ ] Exported all data from Supabase as backup
- [ ] Backup files stored in safe location (cloud/external drive)
- [ ] Verified Supabase Storage is still working (for CV files)
- [ ] Team/colleagues aware of the change (if applicable)

---

## 🗄️ What About Supabase Storage?

### **KEEP Supabase Storage!**

Supabase Storage is **separate** from the database and is still actively used by your application:

- CV files are uploaded to Supabase Storage
- Reports may be stored there
- Other file uploads use it

**Do NOT delete:**
- Storage buckets
- Storage configuration
- Storage API keys

**Only the database tables can be deleted** (and only after proper backup).

---

## 💾 Backup Strategy

### **Local PostgreSQL Backups**

Set up automated backups for your local PostgreSQL:

```bash
# Create backup script
cat > ~/backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DB_NAME="hirebit"
DB_USER="hirebit_user"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/hirebit_backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "hirebit_backup_*.sql" -mtime +30 -delete
EOF

chmod +x ~/backup-postgres.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add: 0 2 * * * /home/your-user/backup-postgres.sh
```

---

## 🎯 Summary

### **What to Keep:**
- ✅ **Supabase Storage** - Still in use for CV files
- ✅ **Supabase Database** - Keep as backup for 1-2 months
- ✅ **All environment variables** - Storage config still needed

### **What You Can Delete (Later):**
- ⚠️ **Supabase Database Tables** - Only after:
  - 1-2 months of successful operation
  - Full data export/backup
  - Verified local backups work
  - Tested restore process

### **What You Must Keep:**
- ✅ **Supabase Storage** - Required for CV file storage
- ✅ **Storage API keys** - Required for file uploads
- ✅ **Backup files** - Safety net

---

## 🚨 Important Notes

1. **Supabase Storage is separate** from the database - it's still needed
2. **Database tables can be deleted** - but only after proper backup
3. **Keep backups** - Both Supabase export and local PostgreSQL backups
4. **Test restore** - Make sure you can restore from backups
5. **Monitor first** - Don't rush to delete, keep as backup initially

---

## 📞 If Something Goes Wrong

If you need to restore from Supabase:

1. **Restore from Supabase backup**:
   ```bash
   psql -h localhost -U hirebit_user -d hirebit_local -f supabase_backup_YYYYMMDD.sql
   ```

2. **Or temporarily switch back**:
   - Update `DATABASE_URL` in `.env` to Supabase
   - Restart backend
   - Fix local PostgreSQL
   - Switch back when ready

---

**Bottom Line**: Keep Supabase as backup for now, especially since it's free. Only delete after you're 100% confident everything works and you have proper backups! 🎯

