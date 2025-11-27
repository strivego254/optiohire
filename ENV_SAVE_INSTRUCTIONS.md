# How to Resolve .env Save Conflict

## 🔴 **The Problem**

You're getting a conflict message because:
- The `.env` file was modified on disk (maybe by a sync script or another process)
- VS Code detected the change while you were editing
- VS Code is asking you to choose: **Compare** or **Overwrite**

## ✅ **The Solution**

### **Option 1: Overwrite (Recommended - Fastest)**

1. When you see the popup: **"The content of the file is newer..."**
2. Click **"Overwrite"** button
3. Your changes will be saved
4. Done! ✅

### **Option 2: Compare First (If you want to see differences)**

1. Click **"Compare"** button
2. Review the differences
3. Keep your version (the one with GROQ_API_KEY and updated models)
4. Save

### **Option 3: Manual Save (If popup doesn't appear)**

1. Close the `.env` file in VS Code
2. Reopen it
3. Add your changes:
   ```
   GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
   REPORT_AI_MODEL=llama-3.3-70b-versatile
   SCORING_MODEL=gemini-2.0-flash
   RESUME_PARSER_MODEL=gemini-2.0-flash
   ```
4. Save (Ctrl+S)

---

## 📋 **Your Changes That Need to Be Saved**

Based on what you mentioned, make sure these are in `backend/.env`:

```bash
# Gemini API (for scoring and parsing)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
SCORING_MODEL=gemini-2.0-flash
RESUME_PARSER_MODEL=gemini-2.0-flash

# Groq API (for reports)
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
REPORT_AI_MODEL=llama-3.3-70b-versatile
```

---

## ⚠️ **Important Note About Groq**

**The codebase currently only supports Gemini**, not Groq. To use Groq for reports, we need to:

1. Install Groq SDK: `npm install groq-sdk`
2. Update `reportGenerator.ts` to support Groq models
3. Add logic to detect Groq models and use Groq API

**For now:**
- ✅ Gemini will work for scoring and parsing
- ⚠️ Groq won't work yet (needs code changes)
- ✅ Your API keys will be saved and ready when we add Groq support

---

## 🔍 **Verify Your Changes Were Saved**

After saving, run this to verify:

```bash
cd backend
grep -E "(GROQ_API_KEY|REPORT_AI_MODEL|SCORING_MODEL)" .env
```

You should see:
- `GROQ_API_KEY=...`
- `REPORT_AI_MODEL=llama-3.3-70b-versatile`
- `SCORING_MODEL=gemini-2.0-flash`
- `RESUME_PARSER_MODEL=gemini-2.0-flash`

---

## 🚀 **Next Steps After Saving**

1. **Restart your backend** to load new environment variables:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test Gemini scoring** (should work with new API key)

3. **Add Groq support** (if you want to use Groq for reports)

---

## 💡 **Prevent Future Conflicts**

The conflict might be caused by:
- Sync script (`scripts/sync-env-values.sh`) modifying the file
- Another process accessing the file
- File system sync issues

**To prevent:**
- Close other editors/processes that might access `.env`
- Don't run sync scripts while editing `.env`
- Save frequently

