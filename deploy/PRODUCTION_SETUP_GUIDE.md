# 🚀 Production Setup Guide - 24/7 Operation

## Overview

This guide sets up **OptioHire** to run 24/7 on your production server using:
- **PM2**: Process manager for Node.js/TypeScript applications
- **Systemd**: Ensures PM2 starts automatically on server reboot
- **Cron**: Backup monitoring to restart processes if they crash

## Why This Stack?

For **TypeScript/Node.js** applications (Next.js + Express):
- ✅ **PM2** is the industry standard for Node.js process management
- ✅ **Systemd** is more reliable than cron for auto-start on boot
- ✅ **Cron** provides backup monitoring (runs every 2 minutes)

## Prerequisites

1. ✅ Node.js and npm installed
2. ✅ Application cloned to server (`~/optiohire` or `/opt/optiohire`)
3. ✅ Backend `.env` file configured with all credentials
4. ✅ Database accessible
5. ✅ Ports 3000 (frontend) and 3001 (backend) available

## Quick Setup (One Command)

```bash
cd ~/optiohire
chmod +x deploy/setup-production-24-7-complete.sh
./deploy/setup-production-24-7-complete.sh
```

**Note**: If the script asks you to run a `sudo` command for PM2 startup, copy and run that command, then press Enter to continue.

## What the Setup Script Does

1. ✅ Installs PM2 globally (if not present)
2. ✅ Builds backend TypeScript (`npm run build`)
3. ✅ Builds frontend Next.js (`npm run build`)
4. ✅ Verifies environment configuration
5. ✅ Creates logs directory
6. ✅ Stops any existing PM2 processes
7. ✅ Starts both services using PM2 ecosystem config
8. ✅ Saves PM2 configuration
9. ✅ Sets up Systemd service for auto-start on boot
10. ✅ Configures cron monitoring (backup)
11. ✅ Verifies services are running

## Manual Setup (Step by Step)

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Build Applications

```bash
# Build backend
cd ~/optiohire/backend
npm install
npm run build

# Build frontend
cd ~/optiohire/frontend
npm install
npm run build
```

### Step 3: Configure Environment

Ensure `backend/.env` has:
```env
ENABLE_EMAIL_READER=true
IMAP_POLL_MS=1000
DATABASE_URL=...
JWT_SECRET=...
# ... other credentials
```

### Step 4: Start with PM2

```bash
cd ~/optiohire
pm2 start deploy/ecosystem.config.js --update-env
pm2 save
```

### Step 5: Setup Auto-Start on Boot

```bash
# Generate systemd startup command
pm2 startup systemd -u $USER --hp $HOME

# Run the sudo command it displays (e.g.):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u optiohire --hp /home/optiohire
```

### Step 6: Verify

```bash
pm2 list
pm2 logs
```

## Managing Services

### View Status
```bash
pm2 list
```

### View Logs
```bash
# All logs
pm2 logs

# Backend only
pm2 logs optiohire-backend

# Frontend only
pm2 logs optiohire-frontend

# Last 100 lines
pm2 logs --lines 100
```

### Restart Services
```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart optiohire-backend
pm2 restart optiohire-frontend

# Restart with environment update
pm2 restart all --update-env
```

### Stop Services
```bash
pm2 stop all
```

### Monitor Resources
```bash
pm2 monit
```

## Log Files

All logs are stored in `~/logs/`:

- `backend-combined.log` - Backend all logs
- `backend-error.log` - Backend errors only
- `backend-out.log` - Backend stdout
- `frontend-combined.log` - Frontend all logs
- `frontend-error.log` - Frontend errors only
- `frontend-out.log` - Frontend stdout
- `pm2-health-check.log` - Health check monitoring

## Health Checks

### Backend Health
```bash
curl http://localhost:3001/health
```

### Frontend Health
```bash
curl http://localhost:3000
```

### Email Reader Status
```bash
curl http://localhost:3001/health/email-reader
```

## Troubleshooting

### Services Not Starting

1. **Check PM2 status:**
   ```bash
   pm2 list
   ```

2. **Check logs:**
   ```bash
   pm2 logs --lines 50
   ```

3. **Check if ports are in use:**
   ```bash
   sudo netstat -tulpn | grep -E '3000|3001'
   ```

4. **Verify builds:**
   ```bash
   ls -la ~/optiohire/backend/dist/server.js
   ls -la ~/optiohire/frontend/.next
   ```

### Services Not Auto-Starting on Reboot

1. **Check systemd service:**
   ```bash
   systemctl status pm2-$(whoami)
   ```

2. **Enable service:**
   ```bash
   systemctl enable pm2-$(whoami)
   ```

3. **Check PM2 save:**
   ```bash
   pm2 save
   ```

### Email Reader Not Processing

1. **Check if enabled:**
   ```bash
   grep ENABLE_EMAIL_READER ~/optiohire/backend/.env
   ```

2. **Check email reader logs:**
   ```bash
   pm2 logs optiohire-backend | grep -i email
   ```

3. **Restart backend:**
   ```bash
   pm2 restart optiohire-backend --update-env
   ```

## Systemd vs Cron

### Systemd (Primary)
- ✅ More reliable for auto-start on boot
- ✅ Better process management
- ✅ Integrated with system logs
- **Used for**: Auto-starting PM2 on server reboot

### Cron (Backup)
- ✅ Runs every 2 minutes
- ✅ Checks if processes are running
- ✅ Restarts if crashed
- **Used for**: Health monitoring and crash recovery

## Architecture

```
Server Boot
    ↓
Systemd starts PM2
    ↓
PM2 starts:
  - optiohire-backend (port 3001)
  - optiohire-frontend (port 3000)
    ↓
Cron (every 2 min) checks health
    ↓
If crashed → Auto-restart
```

## Performance

- **Backend**: Max 500MB memory, auto-restart if exceeded
- **Frontend**: Max 800MB memory, auto-restart if exceeded
- **Restart Policy**: Up to 50 restarts, 10s minimum uptime
- **Polling**: Email reader checks every 1 second

## Security

- ✅ All secrets in `.env` files (never in code)
- ✅ PM2 runs as non-root user
- ✅ Logs stored in user home directory
- ✅ No hardcoded credentials

## Next Steps

1. ✅ Setup complete - services running 24/7
2. ✅ Monitor logs for first few hours
3. ✅ Test email processing with sample applications
4. ✅ Configure Nginx reverse proxy (if needed)
5. ✅ Setup SSL certificates (if needed)

---

**Status**: ✅ Production Ready  
**Uptime**: 24/7 Automatic  
**Monitoring**: Systemd + Cron + PM2

