# Fix "Port Already in Use" Error

## Problem
Error: `EADDRINUSE: address already in use :::3000`

This means port 3000 is already being used by another process.

## Solution: Find and Stop the Process

### Step 1: Check what's using port 3000
```bash
sudo lsof -i :3000
```

Or:
```bash
sudo netstat -tulpn | grep :3000
```

### Step 2: Stop the process

**Option A: If it's a Node.js process, kill it:**
```bash
# Find the process ID (PID) from Step 1, then:
sudo kill -9 <PID>
```

**Option B: Kill all Node.js processes (careful - stops all Node apps):**
```bash
sudo pkill -f node
```

**Option C: Check if PM2 is running it:**
```bash
pm2 list
pm2 stop all
pm2 delete all
```

### Step 3: Verify port is free
```bash
sudo lsof -i :3000
# Should return nothing if port is free
```

### Step 4: Start your application
```bash
cd ~/optiohire/frontend
npm run start
```

Or use PM2 (recommended for production):
```bash
cd ~/optiohire
pm2 start deploy/ecosystem.config.js
pm2 save
```

