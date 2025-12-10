# Quick Start Deployment Guide

## 🚀 Fast Deployment (5 minutes)

### 1. Connect to Server
```bash
ssh root@134.122.1.7
```

### 2. Run Initial Setup (One-time)
```bash
# Copy setup script to server
scp deploy/setup-server.sh root@134.122.1.7:/tmp/
ssh root@134.122.1.7 "chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh"
```

### 3. Deploy Code
```bash
# On server
cd /opt
git clone <your-repo-url> optiohire
# OR use rsync from local machine:
# rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' ./ root@134.122.1.7:/opt/optiohire/
```

### 4. Install & Build
```bash
cd /opt/optiohire

# Backend
cd backend
npm install
npm run build
# Copy your .env file here
nano .env  # Add your environment variables
cd ..

# Frontend
cd frontend
npm install
npm run build
# Copy your .env.local file here
nano .env.local  # Add NEXT_PUBLIC_BACKEND_URL=http://134.122.1.7/api
cd ..
```

### 5. Configure Nginx
```bash
cp deploy/nginx.conf /etc/nginx/sites-available/optiohire
ln -s /etc/nginx/sites-available/optiohire /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
nginx -t  # Test configuration
systemctl restart nginx
```

### 6. Start Services
```bash
cd /opt/optiohire
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 status
```

### 7. Verify
Visit: `http://134.122.1.7`

## 🔄 Quick Updates

```bash
cd /opt/optiohire
git pull  # or rsync new files
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart all
```

## 📋 Required Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
DB_SSL=true
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secret_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://134.122.1.7/api
NODE_ENV=production
```

## 🐛 Common Issues

**Port already in use:**
```bash
pm2 delete all
pm2 start deploy/ecosystem.config.js
```

**Build fails:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Nginx 502 error:**
```bash
pm2 logs  # Check if services are running
systemctl status nginx
```

