# Fix Auto-Start and Email Reader Issues

## 🚨 Problem Summary

1. **Auto-start not working**: Backend doesn't start automatically on server reboot
2. **Email reader not processing**: Applications are not being analyzed automatically

## 🔧 Quick Fix (Recommended)

Run this script on your server to fix both issues:

```bash
cd ~/optiohire
git pull origin main
chmod +x deploy/quick-fix-autostart.sh
./deploy/quick-fix-autostart.sh
```

This script will:
- ✅ Build backend if needed
- ✅ Enable email reader in .env
- ✅ Start backend with PM2
- ✅ Setup auto-start (cron jobs)
- ✅ Verify everything is working

---

## 🔍 Comprehensive Diagnostic (If Quick Fix Doesn't Work)

For a full diagnostic and fix:

```bash
cd ~/optiohire
git pull origin main
chmod +x deploy/diagnose-and-fix-all.sh
./deploy/diagnose-and-fix-all.sh
```

This script will:
- Check PM2 installation
- Check backend/frontend status
- Check email reader configuration
- Test health endpoints
- Check logs
- Setup auto-start (systemd + cron)
- Verify everything

---

## 📋 Manual Steps (If Scripts Don't Work)

### Step 1: Check Current Status

```bash
# Check PM2 processes
pm2 list

# Check backend health
curl http://localhost:3001/health

# Check email reader status
curl http://localhost:3001/health/email-reader

# Check backend logs
pm2 logs optiohire-backend --lines 50
```

### Step 2: Ensure Backend is Built

```bash
cd ~/optiohire/backend
npm run build
```

### Step 3: Enable Email Reader

```bash
cd ~/optiohire/backend
nano .env
```

Add or ensure these lines exist:
```env
ENABLE_EMAIL_READER=true
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASS=your_app_password
IMAP_POLL_MS=1000
```

### Step 4: Start Backend with PM2

```bash
cd ~/optiohire/backend
pm2 delete optiohire-backend 2>/dev/null || true
pm2 start dist/server.js --name optiohire-backend --update-env
pm2 save
```

### Step 5: Setup Auto-Start

#### Option A: Using PM2 Startup (Systemd)

```bash
# Generate startup command
pm2 startup

# Copy and run the command it shows (it will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u optiohire --hp /home/optiohire

# Save PM2 state
pm2 save
```

#### Option B: Using Cron (More Reliable)

```bash
# Ensure scripts exist
chmod +x ~/optiohire/deploy/start-all.sh
chmod +x ~/optiohire/deploy/pm2-monitor.sh

# Add @reboot cron job
(crontab -l 2>/dev/null | grep -v "@reboot.*start-all.sh"; \
 echo "@reboot sleep 30 && $HOME/optiohire/deploy/start-all.sh >> $HOME/logs/startup.log 2>&1") | crontab -

# Add monitoring cron job (every 2 minutes)
(crontab -l 2>/dev/null | grep -v "pm2-monitor.sh"; \
 echo "*/2 * * * * $HOME/optiohire/deploy/pm2-monitor.sh >> $HOME/logs/pm2-monitor.log 2>&1") | crontab -

# Verify cron jobs
crontab -l
```

### Step 6: Verify Everything Works

```bash
# Check PM2 status
pm2 list

# Check email reader
curl http://localhost:3001/health/email-reader

# Check logs
pm2 logs optiohire-backend --lines 30
```

---

## 🐛 Troubleshooting

### Backend Not Starting

1. **Check if port 3001 is in use:**
   ```bash
   sudo lsof -i :3001
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs optiohire-backend --lines 100
   ```

3. **Check if .env file exists:**
   ```bash
   ls -la ~/optiohire/backend/.env
   ```

4. **Try starting manually:**
   ```bash
   cd ~/optiohire/backend
   node dist/server.js
   ```

### Email Reader Not Processing

1. **Check if email reader is enabled:**
   ```bash
   grep ENABLE_EMAIL_READER ~/optiohire/backend/.env
   ```

2. **Check IMAP credentials:**
   ```bash
   grep IMAP ~/optiohire/backend/.env
   ```

3. **Check email reader logs:**
   ```bash
   pm2 logs optiohire-backend | grep -i "email\|imap\|reader"
   ```

4. **Test IMAP connection:**
   ```bash
   # Check if IMAP credentials are correct
   # Try connecting manually or check logs for IMAP errors
   ```

### Auto-Start Not Working

1. **Check systemd service:**
   ```bash
   sudo systemctl status pm2-optiohire
   ```

2. **Check cron jobs:**
   ```bash
   crontab -l
   ```

3. **Check startup logs:**
   ```bash
   cat ~/logs/startup.log
   cat ~/logs/pm2-monitor.log
   ```

4. **Test @reboot manually:**
   ```bash
   # Simulate reboot by running the start script
   ~/optiohire/deploy/start-all.sh
   ```

---

## ✅ Verification Checklist

After running the fix, verify:

- [ ] `pm2 list` shows `optiohire-backend` as `online`
- [ ] `curl http://localhost:3001/health` returns success
- [ ] `curl http://localhost:3001/health/email-reader` shows `enabled: true`
- [ ] `crontab -l` shows `@reboot` and `*/2 * * * *` entries
- [ ] `pm2 save` was successful
- [ ] Backend logs show email reader starting
- [ ] Applications are being processed automatically

---

## 📞 Next Steps

1. **Test auto-start**: Reboot server and verify backend starts automatically
2. **Test email processing**: Create a job post and send a test application
3. **Monitor logs**: `pm2 logs optiohire-backend` to see email processing
4. **Check dashboard**: Verify applications appear in dashboard after processing

---

## 🔗 Related Files

- `deploy/quick-fix-autostart.sh` - Quick fix script
- `deploy/diagnose-and-fix-all.sh` - Comprehensive diagnostic script
- `deploy/start-all.sh` - Startup script (called on boot)
- `deploy/pm2-monitor.sh` - Monitoring script (runs every 2 minutes)
- `deploy/ecosystem.config.js` - PM2 configuration

