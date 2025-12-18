# Fix SMTP Firewall Issue

## Problem
Both SMTP ports (587 and 465) are blocked by the DigitalOcean firewall, preventing emails from being sent.

## Solution: Configure DigitalOcean Firewall

### Option 1: DigitalOcean Dashboard (Recommended)

1. **Log into DigitalOcean Dashboard**
   - Go to https://cloud.digitalocean.com
   - Navigate to your droplet

2. **Open Firewall Settings**
   - Click on "Networking" tab
   - Find "Firewalls" section
   - Click on your firewall (or create one if none exists)

3. **Add Outbound Rules**
   - Click "Add Rule"
   - **Rule 1:**
     - Type: Outbound
     - Protocol: TCP
     - Port Range: 587
     - Destination: All IPv4, All IPv6
   - **Rule 2:**
     - Type: Outbound
     - Protocol: TCP
     - Port Range: 465
     - Destination: All IPv4, All IPv6
   - Click "Add Rule" for each
   - Click "Save Changes"

4. **Apply Firewall to Droplet**
   - Make sure the firewall is applied to your droplet
   - Go to your droplet → Networking → Firewalls
   - Select your firewall

### Option 2: Using DigitalOcean CLI (doctl)

If you have `doctl` installed:

```bash
# List firewalls
doctl compute firewall list

# Add outbound rule for port 587
doctl compute firewall add-rules <firewall-id> \
  --outbound-rules "protocol:tcp,ports:587,destination_addresses:0.0.0.0/0,::/0"

# Add outbound rule for port 465
doctl compute firewall add-rules <firewall-id> \
  --outbound-rules "protocol:tcp,ports:465,destination_addresses:0.0.0.0/0,::/0"
```

### Option 3: Disable UFW (if using local firewall)

If you're using UFW locally and it's blocking:

```bash
# Check UFW status
sudo ufw status

# Allow outbound SMTP
sudo ufw allow out 587/tcp
sudo ufw allow out 465/tcp

# Or disable UFW if not needed (not recommended for production)
# sudo ufw disable
```

## Verify Fix

After configuring the firewall, test again:

```bash
cd ~/optiohire
./deploy/test-smtp-connection.sh
```

You should see:
- ✅ Port 587 is accessible
- ✅ Port 465 is accessible

## Alternative: Use Different Email Service

If you can't modify the firewall, consider:

1. **SendGrid** - Port 587 usually works
2. **Mailgun** - Port 587 usually works
3. **AWS SES** - Port 587 usually works
4. **SMTP Relay** - Use a relay service

## After Fixing Firewall

1. Update `.env` to use port 465:
   ```bash
   cd ~/optiohire/backend
   echo "SMTP_PORT=465" >> .env
   ```

2. Rebuild and restart:
   ```bash
   npm run build
   pm2 restart optiohire-backend --update-env
   ```

3. Test email sending:
   ```bash
   npx tsx scripts/resend-email-notifications.ts
   ```

