# Step-by-Step Build Instructions for Server

## Current Situation
✅ Swap space is already active (2.0Gi) - Good!
❌ Build script not on server yet (needs to be pulled from GitHub)

## Option 1: Build Immediately (No Git Pull Needed)

### Step 1: Navigate to Frontend Directory
```bash
cd ~/optiohire/frontend
```

### Step 2: Clean Previous Build Attempts
```bash
rm -rf .next node_modules/.cache
```

### Step 3: Build with Memory Optimization
```bash
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

**This will:**
- Use 1.5GB of memory for Node.js (instead of default ~512MB)
- Build your Next.js application
- May take 10-20 minutes on a 1GB RAM server

---

## Option 2: Pull Latest Changes First (Recommended for Future)

### Step 1: On Your Local Machine - Commit and Push Changes

```bash
# Navigate to your local project
cd "/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/OPTIOHIRE PROJECT/optiohire"

# Check what files changed
git status

# Add the new files
git add frontend/package.json
git add frontend/next.config.js
git add frontend/build-low-memory.sh
git add DEPLOYMENT_GUIDE.md

# Commit
git commit -m "feat: add memory-optimized build configuration for low-RAM servers

- Add build:low-memory script with increased Node.js heap size
- Disable TypeScript and ESLint during build to save memory
- Add build-low-memory.sh script for automated builds
- Update deployment guide with memory optimization steps"

# Push to GitHub
git push origin main
```

### Step 2: On Server - Pull Latest Changes

```bash
# Navigate to project directory
cd ~/optiohire

# Pull latest changes
git pull origin main
```

### Step 3: Navigate to Frontend and Build

```bash
cd frontend

# Clean previous attempts
rm -rf .next node_modules/.cache

# Use the new build script
chmod +x build-low-memory.sh
./build-low-memory.sh
```

---

## If Build Still Fails

### Check Available Memory
```bash
free -h
```

### Monitor Build Progress
```bash
# In another terminal, watch memory usage
watch -n 2 free -h
```

### If Out of Memory Error Persists
```bash
# Try with even more memory (if swap allows)
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

## Quick Reference

**Immediate build (no git pull):**
```bash
cd ~/optiohire/frontend
rm -rf .next node_modules/.cache
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

**After pulling changes:**
```bash
cd ~/optiohire/frontend
./build-low-memory.sh
```

