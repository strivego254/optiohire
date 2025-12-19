# 24/7 Auto-Start Using Cron - Complete Guide

## 🎯 Why Cron for 24/7 Auto-Start?

**Cron is the best choice for 24/7 auto-start because:**

1. ✅ **Reliable**: Cron is a core Linux service that always runs
2. ✅ **Simple**: No complex systemd configuration needed
3. ✅ **Flexible**: Easy to monitor and restart processes
4. ✅ **Works everywhere**: Available on all Linux distributions
5. ✅ **Independent**: Doesn't depend on PM2's systemd integration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  Server Boot                                     │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Cron @reboot (30 seconds delay)                 │
│  → Runs: start-all.sh                            │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  start-all.sh                                    │
│  - Builds backend if needed                      │
│  - Enables email reader                          │
│  - Starts backend with PM2                       │
│  - Starts frontend with PM2                      │
│  - Saves PM2 state                              │
└──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Cron Every 2 Minutes                            │
│  → Runs: pm2-monitor.sh                         │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  pm2-monitor.sh                                  │
│  - Checks if backend is running                  │
│  - Checks if frontend is running                 │
│  - Restarts if crashed                           │
│  - Logs all actions                              │
└──────────────────────────────────────────────────┘
```

## 🚀 Quick Setup

Run this single command on your server:

```bash
cd ~/optiohire
git pull origin main
chmod +x deploy/setup-cron-24-7.sh
./deploy/setup-cron-24-7.sh
```

This script will:
1. ✅ Build backend if needed
2. ✅ Configure email reader
3. ✅ Create startup script (`start-all.sh`)
4. ✅ Create monitoring script (`pm2-monitor.sh`)
5. ✅ Setup `@reboot` cron job
6. ✅ Setup monitoring cron job (every 2 minutes)
7. ✅ Start services immediately
8. ✅ Verify everything is working

## 📋 How It Works

### 1. On Server Boot (@reboot)

Cron runs `start-all.sh` 30 seconds after boot:

```bash
@reboot sleep 30 && ~/optiohire/deploy/start-all.sh >> ~/logs/startup.log 2>&1
```

**What happens:**
- Waits 30 seconds (ensures system is ready)
- Builds backend if needed
- Enables email reader in `.env`
- Starts backend with PM2
- Starts frontend with PM2
- Saves PM2 state

### 2. Every 2 Minutes (Monitoring)

Cron runs `pm2-monitor.sh` every 2 minutes:

```bash
*/2 * * * * ~/optiohire/deploy/pm2-monitor.sh >> ~/logs/pm2-monitor.log 2>&1
```

**What happens:**
- Checks if backend is running
- Checks if frontend is running
- Restarts any crashed processes
- Logs all actions

### 3. PM2 Handles Process Management

PM2 provides:
- ✅ Auto-restart on crash (within PM2)
- ✅ Logging (stdout/stderr)
- ✅ Process monitoring
- ✅ Memory management

## 📁 Files Created

### 1. `deploy/start-all.sh`
- **Purpose**: Starts all services on boot
- **Runs**: On server boot (@reboot)
- **Location**: `~/optiohire/deploy/start-all.sh`

### 2. `deploy/pm2-monitor.sh`
- **Purpose**: Monitors and restarts crashed processes
- **Runs**: Every 2 minutes
- **Location**: `~/optiohire/deploy/pm2-monitor.sh`

### 3. Cron Jobs
- **@reboot**: Starts services on boot
- ***/2 * * * ***: Monitors every 2 minutes

## 📊 Logs

All logs are stored in `~/logs/`:

- **`startup.log`**: Startup script output (boot time)
- **`pm2-monitor.log`**: Monitoring script output (every 2 minutes)
- **PM2 logs**: `pm2 logs optiohire-backend`

### View Logs

```bash
# Startup log
tail -f ~/logs/startup.log

# Monitor log
tail -f ~/logs/pm2-monitor.log

# PM2 logs
pm2 logs optiohire-backend

# All logs
pm2 logs
```

## ✅ Verification

### Check Cron Jobs

```bash
crontab -l
```

Should show:
```
@reboot sleep 30 && ~/optiohire/deploy/start-all.sh >> ~/logs/startup.log 2>&1
*/2 * * * * ~/optiohire/deploy/pm2-monitor.sh >> ~/logs/pm2-monitor.log 2>&1
```

### Check PM2 Status

```bash
pm2 list
```

Should show:
```
┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime   │
├─────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ optiohire-backend    │ online  │ 0       │ 5m       │
│ 1   │ optiohire-frontend   │ online  │ 0       │ 5m       │
└─────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### Check Backend Health

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/email-reader
```

## 🔧 Manual Commands

### Start Services Now

```bash
~/optiohire/deploy/start-all.sh
```

### Check Monitoring Script

```bash
~/optiohire/deploy/pm2-monitor.sh
```

### Restart Backend Manually

```bash
pm2 restart optiohire-backend
```

### View PM2 Status

```bash
pm2 list
pm2 status
pm2 monit
```

## 🐛 Troubleshooting

### Services Not Starting on Boot

1. **Check cron jobs:**
   ```bash
   crontab -l
   ```

2. **Check startup log:**
   ```bash
   cat ~/logs/startup.log
   ```

3. **Test startup script manually:**
   ```bash
   ~/optiohire/deploy/start-all.sh
   ```

### Backend Crashes Frequently

1. **Check PM2 logs:**
   ```bash
   pm2 logs optiohire-backend --lines 100
   ```

2. **Check monitor log:**
   ```bash
   tail -50 ~/logs/pm2-monitor.log
   ```

3. **Check backend .env:**
   ```bash
   cat ~/optiohire/backend/.env | grep -E "ENABLE_EMAIL_READER|IMAP"
   ```

### Email Reader Not Processing

1. **Verify email reader is enabled:**
   ```bash
   grep ENABLE_EMAIL_READER ~/optiohire/backend/.env
   ```

2. **Check IMAP credentials:**
   ```bash
   grep IMAP ~/optiohire/backend/.env
   ```

3. **Check email reader status:**
   ```bash
   curl http://localhost:3001/health/email-reader
   ```

4. **Check backend logs:**
   ```bash
   pm2 logs optiohire-backend | grep -i "email\|imap"
   ```

## 🔄 Updating the Setup

If you need to update the scripts:

```bash
cd ~/optiohire
git pull origin main
chmod +x deploy/setup-cron-24-7.sh
./deploy/setup-cron-24-7.sh
```

This will:
- Update the scripts
- Reinstall cron jobs
- Restart services

## 📝 Advantages of This Approach

1. **✅ Reliability**: Cron is always running
2. **✅ Simplicity**: No complex systemd configuration
3. **✅ Visibility**: Easy to check logs and status
4. **✅ Flexibility**: Easy to modify scripts
5. **✅ Independence**: Doesn't rely on PM2 systemd integration
6. **✅ Monitoring**: Automatic restart every 2 minutes
7. **✅ Logging**: All actions are logged

## 🎯 Summary

**Cron + PM2 = Perfect 24/7 Solution**

- **Cron**: Handles boot-time startup and periodic monitoring
- **PM2**: Handles process management, logging, and auto-restart
- **Result**: Backend runs 24/7 automatically, even after crashes or reboots

Run `./deploy/setup-cron-24-7.sh` once, and your backend will run forever! 🚀

