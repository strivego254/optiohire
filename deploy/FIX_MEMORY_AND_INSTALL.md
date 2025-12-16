# Fix Memory Issue and Install Dependencies

## Problem
Server has only 1GB RAM and npm install is being killed due to insufficient memory.

## Solution: Add Swap Space + Install

### Step 1: Create Swap File (2GB)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Step 2: Make Swap Permanent
```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 3: Verify Swap is Active
```bash
free -h
```

### Step 4: Navigate to Frontend Directory
```bash
cd ~/optiohire/frontend
```

### Step 5: Clean Previous Attempts
```bash
rm -rf node_modules package-lock.json .next
```

### Step 6: Install with Memory Limit
```bash
NODE_OPTIONS="--max-old-space-size=1024" npm install --no-audit --no-fund --legacy-peer-deps
```

### Step 7: Build with Increased Memory
```bash
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

## Done!
After these steps, your build should complete successfully.

