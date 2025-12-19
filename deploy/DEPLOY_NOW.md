# 🚀 Deploy to Production Server - Quick Start

## On Your Server, Run:

```bash
# 1. Navigate to project directory
cd ~/optiohire

# 2. Pull latest changes
git pull origin main

# 3. Run the production setup script
chmod +x deploy/setup-production-24-7-complete.sh
./deploy/setup-production-24-7-complete.sh
```

## Important Notes:

1. **If the script asks for a sudo command**: Copy and run the `sudo` command it displays, then press Enter to continue.

2. **The script will**:
   - Build both backend and frontend
   - Start services with PM2
   - Configure auto-start on boot
   - Set up monitoring

3. **After setup, verify**:
   ```bash
   pm2 list
   pm2 logs
   ```

## That's It! Your app is now running 24/7! 🎉

---

**Need help?** See `deploy/PRODUCTION_SETUP_GUIDE.md` for detailed documentation.

