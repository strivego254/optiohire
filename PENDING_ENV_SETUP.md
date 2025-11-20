# Pending Environment Variables - HireBit

## ✅ CONFIGURED (App can run)

### Backend (`backend/.env`):
- ✅ `DATABASE_URL` - Supabase connection string
- ✅ `PORT=3001` - Backend server port
- ✅ `NODE_ENV=development` - Environment mode
- ✅ `S3_*` - Supabase Storage credentials (all configured)
- ✅ `CRON_SECRET` - For scheduled tasks

### Frontend (`frontend/.env.local`):
- ✅ `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` - Backend API URL

---

## ⚠️ MISSING (App works but should be set)

### Backend:
- ⚠️ `JWT_SECRET` - Currently using default `'dev_secret_change_me'`
  - **Action**: Generate a secure secret and add to `backend/.env`
  - **Generate**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🟢 OPTIONAL (Features work with fallbacks)

### AI Features (Backend):
- `GEMINI_API_KEY` - For AI scoring and report generation
- `GEMINI_API_KEY_002` - Backup API key
- `GEMINI_API_KEY_003` - Backup API key
- `REPORT_AI_MODEL` - AI model name (defaults to `gemini-1.5-flash`)
- `SCORING_MODEL` - Scoring model (defaults to `gemini-1.5-flash`)
- `RESUME_PARSER_MODEL` - Parser model (defaults to `gemini-1.5-flash`)
- **Impact**: AI features will use fallback rule-based scoring if not set

### Email Features (Backend):
- `SMTP_HOST` - Email sending server (defaults to localhost)
- `SMTP_PORT` - SMTP port (defaults to 587)
- `SMTP_USER` - Email account
- `SMTP_PASS` - Email password/app password
- **Impact**: Email sending will use local SMTP if not configured

- `IMAP_HOST` - Email reading server
- `IMAP_PORT` - IMAP port (defaults to 993)
- `IMAP_USER` - Email account
- `IMAP_PASS` - Email password/app password
- `ENABLE_EMAIL_READER` - Enable/disable email reader (defaults to false)
- **Impact**: Email reading will be disabled if not configured

### Frontend:
- `NEXTAUTH_URL` - NextAuth base URL (defaults to `http://localhost:3000`)
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (if using Supabase client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (if using Supabase client)

---

## 📋 Summary

### **Minimum Required (Already Set ✅):**
1. ✅ `DATABASE_URL` - Database connection
2. ✅ `PORT` - Server port
3. ✅ `NEXT_PUBLIC_BACKEND_URL` - Frontend → Backend connection

### **Recommended (Should Set):**
1. ⚠️ `JWT_SECRET` - Security (currently using insecure default)

### **Optional (Nice to Have):**
1. 🟢 `GEMINI_API_KEY` - For AI features
2. 🟢 `SMTP_*` - For email sending
3. 🟢 `IMAP_*` - For email reading

---

## 🚀 App Status

**Current Status**: ✅ **APP CAN RUN**

The app is fully functional with current configuration. Only `JWT_SECRET` should be updated for production security.

All other variables are optional and features will gracefully degrade if not set.
