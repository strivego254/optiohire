# 🔥 CRITICAL: Fix DigitalOcean Firewall for SMTP

## Problem
Your UFW firewall is correctly configured, but **DigitalOcean's firewall is blocking outbound SMTP traffic**.

## Evidence
- ✅ UFW shows ports 465 and 587 are ALLOW OUT
- ❌ But ports are still blocked (connection timeout)
- **Root Cause**: DigitalOcean firewall overrides UFW rules

## Solution: Configure DigitalOcean Firewall

### Step-by-Step Instructions

1. **Go to DigitalOcean Dashboard**
   - Visit: https://cloud.digitalocean.com/networking/firewalls
   - Or: https://cloud.digitalocean.com/droplets → Click your server → Networking tab

2. **Find Your Firewall**
   - Look for the firewall attached to your server
   - Click on it to edit

3. **Add OUTBOUND Rules**

   Click "Add Rule" and add these **TWO** outbound rules:

   **Rule 1: SMTP SSL (Port 465)**
   - **Type**: Custom
   - **Protocol**: TCP
   - **Port Range**: `465`
   - **Destination**: All IPv4
   - **Description**: SMTP SSL (Gmail)

   **Rule 2: SMTP TLS (Port 587)**
   - **Type**: Custom
   - **Protocol**: TCP
   - **Port Range**: `587`
   - **Destination**: All IPv4
   - **Description**: SMTP TLS (Gmail)

4. **Save Changes**
   - Click "Save" or "Apply"
   - Changes take effect immediately

### Visual Guide

```
DigitalOcean Firewall → Outbound Rules

┌─────────────────────────────────────────────┐
│ Type: Custom                                 │
│ Protocol: TCP                                │
│ Port Range: 465                              │
│ Destination: All IPv4                       │
│ Description: SMTP SSL (Gmail)               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Type: Custom                                 │
│ Protocol: TCP                                │
│ Port Range: 587                              │
│ Destination: All IPv4                       │
│ Description: SMTP TLS (Gmail)               │
└─────────────────────────────────────────────┘
```

### Verify It Works

After adding the rules, test on your server:

```bash
# Test port 465
timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/465" && echo "✅ Port 465 works" || echo "❌ Port 465 still blocked"

# Test port 587
timeout 5 bash -c "echo > /dev/tcp/smtp.gmail.com/587" && echo "✅ Port 587 works" || echo "❌ Port 587 still blocked"
```

If both show ✅, SMTP will work!

### Restart Backend

After firewall is fixed:
```bash
pm2 restart optiohire-backend --update-env
```

Check logs:
```bash
pm2 logs optiohire-backend | grep -i "smtp"
```

Should see: `✅ Email service: SMTP connection verified successfully`

## Why This Happens

DigitalOcean firewalls are **separate from UFW**:
- UFW = Server-level firewall (you control)
- DigitalOcean Firewall = Network-level firewall (in dashboard)
- **DigitalOcean firewall takes precedence**

Even if UFW allows traffic, DigitalOcean can block it.

## Alternative: If You Can't Access Dashboard

If you don't have dashboard access, contact your server administrator or:

1. **Use DigitalOcean API** (if you have API token):
   ```bash
   # Get firewall ID
   doctl compute firewall list
   
   # Add outbound rule
   doctl compute firewall add-rules <firewall-id> \
     --outbound-rules "protocol:tcp,ports:465,destination_addresses:0.0.0.0/0" \
     --outbound-rules "protocol:tcp,ports:587,destination_addresses:0.0.0.0/0"
   ```

2. **Contact Support**: DigitalOcean support can help configure firewall rules

## Quick Checklist

- [ ] Logged into DigitalOcean dashboard
- [ ] Found firewall attached to server
- [ ] Added OUTBOUND rule for port 465 (TCP)
- [ ] Added OUTBOUND rule for port 587 (TCP)
- [ ] Saved firewall changes
- [ ] Tested ports on server (both should work)
- [ ] Restarted backend
- [ ] Verified SMTP connection in logs

---

**Status**: After fixing DigitalOcean firewall, SMTP will work immediately.  
**Time**: Takes 2-3 minutes to configure.

