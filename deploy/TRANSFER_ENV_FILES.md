# Transfer Environment Variables to Server

## Step-by-Step Guide

### Method 1: Using SCP (Recommended - Secure Copy)

**Step 1: Transfer Backend .env file**
```bash
scp backend/.env optiohire@134.122.1.7:/home/optiohire/optiohire/backend/.env
```

**Step 2: Transfer Frontend .env.local file**
```bash
scp frontend/.env.local optiohire@134.122.1.7:/home/optiohire/optiohire/frontend/.env.local
```

**Step 3: Verify files were transferred**
```bash
ssh optiohire@134.122.1.7 "ls -la ~/optiohire/backend/.env && ls -la ~/optiohire/frontend/.env.local"
```

---

### Method 2: Create Files Directly on Server (If you prefer to copy-paste content)

**Step 1: SSH into server**
```bash
ssh optiohire@134.122.1.7
```

**Step 2: Create backend .env file**
```bash
cd ~/optiohire/backend
nano .env
```
- Paste your backend .env content
- Press `Ctrl+X`, then `Y`, then `Enter` to save

**Step 3: Create frontend .env.local file**
```bash
cd ~/optiohire/frontend
nano .env.local
```
- Paste your frontend .env.local content
- Press `Ctrl+X`, then `Y`, then `Enter` to save

**Step 4: Verify files exist**
```bash
ls -la ~/optiohire/backend/.env
ls -la ~/optiohire/frontend/.env.local
```

---

### Method 3: Using cat with heredoc (For small files)

**On your local machine, run:**

```bash
# Backend .env
ssh optiohire@134.122.1.7 "cat > ~/optiohire/backend/.env << 'EOF'
$(cat backend/.env)
EOF"

# Frontend .env.local
ssh optiohire@134.122.1.7 "cat > ~/optiohire/frontend/.env.local << 'EOF'
$(cat frontend/.env.local)
EOF"
```

---

## After Transferring

**Important: Update frontend .env.local for production**

Make sure your frontend `.env.local` has the production backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://134.122.1.7/api
# or if you have a domain:
# NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com/api
```

**To update it on server:**
```bash
ssh optiohire@134.122.1.7
cd ~/optiohire/frontend
nano .env.local
# Update NEXT_PUBLIC_BACKEND_URL to http://134.122.1.7/api
# Save and exit
```

---

## Security Note

- ✅ Environment files are in `.gitignore` (not committed to git)
- ✅ Use secure file permissions (default 600)
- ✅ Files are stored on server only

**Verify permissions after transfer:**
```bash
ssh optiohire@134.122.1.7 "chmod 600 ~/optiohire/backend/.env ~/optiohire/frontend/.env.local"
```

