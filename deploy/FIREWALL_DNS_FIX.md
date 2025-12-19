# 🔥 CRITICAL: Firewall Blocking DNS + SMTP

## Problem
- ❌ Ports 465 and 587 are blocked
- ❌ DNS timeout (`queryA ETIMEOUT smtp.gmail.com`)
- **Root Cause**: Firewall blocking DNS queries AND SMTP ports

## Solution: Add DNS Rules to Firewall

The firewall is blocking **DNS queries** (needed to resolve `smtp.gmail.com`).

### Step 1: Add DNS Rules to DigitalOcean Firewall

Go to your firewall in DigitalOcean dashboard and add **TWO more OUTBOUND rules**:

**Rule 3: DNS UDP**
- Type: Custom
- Protocol: **UDP**
- Port Range: `53`
- Destination: All IPv4
- Description: DNS

**Rule 4: DNS TCP**
- Type: Custom
- Protocol: **TCP**
- Port Range: `53`
- Destination: All IPv4
- Description: DNS TCP

### Step 2: Verify Firewall is Applied

**CRITICAL**: Make sure the firewall is **applied to your droplet**:

1. Go to: https://cloud.digitalocean.com/networking/firewalls
2. Click on your "OptioHire" firewall
3. Scroll to "Apply to Droplets" section
4. Verify your droplet is listed there
5. If not, click "Edit" → Add your droplet → Save

### Step 3: Complete Firewall Rules Checklist

Your firewall should have these **OUTBOUND** rules:

- [x] Port 465 (TCP) - SMTP SSL
- [x] Port 587 (TCP) - SMTP TLS
- [ ] **Port 53 (UDP) - DNS** ← ADD THIS
- [ ] **Port 53 (TCP) - DNS TCP** ← ADD THIS

**INBOUND** rules (you should have):
- [x] Port 22 (TCP) - SSH

### Step 4: Wait and Test

1. **Wait 2-3 minutes** for firewall changes to propagate
2. **Test on server**:
   ```bash
   cd ~/optiohire
   chmod +x deploy/check-firewall-status.sh
   ./deploy/check-firewall-status.sh
   ```

This will test:
- ✅ DNS resolution
- ✅ SMTP port connectivity
- ✅ Show what's still blocked

### Step 5: After Everything Works

Once ports are accessible:
```bash
pm2 restart optiohire-backend --update-env
pm2 logs optiohire-backend | grep -i "smtp"
```

Should see: `✅ Email service: SMTP connection verified successfully`

## Why DNS is Needed

Your server needs to:
1. **Resolve DNS** (`smtp.gmail.com` → IP address) - needs port 53
2. **Connect to SMTP** (send emails) - needs ports 465/587

If DNS is blocked, the server can't even find Gmail's servers!

## Quick Test Commands

Test DNS:
```bash
nslookup smtp.gmail.com
# or
host smtp.gmail.com
```

Test SMTP ports (using IP directly):
```bash
# Get IP first
SMTP_IP=$(getent hosts smtp.gmail.com | awk '{print $1}' | head -1)
echo "Testing $SMTP_IP:465..."
timeout 5 bash -c "echo > /dev/tcp/$SMTP_IP/465" && echo "✅ Works" || echo "❌ Blocked"
```

---

**After adding DNS rules and verifying firewall is applied, everything should work!** 🎉

