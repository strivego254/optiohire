# 🔧 Fix IMAP Password Issue

## ❌ Problem Found

The `IMAP_PASS` in `backend/.env` is still set to the **placeholder value**:
```
IMAP_PASS=your_app_specific_password
```

This is why authentication is failing!

## ✅ Solution

You need to **replace** `your_app_specific_password` with your **actual Gmail App Password**.

### Step 1: Get Your Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Make sure **2-Step Verification** is enabled
3. Scroll to **App passwords**
4. Click **App passwords**
5. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "HireBit"
6. Click **Generate**
7. Copy the **16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update backend/.env

**IMPORTANT**: Update the file `backend/.env` (NOT `.env.supabase.template`)

Open `backend/.env` and find this line:
```bash
IMAP_PASS=your_app_specific_password
```

Replace it with your actual App Password (remove spaces):
```bash
IMAP_PASS=abcdefghijklmnop
```

**Example** (if your App Password is `abcd efgh ijkl mnop`):
```bash
IMAP_PASS=abcdefghijklmnop
```

### Step 3: Also Update SMTP_PASS

For sending emails, also update:
```bash
SMTP_PASS=abcdefghijklmnop
```

Use the **same App Password** for both.

### Step 4: Restart Backend

After updating, **restart the backend**:

1. Stop the current backend (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

## ✅ Expected Result

After fixing, you should see:

```
[INFO] Backend listening on http://localhost:3001
[INFO] IMAP email reader connected to imap.gmail.com:993
[INFO] Report scheduler started - checking every 10 minutes for past-deadline jobs
```

**No authentication errors!** ✅

## 🔍 Verify It's Fixed

After restarting, check the terminal output. You should see:
- ✅ "IMAP email reader connected" (no errors)
- ✅ No "[AUTHENTICATIONFAILED]" messages

## 📝 Quick Checklist

- [ ] Got Gmail App Password (16 characters)
- [ ] Updated `IMAP_PASS` in `backend/.env` (removed spaces)
- [ ] Updated `SMTP_PASS` in `backend/.env` (same password)
- [ ] Restarted backend server
- [ ] Verified "IMAP email reader connected" message appears
- [ ] No authentication errors in logs

---

**The key issue**: The password is still the placeholder. Replace it with your actual Gmail App Password! 🔑

