# Complete Production Setup - Step by Step

## Prerequisites ✅
- Frontend built successfully
- Environment variables transferred to server
- Swap space configured (2GB)

## Step 1: Build Backend

```bash
cd ~/optiohire/backend
npm install
npm run build
```

Verify build:
```bash
ls -la dist/server.js
```

---

## Step 2: Create Logs Directory for PM2

```bash
mkdir -p ~/optiohire/logs
```

---

## Step 3: Setup Nginx

**Step 3.1: Copy Nginx configuration**
```bash
sudo cp ~/optiohire/deploy/nginx.conf /etc/nginx/sites-available/optiohire
```

**Step 3.2: Enable the site**
```bash
sudo ln -s /etc/nginx/sites-available/optiohire /etc/nginx/sites-enabled/
```

**Step 3.3: Remove default site (optional)**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

**Step 3.4: Test Nginx configuration**
```bash
sudo nginx -t
```

**Step 3.5: Restart Nginx**
```bash
sudo systemctl restart nginx
```

**Step 3.6: Enable Nginx to start on boot**
```bash
sudo systemctl enable nginx
```

---

## Step 4: Start Services with PM2

**Step 4.1: Stop any existing PM2 processes**
```bash
pm2 stop all
pm2 delete all
```

**Step 4.2: Start both backend and frontend**
```bash
cd ~/optiohire
pm2 start deploy/ecosystem.config.js
```

**Step 4.3: Save PM2 configuration (so it starts on server reboot)**
```bash
pm2 save
```

**Step 4.4: Setup PM2 to start on system boot**
```bash
pm2 startup
```
(Follow the instructions it gives you - you'll need to run a sudo command)

---

## Step 5: Verify Everything is Working

**Step 5.1: Check PM2 status**
```bash
pm2 status
```
Both services should show "online" status.

**Step 5.2: Check PM2 logs**
```bash
pm2 logs
```
(Press `Ctrl+C` to exit)

**Step 5.3: Test backend**
```bash
curl http://localhost:3001/health
```

**Step 5.4: Test frontend**
```bash
curl http://localhost:3000
```

**Step 5.5: Test through Nginx (from your local machine or browser)**
```bash
curl http://134.122.1.7
```

Or open in browser: `http://134.122.1.7`

---

## Troubleshooting

**If PM2 shows errors:**
```bash
pm2 logs optiohire-backend --lines 50
pm2 logs optiohire-frontend --lines 50
```

**If Nginx shows 502 Bad Gateway:**
- Check if PM2 services are running: `pm2 status`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

**If services are crashing:**
- Check environment variables are correct
- Check logs: `pm2 logs`
- Restart: `pm2 restart all`

---

## Summary

After completing all steps:
- ✅ Backend running on port 3001
- ✅ Frontend running on port 3000
- ✅ Nginx reverse proxy configured
- ✅ PM2 managing services
- ✅ Services will auto-start on server reboot
- ✅ Accessible at: http://134.122.1.7

