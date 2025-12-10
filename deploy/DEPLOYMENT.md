# OptioHire Digital Ocean Deployment Guide

## Server Information
- **IP Address**: 134.122.1.7
- **IPv6**: Available
- **Private IP**: 10.108.0.2
- **OS**: Ubuntu 24.04 (LTS) x64
- **Specs**: 1 GB Memory / 1 Intel vCPU / 35 GB Disk

## Prerequisites

Before deploying, ensure you have:
1. SSH access to the droplet
2. Your `.env` files ready (backend/.env and frontend/.env.local)
3. Database connection string (Supabase PostgreSQL)
4. All API keys configured

## Step 1: Initial Server Setup

### Connect to your droplet:
```bash
ssh root@134.122.1.7
```

### Run the setup script:
```bash
# On your local machine, copy setup script to server
scp deploy/setup-server.sh root@134.122.1.7:/tmp/
ssh root@134.122.1.7 "chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh"
```

This will install:
- Node.js 20.x
- PM2 (process manager)
- Nginx (reverse proxy)
- PostgreSQL client
- Build tools

## Step 2: Deploy Application Code

### Option A: Using Git (Recommended)

On the server:
```bash
cd /opt
git clone <your-repo-url> optiohire
cd optiohire
```

### Option B: Using rsync (from local machine)

```bash
# From your local project root
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ root@134.122.1.7:/opt/optiohire/
```

## Step 3: Install Dependencies

```bash
cd /opt/optiohire

# Backend dependencies
cd backend
npm install --production=false
npm run build
cd ..

# Frontend dependencies
cd frontend
npm install --production=false
npm run build
cd ..
```

## Step 4: Configure Environment Variables

### Backend (.env)
```bash
nano /opt/optiohire/backend/.env
```

Required variables:
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DB_SSL=true
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env.local)
```bash
nano /opt/optiohire/frontend/.env.local
```

Required variables:
```env
NEXT_PUBLIC_BACKEND_URL=http://134.122.1.7/api
NODE_ENV=production
```

## Step 5: Configure Nginx

```bash
# Copy nginx configuration
cp /opt/optiohire/deploy/nginx.conf /etc/nginx/sites-available/optiohire

# Create symlink
ln -s /etc/nginx/sites-available/optiohire /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

## Step 6: Start Application with PM2

```bash
cd /opt/optiohire

# Start applications
pm2 start deploy/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs
pm2 logs
```

## Step 7: Verify Deployment

### Check backend health:
```bash
curl http://localhost:3001/health
```

### Check frontend:
```bash
curl http://localhost:3000
```

### Check via browser:
Visit: `http://134.122.1.7`

## Step 8: Setup SSL (Optional but Recommended)

### Install Certbot:
```bash
apt-get install certbot python3-certbot-nginx
```

### Get SSL certificate:
```bash
certbot --nginx -d yourdomain.com
```

### Auto-renewal:
```bash
certbot renew --dry-run
```

## Monitoring & Maintenance

### View PM2 logs:
```bash
pm2 logs optiohire-backend
pm2 logs optiohire-frontend
```

### Restart services:
```bash
pm2 restart all
```

### Stop services:
```bash
pm2 stop all
```

### Update application:
```bash
cd /opt/optiohire
git pull  # or rsync new files
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart all
```

### Check system resources:
```bash
pm2 monit
htop
df -h
```

## Troubleshooting

### Backend not starting:
```bash
# Check logs
pm2 logs optiohire-backend --lines 50

# Check if port is in use
netstat -tulpn | grep 3001

# Verify environment variables
cd /opt/optiohire/backend
cat .env
```

### Frontend not starting:
```bash
# Check logs
pm2 logs optiohire-frontend --lines 50

# Check if port is in use
netstat -tulpn | grep 3000

# Verify build exists
ls -la /opt/optiohire/frontend/.next
```

### Nginx errors:
```bash
# Check nginx error log
tail -f /var/log/nginx/error.log

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Database connection issues:
```bash
# Test database connection
psql "your_database_url" -c "SELECT NOW();"
```

### Out of memory:
```bash
# Check memory usage
free -h

# Restart services
pm2 restart all

# Consider upgrading droplet if consistently out of memory
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Root login disabled (optional)
- [ ] Environment variables secured
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials secured
- [ ] SSL certificate installed (if using domain)
- [ ] Regular backups configured
- [ ] PM2 logs rotated
- [ ] Nginx rate limiting enabled

## Backup Strategy

### Database:
Use Supabase backup features or:
```bash
pg_dump "your_database_url" > backup_$(date +%Y%m%d).sql
```

### Application files:
```bash
tar -czf optiohire_backup_$(date +%Y%m%d).tar.gz /opt/optiohire
```

## Performance Optimization

### Enable swap (if needed):
```bash
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Monitor PM2 memory:
```bash
pm2 monit
```

## Quick Reference Commands

```bash
# View all PM2 processes
pm2 list

# Restart backend only
pm2 restart optiohire-backend

# Restart frontend only
pm2 restart optiohire-frontend

# View real-time logs
pm2 logs --lines 100

# Stop all services
pm2 stop all

# Delete PM2 processes
pm2 delete all

# Reload nginx
systemctl reload nginx

# Check nginx status
systemctl status nginx

# View nginx access logs
tail -f /var/log/nginx/access.log
```

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check system logs: `journalctl -xe`
4. Verify environment variables are set correctly
5. Ensure database is accessible from server IP

