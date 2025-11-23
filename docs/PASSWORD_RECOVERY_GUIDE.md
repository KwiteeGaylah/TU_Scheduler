# Password Recovery System - User Guide

## Overview

The TU Scheduler now includes a **Password Recovery System** designed for single-user deployment. Since the system uses a SQLite database (single file with no external interface), this recovery mechanism ensures you can regain access if you forget your password.

---

## How It Works

### 1. **Recovery Key Generation**
   - Navigate to **Password Recovery** in the sidebar (🔐 icon)
   - Click **"Generate New Recovery Key"**
   - A unique, cryptographically secure 32-character key is created
   - This key is hashed and stored securely in your user data folder
   - **CRITICAL**: You only see this key ONCE - save it immediately!

### 2. **Saving Your Recovery Key**
   When the recovery key is generated, you have several options:
   
   - **Download as Text File** (Recommended):
     - Click "💾 Download Key as File"
     - Save `TU_Scheduler_Recovery_Key.txt` to a USB drive or secure location
   
   - **Write It Down**:
     - Copy the 32-character code
     - Write it on paper and store in a safe place
   
   - **Password Manager**:
     - Save the key in your password manager app
   
   - **Print It**:
     - Print the downloaded file and store physically

### 3. **Password Reset Process**
   If you forget your password:
   
   1. From the login page, click **"Forgot Password?"** (if available)
   2. Or navigate to **Password Recovery** page
   3. Enter your **Recovery Key** (32-character code)
   4. Enter your **New Password** (minimum 6 characters)
   5. Confirm the new password
   6. Click **"Reset Password"**
   7. Log in with your new password

---

## Important Security Notes

### ⚠️ Critical Guidelines

1. **Generate Your Recovery Key Immediately**
   - Do this right after installation
   - Store it securely before you forget your password

2. **Store Recovery Key Safely**
   - Keep it separate from your computer
   - Don't store it in an unencrypted file on the same machine
   - Treat it like a physical key to your house

3. **One-Time Display**
   - The recovery key is only shown ONCE when generated
   - Cannot be recovered or viewed again
   - Generate a new one if you lose it (invalidates the old one)

4. **Multiple Recovery Keys**
   - Generating a new key invalidates the previous one
   - Only the most recent key will work
   - Update your stored backup whenever you generate a new key

5. **Physical Security**
   - Consider storing a printed copy in a locked drawer or safe
   - USB drives with recovery files should be kept secure
   - Don't email the recovery key to yourself (insecure)

---

## Step-by-Step: First Time Setup

### Immediately After Installation:

1. **Log In First Time**
   - Username: `admin`
   - Password: `admin123`

2. **Change Your Password**
   - Go to **Profile** → **Change Password** tab
   - Set a strong, memorable password

3. **Generate Recovery Key**
   - Go to **Password Recovery** in sidebar
   - Click **"Generate New Recovery Key"**
   - Download the recovery key file
   - Store in a safe location (USB drive, printed copy, etc.)

4. **Verify Recovery Key Works** (Optional but Recommended)
   - Test the recovery process
   - Use the recovery key to reset to a new password
   - Verify you can log in with the new password
   - Generate another recovery key and store it

---

## Technical Details

### Storage Location
- Recovery key hash stored at: `%APPDATA%/tu-scheduler/.recovery_key`
- This is a hidden file in your user data directory
- The actual key is never stored - only a secure hash

### Security Features
- Recovery keys are 32 characters (128 bits of entropy)
- Keys are hashed using bcrypt (same as passwords)
- Each key generation creates a cryptographically random key
- Old keys are automatically invalidated when a new one is generated

### Recovery Key Format
```
Example: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
```
- 32 uppercase hexadecimal characters
- Easy to type but extremely secure
- Case-sensitive

---

## Frequently Asked Questions

### Q: I lost my recovery key and forgot my password. What now?
**A:** Unfortunately, without the recovery key, password reset is not possible. You'll need to:
- Restore from a backup (if available)
- Or reinstall the application (loses all data)

This is why generating and storing the recovery key immediately is critical.

### Q: Can I view my current recovery key?
**A:** No. For security reasons, recovery keys are only displayed once during generation. The system stores only a hash, not the actual key.

### Q: How often should I generate a new recovery key?
**A:** 
- Generate one immediately after installation
- Generate a new one if you suspect the old one was compromised
- Update it if you change your storage location
- Generally, once generated and safely stored, you don't need to change it

### Q: Can someone use my recovery key to hack my account?
**A:** Yes - the recovery key provides full password reset capability. This is why it must be stored as securely as your password. Treat it like a physical key to your office.

### Q: What if I generate a new recovery key but still have the old one?
**A:** Old recovery keys are automatically invalidated when a new one is generated. Only the most recent recovery key will work.

### Q: Can I have multiple recovery keys active at once?
**A:** No. Only one recovery key can be active at a time. Generating a new key automatically invalidates any previous keys.

---

## Troubleshooting

### "No recovery key found" Error
**Cause:** You haven't generated a recovery key yet.
**Solution:** Go to Password Recovery and generate one.

### "Invalid recovery key" Error
**Causes:**
- Typo in the recovery key (check carefully)
- Old recovery key (a new one was generated)
- Wrong recovery key for this installation

**Solution:** 
- Verify you're using the correct, most recent recovery key
- Check for typos (keys are case-sensitive)
- If lost, you'll need to restore from backup

### Recovery Key File Not Found
**Solution:**
- Check your Downloads folder
- Check the location where you saved it
- If truly lost, generate a new recovery key while you still have access

---

## Best Practices

### ✅ DO:
- Generate a recovery key immediately after installation
- Store recovery key in multiple secure locations
- Test the recovery process once to ensure it works
- Keep recovery key separate from your computer
- Update stored recovery key if you generate a new one

### ❌ DON'T:
- Store recovery key in plain text on the same computer
- Email recovery key to yourself
- Share recovery key with anyone
- Store recovery key in an unencrypted cloud service
- Delay generating a recovery key

---

## Emergency Recovery Procedure

If you've lost both your password AND recovery key:

1. **Check for Backups**
   - Look in `%APPDATA%/tu-scheduler/backups/`
   - Restore the most recent backup
   - Your old password should work

2. **Check for Recovery Key Backups**
   - USB drives
   - Printed copies
   - Password manager
   - Secure notes

3. **Last Resort - Reinstall**
   - Backup your database file first: `%APPDATA%/tu-scheduler/scheduler.db`
   - Reinstall the application
   - This creates a new admin account with default credentials
   - **WARNING**: You may lose schedule data unless you can restore the database

---

## Support

For additional help or questions about the password recovery system:
- Review this guide carefully
- Check the main README.md for general application help
- Contact the Computer Science Department IT support

---

**Remember**: The password recovery system is only as secure as your recovery key storage. Treat your recovery key with the same care as your most important passwords!
