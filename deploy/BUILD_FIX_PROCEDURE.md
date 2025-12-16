# Build Error Fix Procedure - DigitalOcean Server

## Problem
When running `npm run build` on the server, you're getting:
```
sh: 1: next: not found
```

This error occurs because the `node_modules` dependencies are not installed in the `frontend` directory.

## Solution: Step-by-Step Fix

### Option 1: Quick Fix (Recommended)

SSH into your server and run these commands:

```bash
# 1. Navigate to your project directory
cd ~/optiohire

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Now build the frontend
npm run build

# 4. If you also need to build the backend
cd ../backend
npm install
npm run build
```

### Option 2: Using Root Package.json Scripts

You can also use the convenience scripts from the root `package.json`:

```bash
# 1. Navigate to your project directory
cd ~/optiohire

# 2. Install all dependencies (frontend + backend)
npm run install:all

# 3. Build frontend
npm run build:frontend

# 4. Build backend (if needed)
cd backend
npm run build
```

### Option 3: Complete Clean Install (If Option 1 or 2 fails)

**Use this if you're getting ENOTEMPTY or other npm install errors:**

```bash
# 1. Navigate to your project directory
cd ~/optiohire

# 2. Clean frontend installation (fixes ENOTEMPTY errors)
cd frontend
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install

# 3. Build frontend
npm run build

# 4. Clean backend installation (if needed)
cd ../backend
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install
npm run build
```

## Important Notes

1. **Node.js Version**: Make sure you have Node.js 18+ installed. Check with:
   ```bash
   node --version
   ```

2. **npm Version**: Ensure npm is installed and up-to-date:
   ```bash
   npm --version
   ```

3. **Memory Issues**: If the build fails due to memory issues on a small server, you may need to:
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

4. **Network Issues**: If npm install fails due to network issues, try:
   ```bash
   npm install --legacy-peer-deps
   ```

## Verification

After successfully building:

```bash
# Check if .next directory was created
ls -la ~/optiohire/frontend/.next

# Check if dist directory was created (backend)
ls -la ~/optiohire/backend/dist
```

## After Building

Once the build is successful, you can start your application:

```bash
# If using PM2
cd ~/optiohire
pm2 start deploy/ecosystem.config.js
pm2 save

# Or manually start
cd ~/optiohire/frontend
npm run start
```

## Troubleshooting

### ENOTEMPTY Error (npm install fails with "directory not empty")

This error occurs when npm tries to rename a directory but it's not empty, usually due to a corrupted node_modules.

**Fix:**
```bash
cd ~/optiohire/frontend

# Remove corrupted node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache (optional but recommended)
npm cache clean --force

# Install fresh
npm install
```

**If the above doesn't work, try:**
```bash
cd ~/optiohire/frontend

# Force remove node_modules (be careful with this)
sudo rm -rf node_modules package-lock.json .next

# Install again
npm install
```

**Alternative: Use npm ci instead:**
```bash
cd ~/optiohire/frontend
rm -rf node_modules
npm ci
```

### Still getting "next: not found"?

1. Verify npm install completed successfully:
   ```bash
   ls -la ~/optiohire/frontend/node_modules/.bin/next
   ```

2. Check if you're in the correct directory:
   ```bash
   pwd  # Should show: /home/optiohire/optiohire/frontend
   ```

3. Try installing with verbose output:
   ```bash
   npm install --verbose
   ```

### Build fails with TypeScript errors?

Make sure TypeScript is installed:
```bash
cd ~/optiohire/frontend
npm install --save-dev typescript @types/react @types/node
```

### Permission errors?

If you see permission errors:
```bash
# Check current user
whoami

# If needed, fix ownership
sudo chown -R optiohire:optiohire ~/optiohire
```

