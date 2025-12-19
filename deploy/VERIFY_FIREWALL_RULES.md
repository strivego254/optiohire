# ✅ Verifying Firewall Rules Configuration

## Your Current Rules (from image):

1. **DNS TCP** - TCP - 53 - All IPv4
2. **Custom** - TCP - 465 - All IPv4
3. **Custom** - TCP - 587 - All IPv4
4. **DNS UDP** - UDP - 53 - All IPv4

## ✅ Rules Look Correct!

Your rules are configured correctly:
- ✅ Type: Custom (correct for SMTP)
- ✅ Protocol: TCP (correct for SMTP)
- ✅ Port Range: 465 and 587 (correct ports)
- ✅ Destinations: All IPv4 (correct for outbound)

## ⚠️ Critical Check: Are These OUTBOUND Rules?

**MOST IMPORTANT**: Make sure these rules are in the **OUTBOUND Rules** section, NOT the **INBOUND Rules** section!

### How to Verify:

1. Look at the page title/heading
   - Should say: **"Outbound Rules"**
   - NOT: "Inbound Rules"

2. Check the description text
   - Should say: "Set the Firewall rules for **outbound** traffic..."
   - NOT: "Set the Firewall rules for **inbound** traffic..."

3. If you're in the wrong section:
   - Scroll down or look for tabs/sections
   - Switch to "Outbound Rules" section
   - Add the rules there

## Why This Matters:

- **INBOUND rules** = Traffic coming INTO your server (not needed for SMTP)
- **OUTBOUND rules** = Traffic going OUT from your server (needed for SMTP)

SMTP sends emails OUT, so you need OUTBOUND rules!

## Complete Checklist:

- [ ] Rules are in **OUTBOUND Rules** section (not Inbound)
- [ ] Port 465 rule: Custom - TCP - 465 - All IPv4
- [ ] Port 587 rule: Custom - TCP - 587 - All IPv4
- [ ] DNS TCP rule: DNS TCP - TCP - 53 - All IPv4
- [ ] DNS UDP rule: DNS UDP - UDP - 53 - All IPv4
- [ ] Firewall is **saved**
- [ ] Firewall is **applied to your droplet**

## If Rules Are in Wrong Section:

If your SMTP rules (465, 587) are in the **INBOUND** section:

1. **Delete them from Inbound section**
2. **Go to Outbound Rules section**
3. **Add them again in Outbound section**
4. **Save the firewall**

---

**Your rules configuration is correct - just make sure they're in the OUTBOUND section!** ✅

