# Complete Setup Guide: SSL Certificate & 24/7 Auto-Run

This guide will help you:
1. **Set up SSL certificate** (free from Let's Encrypt) to remove "Not secure" warning
2. **Configure automatic 24/7 operation** so the app runs without manual intervention

---

## Part 1: SSL Certificate Setup

### Prerequisites
- Domain `optiohire.com` pointing to your DigitalOcean server IP
- Port 80 (HTTP) and 443 (HTTPS) open in firewall
- Root/sudo access on the server

### Step-by-Step Instructions

**On your server, run:**

```bash
cd ~/optiohire

# Pull latest code (includes SSL setup script)
git pull origin main

# Make script executable
chmod +x deploy/setup-ssl.sh

# Run SSL setup (requires sudo)
sudo ./deploy/setup-ssl.sh
```

### What the script does:
1. ✅ Installs certbot (Let's Encrypt client)
2. ✅ Obtains free SSL certificate for `optiohire.com` and `www.optiohire.com`
3. ✅ Configures nginx for HTTPS
4. ✅ Sets up automatic certificate renewal
5. ✅ Redirects HTTP to HTTPS

### Manual Steps (if script fails):

If the automated script doesn't work, follow these steps:

```bash
# 1. Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Obtain certificate
sudo certbot --nginx -d optiohire.com -d www.optiohire.com

# 3. Test auto-renewal
sudo certbot renew --dry-run

# 4. Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Verify SSL:
- Visit `https://optiohire.com` (should show 🔒 secure)
- Check certificate: `openssl s_client -connect optiohire.com:443 -servername optiohire.com`

---

## Part 2: 24/7 Auto-Run Setup

### Current Status
Your app is already using PM2, but we need to ensure it auto-starts on server reboot.

### Step-by-Step Instructions

**On your server, run:**

```bash
cd ~/optiohire

# Pull latest code
git pull origin main

# Make script executable
chmod +x deploy/setup-pm2-autostart.sh

# Run auto-start setup
./deploy/setup-pm2-autostart.sh
```

### Important: Run the PM2 Startup Command

The script will show you a command like:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u optiohire --hp /home/optiohire
```

**Copy and run that exact command** (it sets up systemd to auto-start PM2 on boot).

### Verify Auto-Start:

```bash
# Check PM2 status
pm2 list

# Check if startup service exists
sudo systemctl status pm2-optiohire

# Test (optional - only if you want to verify)
# sudo reboot
# After reboot, SSH back in and check: pm2 list
```

### What's Now Automated:

1. ✅ **PM2 Auto-Start**: Backend and frontend start automatically on server reboot
2. ✅ **Process Monitoring**: Script checks every 5 minutes and restarts crashed processes
3. ✅ **Email Reader**: Runs 24/7, checking inbox every 1 second
4. ✅ **No Manual Intervention**: Everything runs automatically

---

## Troubleshooting

### SSL Issues

**Problem**: "Failed to obtain certificate"
- **Solution**: Ensure domain DNS points to server IP
- **Check**: `dig optiohire.com` or `nslookup optiohire.com`

**Problem**: "Port 80 not accessible"
- **Solution**: Open port 80 in DigitalOcean firewall
- **Check**: `sudo ufw status` or DigitalOcean Networking → Firewalls

**Problem**: "Certificate expired"
- **Solution**: Auto-renewal should handle this, but manually renew with:
  ```bash
  sudo certbot renew
  sudo systemctl reload nginx
  ```

### Auto-Start Issues

**Problem**: "PM2 processes not starting after reboot"
- **Solution**: 
  ```bash
  # Re-run startup command
  pm2 startup
  # Copy and run the shown command
  pm2 save
  ```

**Problem**: "Backend not processing emails"
- **Solution**: Check PM2 status
  ```bash
  pm2 list
  pm2 logs optiohire-backend
  ```

**Problem**: "Email reader stopped"
- **Solution**: Check logs and restart
  ```bash
  pm2 logs optiohire-backend --lines 50
  pm2 restart optiohire-backend
  ```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Visit `https://optiohire.com` - shows 🔒 (not "Not secure")
- [ ] `pm2 list` shows both backend and frontend as "online"
- [ ] `sudo systemctl status pm2-optiohire` shows "active (running)"
- [ ] `curl http://localhost:3001/health/email-reader` returns email reader status
- [ ] Test: Send a test application email and verify it's processed automatically

---

## Maintenance

### SSL Certificate Renewal
- **Automatic**: Certbot renews certificates automatically
- **Manual**: `sudo certbot renew` (if needed)

### PM2 Monitoring
- **Logs**: `pm2 logs` (all processes) or `pm2 logs optiohire-backend` (backend only)
- **Status**: `pm2 status`
- **Restart**: `pm2 restart all` or `pm2 restart optiohire-backend`

### Server Reboot
After server reboot, everything should start automatically. Verify with:
```bash
pm2 list
curl http://localhost:3001/health
```

---

## Support

If you encounter issues:
1. Check logs: `pm2 logs` and `/var/log/nginx/error.log`
2. Verify services: `sudo systemctl status nginx` and `pm2 list`
3. Test connectivity: `curl https://optiohire.com`

Your app is now configured for 24/7 operation with SSL security! 🚀

