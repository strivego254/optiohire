# Viewing PostgreSQL Database - Quick Guide

## 🚀 Quick Start

### **Using the Helper Script** (Easiest)

```bash
cd backend
./scripts/view-database.sh
```

This will show you all available commands.

---

## 📋 Common Commands

### **1. List All Tables**
```bash
cd backend
./scripts/view-database.sh tables
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "\dt"
```

---

### **2. View Table Structure**
```bash
./scripts/view-database.sh structure users
./scripts/view-database.sh structure companies
./scripts/view-database.sh structure job_postings
./scripts/view-database.sh structure applications
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "\d users"
```

---

### **3. View Table Data (Limited Rows)**
```bash
./scripts/view-database.sh data users
./scripts/view-database.sh data users 10    # Show only 10 rows
./scripts/view-database.sh data applications 5
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM users LIMIT 10;"
```

---

### **4. View All Data from a Table**
```bash
./scripts/view-database.sh all users
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM users;"
```

---

### **5. Count Rows in a Table**
```bash
./scripts/view-database.sh count users
./scripts/view-database.sh count applications
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT COUNT(*) FROM users;"
```

---

### **6. Connect Interactively** (Best for exploring)
```bash
./scripts/view-database.sh connect
```

**Or manually:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local
```

Once connected, you can use PostgreSQL commands:
```sql
-- List tables
\dt

-- Describe a table
\d users

-- View data
SELECT * FROM users;

-- Count rows
SELECT COUNT(*) FROM users;

-- Exit
\q
```

---

## 🔍 Interactive PostgreSQL Commands

When connected interactively (`psql`), you can use:

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\du` | List all users |
| `\l` | List all databases |
| `\c database_name` | Connect to a database |
| `\q` | Quit/exit |
| `\?` | Show help |
| `\timing` | Toggle query timing |
| `\x` | Toggle expanded display (vertical) |

---

## 📊 Useful SQL Queries

### **View All Users**
```sql
SELECT user_id, email, role, is_active, created_at FROM users;
```

### **View All Companies**
```sql
SELECT company_id, company_name, company_email, hr_email, created_at FROM companies;
```

### **View Job Postings**
```sql
SELECT job_posting_id, job_title, status, application_deadline, created_at 
FROM job_postings 
ORDER BY created_at DESC;
```

### **View Applications**
```sql
SELECT 
    application_id,
    candidate_name,
    email,
    ai_score,
    ai_status,
    created_at
FROM applications
ORDER BY created_at DESC
LIMIT 20;
```

### **View Applications with Job Details**
```sql
SELECT 
    a.application_id,
    a.candidate_name,
    a.email,
    a.ai_score,
    a.ai_status,
    j.job_title,
    c.company_name
FROM applications a
JOIN job_postings j ON a.job_posting_id = j.job_posting_id
JOIN companies c ON a.company_id = c.company_id
ORDER BY a.created_at DESC
LIMIT 20;
```

### **Count Records by Table**
```sql
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL
SELECT 'applications', COUNT(*) FROM applications;
```

---

## 🎯 Quick Examples

### **Check if database has data:**
```bash
cd backend
./scripts/view-database.sh count users
./scripts/view-database.sh count companies
./scripts/view-database.sh count applications
```

### **View recent users:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5;"
```

### **View table with formatted output:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -x -c "SELECT * FROM users LIMIT 1;"
```
(The `-x` flag shows output in expanded/vertical format)

---

## 💡 Tips

1. **Use the helper script** - It's easier and handles passwords automatically
2. **Connect interactively** - Best for exploring and running multiple queries
3. **Use LIMIT** - Always use LIMIT when viewing data to avoid huge outputs
4. **Export to file** - Save query results to a file:
   ```bash
   PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM users;" > users_export.txt
   ```

---

## 🔐 Password Note

The script uses the password from environment or defaults. If you need to use a different password:

```bash
export PGPASSWORD=your_password
./scripts/view-database.sh tables
```

Or set it inline:
```bash
PGPASSWORD=your_password psql -h localhost -U hirebit_user -d hirebit_local -c "\dt"
```

---

## 📝 All Available Tables

Your database should have these tables:
- `users` - User accounts
- `companies` - Company information
- `job_postings` - Job listings
- `applications` - Candidate applications
- `reports` - Generated reports
- `job_schedules` - Scheduled tasks
- `audit_logs` - Audit trail
- `recruitment_analytics` - Analytics data
- `user_preferences` - User preferences
- `analytics_events` - Analytics events

View them all:
```bash
./scripts/view-database.sh tables
```

