# PostgreSQL Database Viewing Commands

## Quick Reference

### **1. Connect to Database (Interactive Mode)**
```bash
cd backend
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local
```

Once connected, you can use PostgreSQL commands (see below).

---

### **2. List All Tables**
```bash
# From terminal (one command)
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "\dt"

# Or in psql interactive mode
\dt
```

---

### **3. View Data in Tables**

#### **View all users:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM users;"
```

#### **View all companies:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM companies;"
```

#### **View all job postings:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM job_postings;"
```

#### **View all applications:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT * FROM applications;"
```

---

### **4. Count Rows in Tables**
```bash
# Count all tables at once
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'reports', COUNT(*) FROM reports
ORDER BY table_name;"
```

---

### **5. View Table Structure (Columns)**
```bash
# View columns in users table
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "\d users"

# View columns in any table
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "\d table_name"
```

---

### **6. Useful PostgreSQL Commands (Interactive Mode)**

Once you're in `psql` (interactive mode), use these commands:

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\du` | List all users |
| `\l` | List all databases |
| `\c database_name` | Connect to another database |
| `\q` | Quit psql |
| `\?` | Show help |

---

### **7. Query Examples**

#### **View users with formatted output:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT user_id, email, role, created_at FROM users;"
```

#### **View recent applications:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT application_id, candidate_name, email, ai_score, ai_status, created_at FROM applications ORDER BY created_at DESC LIMIT 10;"
```

#### **View job postings with company info:**
```bash
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "SELECT j.job_posting_id, j.job_title, c.company_name, j.status, j.created_at FROM job_postings j JOIN companies c ON j.company_id = c.company_id;"
```

---

### **8. Export Data to File**
```bash
# Export users table to CSV
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local -c "COPY users TO STDOUT WITH CSV HEADER" > users_export.csv

# Export all data to SQL
pg_dump -h localhost -U hirebit_user -d hirebit_local > backup.sql
```

---

### **9. Quick View Script**

Create a script to quickly view all tables:

```bash
#!/bin/bash
# Save as: view-db.sh

PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local << EOF
\echo '=== Database Tables ==='
\dt

\echo ''
\echo '=== Row Counts ==='
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'reports', COUNT(*) FROM reports
ORDER BY table_name;

\echo ''
\echo '=== Users Data ==='
SELECT user_id, email, role, created_at FROM users LIMIT 5;
EOF
```

---

## Your Current Database Status

Based on the check, you have:
- ✅ **10 tables** created
- ✅ **1 user** in the users table (likely the admin user from schema)
- ⚠️ **0 rows** in other tables (empty - ready for data)

---

## Interactive Session Example

```bash
# Connect
PGPASSWORD=hirebit_local_dev psql -h localhost -U hirebit_user -d hirebit_local

# Then run commands:
hirebit_local=> \dt                    # List tables
hirebit_local=> SELECT * FROM users;  # View users
hirebit_local=> \d users               # View table structure
hirebit_local=> \q                     # Quit
```

---

**Tip**: Use interactive mode (`psql`) for exploring, and one-liner commands for quick checks!

