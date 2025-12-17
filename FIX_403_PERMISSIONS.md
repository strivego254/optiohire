# Fix 403 Forbidden Errors - Step by Step

## Problem
- All static files (JS, CSS, fonts, images) return 403 Forbidden
- Nginx can't read files owned by `optiohire` user
- Next.js should serve its own static files to avoid permission issues

## Solution: Let Next.js Serve Static Files + Fix Permissions

### Step 1: SSH to Your Server
```bash
ssh optiohire@134.122.1.7
```

### Step 2: Pull Latest Changes
```bash
cd ~/optiohire
git pull origin main
```

### Step 3: Update Nginx Config (Simplified - Let Next.js Handle Static Files)
```bash
sudo cp ~/optiohire/deploy/nginx.conf /etc/nginx/sites-available/optiohire
```

### Step 4: Verify Nginx Config
```bash
sudo nginx -t
```

### Step 5: Ensure Frontend Process Can Access Files
```bash
# Check current permissions
ls -la ~/optiohire/frontend/.next/static/

# Ensure optiohire user owns everything
chown -R optiohire:optiohire ~/optiohire/frontend/.next
chmod -R 755 ~/optiohire/frontend/.next

# Also ensure public directory is accessible
chown -R optiohire:optiohire ~/optiohire/frontend/public
chmod -R 755 ~/optiohire/frontend/public
```

### Step 6: Reload Nginx
```bash
sudo systemctl reload nginx
```

### Step 7: Restart Frontend (Important!)
```bash
pm2 restart optiohire-frontend
```

### Step 8: Check PM2 Logs
```bash
pm2 logs optiohire-frontend --lines 50
```

### Step 9: Test Static File Access
```bash
# Test from server - should return 200 OK
curl -I http://localhost:3000/_next/static/chunks/webpack-*.js 2>&1 | head -5

# Test through Nginx - should proxy correctly
curl -I http://localhost/_next/static/chunks/webpack-*.js 2>&1 | head -5
```

### Step 10: Clear Browser Cache and Test
1. Open browser in **Incognito/Private mode**
2. Go to `http://optiohire.com`
3. Open Developer Tools (F12)
4. Check Console - should see NO 403 errors
5. Check Network tab - static files should load with 200 OK

## Alternative: If Still Getting 403 Errors

### Option A: Check SELinux/AppArmor (if enabled)
```bash
# Check if SELinux is blocking
getenforce

# If enforcing, temporarily set to permissive to test
sudo setenforce 0

# If this fixes it, you need to configure SELinux properly
```

### Option B: Verify Frontend is Running Correctly
```bash
# Check PM2 status
pm2 status

# Check if frontend is listening on port 3000
netstat -tulpn | grep 3000

# Check frontend logs for errors
pm2 logs optiohire-frontend --err --lines 100
```

### Option C: Rebuild Frontend
```bash
cd ~/optiohire/frontend
rm -rf .next
NODE_OPTIONS="--max-old-space-size=1536" npm run build
pm2 restart optiohire-frontend
```

## What Changed

The updated Nginx config now:
1. ✅ Removes direct static file serving (avoids permission issues)
2. ✅ Lets Next.js serve its own static files (it knows correct paths and MIME types)
3. ✅ Proxies all requests to Next.js, which handles static files correctly
4. ✅ Simpler configuration = fewer issues

## Why This Works

- Next.js knows the correct paths (`/_next/static/` not `/next/static/`)
- Next.js sets correct MIME types automatically
- No permission issues since Next.js process owns the files
- Works consistently across all browsers and sessions

## Verification Checklist

✅ Nginx config updated and tested
✅ Frontend files have correct permissions
✅ Frontend process restarted
✅ No 403 errors in browser console
✅ Static files load with 200 OK status
✅ UI renders correctly


