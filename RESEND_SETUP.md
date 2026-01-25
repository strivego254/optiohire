# Resend Email Setup Guide

## Overview
Resend is now integrated as the primary email service for OptioHire. It provides reliable email delivery with domain verification support.

## Setup Steps

### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

### 2. Get API Key
1. Navigate to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "OptioHire Production")
4. Copy the API key (starts with `re_`)

### 3. Add Domain
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `optiohire.com`)
4. Click "Add Domain"

### 4. Verify Domain
Resend will provide DNS records to add to your domain:

#### Option A: Using DNS Provider (Recommended)
1. Go to your domain's DNS settings (e.g., Cloudflare, Namecheap, GoDaddy)
2. Add the following DNS records provided by Resend:

**SPF Record:**
```
Type: TXT
Name: @ (or your domain)
Value: v=spf1 include:resend.com ~all
```

**DKIM Records:**
```
Type: TXT
Name: resend._domainkey (or similar)
Value: [provided by Resend]
```

**DMARC Record (Optional but recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

3. Wait for DNS propagation (usually 5-60 minutes)
4. Return to Resend dashboard and click "Verify Domain"

#### Option B: Using Resend's Domain Verification
1. Resend will check your DNS records automatically
2. Once verified, the domain status will show as "Verified"

### 5. Configure Environment Variables
Update `backend/.env`:

```env
USE_RESEND=true
RESEND_API_KEY=re_your_api_key_here
RESEND_DOMAIN=yourdomain.com
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=OptioHire
```

### 6. Test Email Sending
1. Restart the backend server
2. Check logs for: `Email service: Using Resend API`
3. Test password reset or any email functionality
4. Check Resend dashboard for email logs: https://resend.com/emails

## API Endpoints

### Verify Resend Connection
```bash
GET /api/resend/verify
Authorization: Bearer <token>
```

Response:
```json
{
  "connected": true,
  "domains": [
    {
      "name": "yourdomain.com",
      "status": "verified",
      "region": "us-east-1",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### List All Domains
```bash
GET /api/resend/domains
Authorization: Bearer <token>
```

### Get Domain Status
```bash
GET /api/resend/domains/:domain
Authorization: Bearer <token>
```

## Email Priority
The system uses the following priority:
1. **Resend** (if `USE_RESEND=true` and `RESEND_API_KEY` is set)
2. **SendGrid** (if `USE_SENDGRID=true` and `SENDGRID_API_KEY` is set)
3. **SMTP** (fallback)

## Troubleshooting

### Domain Not Verifying
- Check DNS records are correctly added
- Wait for DNS propagation (can take up to 48 hours)
- Verify TXT records are not duplicated
- Check domain status in Resend dashboard

### Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend dashboard
- Review Resend email logs: https://resend.com/emails
- Check backend logs for error messages

### API Key Issues
- Ensure API key starts with `re_`
- Verify API key has "Send Email" permissions
- Check API key is not expired or revoked

## Resend Dashboard
- **Emails**: https://resend.com/emails (view sent emails)
- **Domains**: https://resend.com/domains (manage domains)
- **API Keys**: https://resend.com/api-keys (manage API keys)
- **Logs**: https://resend.com/logs (view detailed logs)

## Free Tier Limits
- 3,000 emails/month
- 100 emails/day
- Unlimited domains (with verification)

## Production Recommendations
1. Use a verified domain (not the default `onboarding.resend.dev`)
2. Set up DMARC policy
3. Monitor email logs regularly
4. Set up webhooks for email events (optional)
5. Use separate API keys for development and production

