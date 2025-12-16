# Fix Nginx Static Files Issue - Step by Step

## Problem
- Static files (JS/CSS) are being served with wrong MIME types (`text/html` instead of `application/javascript`/`text/css`)
- Browser refuses to load scripts and styles
- App works on first load but breaks on subsequent loads

## Root Cause
Nginx is proxying all requests (including static files) to Next.js instead of serving static files directly with proper MIME types.

## Solution: Update Nginx Configuration

### Step 1: SSH to Your Server
```bash
ssh optiohire@134.122.1.7
```

### Step 2: Backup Current Nginx Config
```bash
sudo cp /etc/nginx/sites-available/optiohire /etc/nginx/sites-available/optiohire.backup
```

### Step 3: Pull Latest Changes (to get updated nginx.conf)
```bash
cd ~/optiohire
git pull origin main
```

### Step 4: Copy Updated Nginx Config
```bash
sudo cp ~/optiohire/deploy/nginx.conf /etc/nginx/sites-available/optiohire
```

### Step 5: Verify Nginx Configuration
```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 6: Check Static Files Directory Exists
```bash
ls -la ~/optiohire/frontend/.next/static/
```

If the directory doesn't exist, you need to rebuild:
```bash
cd ~/optiohire/frontend
npm run build
```

### Step 7: Set Proper Permissions
```bash
# Ensure Nginx can read the static files
sudo chown -R optiohire:optiohire ~/optiohire/frontend/.next
chmod -R 755 ~/optiohire/frontend/.next
```

### Step 8: Reload Nginx (Don't restart - this is zero-downtime)
```bash
sudo systemctl reload nginx
```

### Step 9: Verify Static Files Are Being Served
```bash
# Test from server
curl -I http://localhost/_next/static/chunks/webpack-*.js | head -5

# Should show:
# HTTP/1.1 200 OK
# Content-Type: application/javascript
```

### Step 10: Clear Browser Cache
**Important:** Clear your browser cache or use incognito mode to test:
- Chrome/Edge: `Ctrl+Shift+Delete` → Clear cached images and files
- Firefox: `Ctrl+Shift+Delete` → Cached Web Content
- Or use Incognito/Private mode

### Step 11: Test in Browser
1. Open `http://optiohire.com` in incognito/private mode
2. Open Developer Tools (F12)
3. Check Console tab - should see NO MIME type errors
4. Check Network tab - static files should have correct Content-Type headers

## Verification Checklist

✅ Nginx config syntax is valid (`sudo nginx -t`)
✅ Static files directory exists (`ls ~/optiohire/frontend/.next/static/`)
✅ Nginx reloaded successfully (`sudo systemctl reload nginx`)
✅ Browser cache cleared
✅ No MIME type errors in browser console
✅ Static files load with correct Content-Type headers

## Troubleshooting

### If Nginx test fails:
```bash
# Check for syntax errors
sudo nginx -t

# View error details
sudo tail -50 /var/log/nginx/error.log
```

### If static files return 404:
```bash
# Check if directory exists
ls -la ~/optiohire/frontend/.next/static/

# Check permissions
ls -la ~/optiohire/frontend/.next/

# Rebuild if needed
cd ~/optiohire/frontend
rm -rf .next
npm run build
```

### If static files still have wrong MIME type:
```bash
# Check Nginx is using the new config
sudo nginx -T | grep -A 10 "_next/static"

# Verify file exists and is readable
sudo cat ~/optiohire/frontend/.next/static/chunks/webpack-*.js | head -1

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### If app still doesn't work:
```bash
# Check PM2 is running
pm2 status

# Check frontend logs
pm2 logs optiohire-frontend --lines 50

# Restart frontend
pm2 restart optiohire-frontend

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## What Changed

The updated Nginx config now:
1. ✅ Serves `/_next/static/` files directly from disk (not proxied)
2. ✅ Sets proper MIME types for JS, CSS, images, fonts
3. ✅ Adds caching headers for static assets
4. ✅ Includes domain name (`optiohire.com`) in server_name
5. ✅ Serves public static files directly

## After Fix

Once fixed, the app should:
- ✅ Load correctly on first visit
- ✅ Continue working on subsequent visits
- ✅ Work across different browsers
- ✅ Have no MIME type errors in console
- ✅ Load static assets quickly with proper caching

