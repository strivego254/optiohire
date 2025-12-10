# ✅ Deployment Complete - OptioHire

## Deployment Summary

**Server**: 134.122.1.7  
**User**: optiohire  
**Directory**: `/home/optiohire/optiohire`  
**Status**: ✅ **RUNNING**

## Services Status

### Backend
- **Status**: ✅ Online
- **Port**: 3001
- **Health Check**: http://134.122.1.7/health
- **PM2 Process**: `optiohire-backend`

### Frontend
- **Status**: ✅ Online  
- **Port**: 3000
- **URL**: http://134.122.1.7
- **PM2 Process**: `optiohire-frontend`

### Nginx
- **Status**: ✅ Running
- **Config**: `/etc/nginx/sites-available/optiohire`
- **Reverse Proxy**: Configured

## Access URLs

- **Frontend**: http://134.122.1.7
- **Backend API**: http://134.122.1.7/api
- **Health Check**: http://134.122.1.7/health

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs optiohire-backend
pm2 logs optiohire-frontend

# Restart services
pm2 restart all
pm2 restart optiohire-backend
pm2 restart optiohire-frontend

# Stop services
pm2 stop all

# Monitor
pm2 monit
```

## Update Application

```bash
# SSH to server
ssh optiohire@134.122.1.7

# Navigate to project
cd /home/optiohire/optiohire

# Pull latest changes
git pull origin main

# Rebuild backend
cd backend
npm install
npm run build
cd ..

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart services
pm2 restart all
pm2 save
```

## Environment Variables

Backend `.env` location: `/home/optiohire/optiohire/backend/.env`  
Frontend `.env.local` location: `/home/optiohire/optiohire/frontend/.env.local`

## Logs Location

- Backend logs: `/home/optiohire/logs/backend-*.log`
- Frontend logs: `/home/optiohire/logs/frontend-*.log`
- PM2 logs: `pm2 logs`

## Firewall Status

UFW is enabled with:
- SSH (22) - ✅ Allowed
- HTTP (80) - ✅ Allowed
- HTTPS (443) - ✅ Allowed

## Next Steps (Optional)

1. **Setup SSL Certificate** (if you have a domain):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

2. **Configure Domain**:
   - Add A record pointing to 134.122.1.7
   - Update nginx config with domain name
   - Restart nginx

3. **Monitor Performance**:
   ```bash
   pm2 monit
   htop
   ```

## Troubleshooting

### Backend not starting:
```bash
pm2 logs optiohire-backend
# Check for DATABASE_URL or other env issues
```

### Frontend not starting:
```bash
pm2 logs optiohire-frontend
# Check if build exists: ls -la frontend/.next
```

### Nginx 502 error:
```bash
sudo nginx -t
sudo systemctl status nginx
pm2 status  # Check if services are running
```

### Port already in use:
```bash
pm2 delete all
pm2 start /home/optiohire/optiohire/deploy/ecosystem.config.js
pm2 save
```

## Deployment Date

**Deployed**: December 10, 2025  
**Deployed by**: Auto-deployment script  
**Server**: Digital Ocean Droplet (Ubuntu 24.04)

