# Database Setup Guide - Supabase

## ✅ Current Status

- **Schema**: Successfully created in Supabase
- **Admin User**: Created (check your own admin credentials; do not store them in this repo)
- **Connection**: Needs to be configured

## 🔧 Step-by-Step Setup

### 1. Get Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/qijibjotmwbikzwtkcut/settings/database
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab (not "Session mode")
4. Copy the connection string shown
5. It should look like:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qijibjotmwbikzwtkcut.supabase.co:5432/postgres
   ```

### 2. Update `backend/.env`

Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

**Important**: URL-encode special characters in password:
- `@` becomes `%40`
- `#` becomes `%23`
- `.` stays as `.`
- `$` stays as `$`

**Example** (placeholder):
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_URL_ENCODED@db.qijibjotmwbikzwtkcut.supabase.co:5432/postgres
```

### 3. Test Connection

```bash
# Test database connection
curl http://localhost:3001/health/db

# Should return:
# {"status":"ok","database":"connected","time":"...","version":"PostgreSQL 15.x"}
```

### 4. Test Admin Login

```bash
# Test admin login
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_ADMIN_EMAIL","password":"YOUR_ADMIN_PASSWORD"}'

# Should return:
# {"token":"...","user":{"user_id":"...","email":"YOUR_ADMIN_EMAIL","role":"admin"}}
```

## 🔄 If Connection Fails

### Option 1: Try Connection Pooler (Port 6543)

If direct connection (port 5432) fails, use the pooler:

```bash
 DATABASE_URL=postgresql://postgres.[PROJECT_REF]:YOUR_PASSWORD_URL_ENCODED@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Important:** Never commit real passwords, JWT secrets, or API keys to GitHub.

### Option 2: Check Network/Firewall

- Ensure your network allows outbound connections to Supabase
- Check if IPv6 is blocked (error: `ENETUNREACH`)
- Try from a different network or use VPN

### Option 3: Use Supabase Dashboard SQL Editor

If local connection doesn't work, you can:
- Run queries directly in Supabase Dashboard → SQL Editor
- Deploy backend to a server that can reach Supabase

## ✅ Verification Checklist

- [ ] Connection string updated in `backend/.env`
- [ ] Backend restarted
- [ ] `/health/db` endpoint returns `"database": "connected"`
- [ ] Admin login works
- [ ] Can create new user accounts
- [ ] Can create job postings

## 🚀 Next Steps After Connection Works

1. **Test Account Creation**:
   ```bash
   curl -X POST http://localhost:3001/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

2. **Access Admin Dashboard**:
   - Go to: http://localhost:3000/admin/login?email=YOUR_ADMIN_EMAIL&password=YOUR_ADMIN_PASSWORD
   - Or manually login at: http://localhost:3000/admin/login

3. **Create Test Data**:
   - Create a company
   - Create a job posting
   - Submit an application

## 📝 Environment Variables

Make sure `backend/.env` has:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
DB_SSL=true

# Server
PORT=3001
JWT_SECRET=your-secret-key-here

# Optional: AI/Email/etc.
GEMINI_API_KEY=your_key_here
GEMINI_API_KEY_002=your_key_here
GEMINI_API_KEY_003=your_key_here
```

## 🆘 Troubleshooting

**Error: `ENETUNREACH`**
- Network connectivity issue
- Try connection pooler (port 6543)
- Check firewall/VPN

**Error: `Tenant or user not found`**
- Connection string format incorrect
- Get exact string from Supabase Dashboard
- Verify password is URL-encoded correctly

**Error: `password authentication failed`**
- Password incorrect
- Check password in Supabase Dashboard → Settings → Database
- Verify URL encoding

**Error: `connection timeout`**
- Network issue
- Try connection pooler
- Check Supabase project status

