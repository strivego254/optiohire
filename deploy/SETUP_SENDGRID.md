# 🚀 Setup SendGrid - No Firewall Issues!

## Why SendGrid?

- ✅ **Uses HTTPS (port 443)** - Always open, no firewall configuration needed!
- ✅ **Better deliverability** - Professional email service
- ✅ **No SMTP port issues** - Uses API, not SMTP
- ✅ **Free tier available** - 100 emails/day free

## Quick Setup (5 minutes)

### Step 1: Sign Up for SendGrid

1. Go to: https://signup.sendgrid.com/
2. Create a free account
3. Verify your email address

### Step 2: Get API Key

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name it: "OptioHire Production"
4. Select "Full Access" (or "Mail Send" permissions)
5. Click "Create & View"
6. **Copy the API key** (you'll only see it once!)

### Step 3: Verify Sender Identity

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Fill in your details:
   - Email: Your company email (e.g., `info@yourcompany.com`)
   - Company name, address, etc.
4. Verify the email they send you

### Step 4: Update Backend .env

On your server, edit `backend/.env`:

```bash
cd ~/optiohire/backend
nano .env
```

Add these lines:

```env
# SendGrid Configuration (Recommended - no firewall issues!)
USE_SENDGRID=true
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=info@yourcompany.com
SENDGRID_FROM_NAME=OptioHire
```

**Important**: Replace:
- `SG.your_api_key_here` with your actual SendGrid API key
- `info@yourcompany.com` with your verified sender email

### Step 5: Restart Backend

```bash
pm2 restart optiohire-backend --update-env
```

### Step 6: Verify It Works

```bash
pm2 logs optiohire-backend | grep -i "sendgrid\|email"
```

Should see: `✅ SendGrid API key verified successfully`

## Testing

Send a test email by processing an application. The email should be sent via SendGrid automatically!

## Benefits Over SMTP

| Feature | SMTP (Gmail) | SendGrid |
|---------|--------------|----------|
| Firewall | ❌ Needs ports 465/587 | ✅ Uses HTTPS (443) |
| Setup | Complex | Simple |
| Deliverability | Good | Excellent |
| Analytics | None | Built-in |
| Free Tier | Limited | 100/day |

## Troubleshooting

### "API key not configured"
- Make sure `SENDGRID_API_KEY` is set in `backend/.env`
- Make sure `USE_SENDGRID=true` is set

### "Unauthorized" error
- Check API key is correct
- Make sure API key has "Mail Send" permissions

### "Sender not verified"
- Verify your sender email in SendGrid dashboard
- Check the verification email

## Fallback to SMTP

If SendGrid is not configured, the system will automatically fall back to SMTP (if configured).

To disable SendGrid and use SMTP:
```env
USE_SENDGRID=false
# Or remove SENDGRID_API_KEY
```

---

**After setup, emails will work immediately - no firewall configuration needed!** 🎉

