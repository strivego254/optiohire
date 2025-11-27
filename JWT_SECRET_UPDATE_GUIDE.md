# JWT Secret Update Guide

## ✅ What Was Done

1. **Generated a new secure JWT secret** using cryptographically secure random bytes (512-bit)
2. **Updated `backend/.env`** with the new JWT_SECRET
3. **Updated `frontend/.env.local`** with the new JWT_SECRET
4. **Removed the old JWT_SECRET** from both files

## 🔐 New JWT Secret

The new JWT secret has been generated and added to both environment files:
```
38970ddabcd7f6a37d4176d9c3f2e06571a48ccf173a13d8a070e5e207ac2e96b8e5d569e95fb29a4bfe9527b689387525eda70219e38411a8e069e27eef6942
```

## 📋 Next Steps (REQUIRED)

### 1. Restart Backend Server
```bash
cd backend
# Stop the current server (Ctrl+C)
npm run dev  # or your start command
```

### 2. Restart Frontend Server
```bash
cd frontend
# Stop the current server (Ctrl+C)
npm run dev  # or your start command
```

### 3. All Users Must Sign In Again
⚠️ **Important**: Since the JWT secret changed, all existing tokens are now invalid. All users (including you) must:
- Sign out from the application
- Sign in again to get a new token with the new secret

## 🔄 How to Generate a New JWT Secret (Future)

If you need to generate a new JWT secret in the future:

```bash
node scripts/generate-jwt-secret.js
```

This will:
- Generate a cryptographically secure random 512-bit secret
- Display it for you to copy
- Provide instructions on where to add it

## 📝 About Supabase JWT Secrets

**Note**: Supabase has its own JWT secrets in their dashboard (Settings → API → JWT Secret), but those are for Supabase's authentication system. Since this application uses **custom JWT authentication** (not Supabase Auth), we generate our own JWT secret.

If you were using Supabase Auth, you would use Supabase's JWT secret, but for this custom authentication system, we use our own generated secret.

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files to git** - They should be in `.gitignore`
2. ✅ **Use different secrets for development and production**
3. ✅ **Rotate secrets periodically** (every 90 days recommended)
4. ✅ **Keep secrets secure** - Don't share them in chat, email, or documentation
5. ✅ **Use environment variables** - Never hardcode secrets in code

## 🛠️ Troubleshooting

### "Invalid token" errors after update
- Make sure both frontend and backend have the same JWT_SECRET
- Restart both servers after updating the secret
- Clear browser localStorage and sign in again

### Users can't sign in
- Verify JWT_SECRET matches in both `.env` files
- Check that servers were restarted after the update
- Ensure the secret doesn't have extra spaces or quotes

## 📚 Related Files

- `backend/.env` - Backend JWT_SECRET
- `frontend/.env.local` - Frontend JWT_SECRET
- `scripts/generate-jwt-secret.js` - Secret generation script
- `backend/src/middleware/auth.ts` - Where JWT_SECRET is used
- `frontend/src/app/api/auth/signin/route.ts` - Where tokens are created
