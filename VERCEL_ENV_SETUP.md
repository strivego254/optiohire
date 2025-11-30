# Vercel Environment Variables Setup Guide

## Issue
The "Database connection failed" error occurs because the frontend Next.js API routes need database access, but environment variables are not configured in Vercel.

## Required Environment Variables for Vercel

You need to add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
1. Navigate to your project: `hirebit-two`
2. Go to **Settings** → **Environment Variables**

### 2. Add the Following Variables

#### Database Configuration (REQUIRED)
```
DATABASE_URL=postgresql://postgres.qijibjotmwbikzwtkcut:HireBit%40254%23.%24@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
DB_SSL=true
```

#### JWT Secret (REQUIRED)
```
JWT_SECRET=38970ddabcd7f6a37d4176d9c3f2e06571a48ccf173a13d8a070e5e207ac2e96b8e5d569e95fb29a4bfe9527b689387525eda70219e38411a8e069e27eef6942
```

#### Backend URL (Optional - if using separate backend)
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### 3. Environment Variable Settings

For each variable:
- **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you only deploy to production)
- Click **Save**

### 4. Redeploy

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Important Notes

1. **DATABASE_URL**: This is the Supabase connection string. Make sure it's exactly as shown above with the URL-encoded password.

2. **DB_SSL**: Set to `true` for Supabase connections.

3. **JWT_SECRET**: Must match the backend JWT_SECRET if you're using a separate backend.

4. **Security**: Never commit `.env.local` files to git. Vercel environment variables are secure and encrypted.

## Verification

After redeploying, test the signup page again. The database connection should work.

## Troubleshooting

If you still get errors:

1. **Check Vercel Logs**:
   - Go to **Deployments** → Click on deployment → **Functions** tab
   - Check the logs for specific error messages

2. **Verify DATABASE_URL**:
   - Make sure the connection string is correct
   - Check that the password is URL-encoded (special characters like `@`, `#`, `$` should be encoded)

3. **Test Database Connection**:
   - Try connecting to the database from your local machine using the same connection string
   - If it works locally but not on Vercel, it's likely an environment variable issue

4. **Check Database Access**:
   - Ensure your Supabase database allows connections from Vercel's IP addresses
   - Supabase should allow all connections by default, but check your firewall settings

## Quick Setup Script

You can also set these via Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.qijibjotmwbikzwtkcut:HireBit%40254%23.%24@aws-1-eu-west-3.pooler.supabase.com:5432/postgres

vercel env add DB_SSL production
# Paste: true

vercel env add JWT_SECRET production
# Paste: 38970ddabcd7f6a37d4176d9c3f2e06571a48ccf173a13d8a070e5e207ac2e96b8e5d569e95fb29a4bfe9527b689387525eda70219e38411a8e069e27eef6942

# Redeploy
vercel --prod
```

