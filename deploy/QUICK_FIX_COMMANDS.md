# Quick Fix Commands - Email Reader

## 🚀 Fastest Method (Run on Server)

```bash
# 1. Connect to server
ssh root@134.122.1.7

# 2. Navigate to app directory
cd /opt/optiohire  # or ~/optiohire

# 3. Run automated fix script
chmod +x deploy/fix-email-reader.sh
./deploy/fix-email-reader.sh
```

---

## 📝 Manual Commands (If Script Doesn't Work)

```bash
# 1. Navigate to backend
cd /opt/optiohire/backend  # or ~/optiohire/backend

# 2. Check .env file has IMAP variables
nano .env
# Ensure these exist:
# IMAP_HOST=imap.gmail.com
# IMAP_USER=hirebitapplications@gmail.com
# IMAP_PASS=your_app_password
# (Remove ENABLE_EMAIL_READER=false if present)

# 3. Rebuild backend
npm install --production=false
npm run build

# 4. Restart backend
pm2 restart optiohire-backend --update-env
pm2 save

# 5. Wait 5 seconds, then check status
sleep 5
curl http://localhost:3001/health/email-reader
```

---

## ✅ Verify It's Working

```bash
# Check email reader status
curl http://localhost:3001/health/email-reader | python3 -m json.tool

# Should show:
# "enabled": true
# "running": true

# Check PM2 logs
pm2 logs optiohire-backend --lines 30

# Should see:
# "IMAP email reader connected to imap.gmail.com:993"
```

---

## 🔧 Common Fixes

### Email reader disabled
```bash
cd backend
nano .env
# Remove or comment: ENABLE_EMAIL_READER=false
pm2 restart optiohire-backend --update-env
```

### Missing IMAP credentials
```bash
cd backend
nano .env
# Add:
# IMAP_HOST=imap.gmail.com
# IMAP_PORT=993
# IMAP_USER=hirebitapplications@gmail.com
# IMAP_PASS=your_16_char_app_password
# IMAP_SECURE=true
# IMAP_POLL_MS=10000
pm2 restart optiohire-backend --update-env
```

### Backend not starting
```bash
# Check logs
pm2 logs optiohire-backend --err --lines 50

# Rebuild if needed
cd backend
npm run build
pm2 restart optiohire-backend --update-env
```

---

## 📊 Check Current Status

```bash
# PM2 status
pm2 status

# Backend health
curl http://localhost:3001/health

# Email reader health
curl http://localhost:3001/health/email-reader

# Recent logs
pm2 logs optiohire-backend --lines 20
```

