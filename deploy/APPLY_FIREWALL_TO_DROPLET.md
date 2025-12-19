# ✅ Apply Firewall to Droplet - Final Step

## Current Status
- ✅ OUTBOUND rules added (ports 465 and 587)
- ✅ INBOUND rule exists (SSH on port 22 - this is correct and needed)
- ⚠️ **Need to apply firewall to droplet**

## Final Step: Apply Firewall to Your Droplet

### In the DigitalOcean Dashboard:

1. **Scroll down** to the "Apply to Droplets" section (shown in your image)

2. **Select Your Droplet**:
   - In the search box labeled "Search for a Droplet or a tag"
   - Type your server name (e.g., "ubuntu-s-1vcpu-1gb-35gb-intel-nyc3-01")
   - OR select it from the dropdown list
   - Click on your droplet to select it

3. **Create the Firewall**:
   - Click the green **"Create Firewall"** button at the bottom
   - Wait for confirmation message

4. **Verify It's Applied**:
   - You should see a success message
   - The firewall is now active and protecting your droplet

## After Applying Firewall

### Step 1: Wait 1-2 Minutes
Firewall changes take a moment to propagate.

### Step 2: Test SMTP Connection
On your server, run:
```bash
cd ~/optiohire
git pull origin main
chmod +x deploy/verify-smtp-after-firewall.sh
./deploy/verify-smtp-after-firewall.sh
```

This will:
- ✅ Test if ports 465 and 587 are now accessible
- ✅ Test SMTP connection via backend
- ✅ Show you if everything is working

### Step 3: Restart Backend
```bash
pm2 restart optiohire-backend --update-env
```

### Step 4: Monitor Logs
```bash
pm2 logs optiohire-backend | grep -i "smtp\|email"
```

You should see:
```
✅ Email service: SMTP connection verified successfully
```

## About the INBOUND Rule (SSH)

The **INBOUND rule for SSH (port 22)** is **correct and needed**:
- ✅ Allows you to SSH into your server
- ✅ Keeps your server accessible
- ✅ This is standard and safe

**You don't need to add any INBOUND rules for SMTP** because:
- SMTP is **outbound** (your server sends emails)
- You only need OUTBOUND rules (which you've added ✅)

## Quick Checklist

- [x] OUTBOUND rule for port 465 (TCP) added
- [x] OUTBOUND rule for port 587 (TCP) added
- [x] INBOUND rule for SSH (port 22) exists
- [ ] **Firewall applied to droplet** ← Do this now!
- [ ] Tested SMTP connection
- [ ] Backend restarted
- [ ] Verified emails are sending

## Troubleshooting

### If ports are still blocked after applying:
1. **Wait 2-3 minutes** - changes need time to propagate
2. **Check firewall is attached**:
   - Go to your droplet → Networking tab
   - Verify "OptioHire" firewall is listed
3. **Verify rules are correct**:
   - Go back to firewall settings
   - Confirm OUTBOUND rules show ports 465 and 587
4. **Run test script again**:
   ```bash
   ./deploy/verify-smtp-after-firewall.sh
   ```

### If you see "Firewall already exists":
- You may have created it before
- Go to: https://cloud.digitalocean.com/networking/firewalls
- Find "OptioHire" firewall
- Click "Edit" → Scroll to "Apply to Droplets"
- Add your droplet if it's not there

---

**Once firewall is applied to droplet, SMTP will work!** 🎉

