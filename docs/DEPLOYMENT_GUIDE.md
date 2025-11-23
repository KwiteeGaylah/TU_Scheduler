# TU Scheduler - Deployment Guide

**Version:** 1.0.0  
**Platform:** Windows 10/11 (64-bit)  
**Date:** November 23, 2025  
**Package Type:** Packaged Application Folder

---

## 📦 Distribution Files

### Available Packages

| File | Size | Description |
|------|------|-------------|
| **TU Scheduler-win32-x64/** | ~230 MB | **Recommended** - Complete packaged application folder (copy and run) |

---

## 🚀 Installation Instructions

### For End Users (Recommended Method)

1. **Copy** the `TU Scheduler-win32-x64` folder to your desired location:
   - Recommended: `C:\Program Files\TU Scheduler\`
   - Alternative: Desktop, Documents, or any folder

2. **Run** `TU Scheduler.exe` from the copied folder

3. **First Launch:**
   - Login with default credentials:
     - Username: `admin`
     - Password: `admin123`
   - **IMPORTANT:** Change password immediately after first login
   - Generate and save recovery key

4. **Optional - Create Desktop Shortcut:**
   - Right-click `TU Scheduler.exe`
   - Select "Create shortcut"
   - Move shortcut to Desktop

### For IT Administrators (Network Deployment)

#### Option 1: Copy Application Folder
```powershell
# Copy application folder to Program Files
Copy-Item "TU Scheduler-win32-x64" -Destination "C:\Program Files\TU Scheduler" -Recurse

# Create shortcut on all users' desktops
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\Public\Desktop\TU Scheduler.lnk")
$Shortcut.TargetPath = "C:\Program Files\TU Scheduler\TU Scheduler.exe"
$Shortcut.WorkingDirectory = "C:\Program Files\TU Scheduler"
$Shortcut.Description = "TU Scheduler - Class Scheduling System"
$Shortcut.Save()
```

#### Option 2: Network Share Deployment
```powershell
# Copy to network share
Copy-Item "TU Scheduler-win32-x64" -Destination "\\server\software\TU Scheduler" -Recurse

# Users copy to their local machines
# Or run directly from network (slower performance)
```

---

## 📋 System Requirements

### Minimum Requirements
- **OS:** Windows 10 (64-bit) or Windows 11
- **Processor:** Intel Core i3 or equivalent
- **RAM:** 2 GB
- **Disk Space:** 300 MB free space
- **Display:** 1366x768 resolution

### Recommended Requirements
- **OS:** Windows 11 (64-bit)
- **Processor:** Intel Core i5 or better
- **RAM:** 4 GB or more
- **Disk Space:** 500 MB free space
- **Display:** 1920x1080 or higher resolution

---

## 📂 Application Data Storage

### Database Location
The application stores its database at:
```
%APPDATA%\tu-scheduler\scheduler.db
```
Actual path:
```
C:\Users\<YourUsername>\AppData\Roaming\tu-scheduler\scheduler.db
```

### Recovery Key Location
Password recovery key hash stored at:
```
%APPDATA%\tu-scheduler\.recovery_key
```

### Backup Recommendations
- **Regular Backups:** Copy `scheduler.db` weekly
- **Before Updates:** Always backup before upgrading
- **Recovery Key:** Store recovery key file in secure location (USB, cloud storage)

---

## 🔧 Configuration

### First-Time Setup

1. **Launch Application**
   - Double-click `TU Scheduler.exe`
   - Wait for application to initialize (5-10 seconds)

2. **Initial Login**
   - Username: `admin`
   - Password: `admin123`

3. **Security Setup (CRITICAL)**
   - Navigate to **Profile** → **Change Password**
   - Enter new secure password (minimum 6 characters)
   - Navigate to **Password Recovery** (🔐 icon in sidebar)
   - Click **"Generate New Recovery Key"**
   - Click **"💾 Download Key as File"**
   - Save file to USB drive or secure location
   - **IMPORTANT:** Without recovery key, you cannot reset forgotten password!

4. **Application Setup**
   - Add courses (Courses page)
   - Add instructors (Instructors page)
   - Add rooms (Rooms page)
   - Create sections (Sections page)
   - Build schedules (Schedule Management page)

---

## 📤 Updating the Application

### Update Process

1. **Backup Current Data**
   ```powershell
   # Backup database
   Copy-Item "$env:APPDATA\tu-scheduler\scheduler.db" -Destination "C:\Backup\scheduler-backup-$(Get-Date -Format 'yyyyMMdd').db"
   ```

2. **Close Running Application**
   - Exit TU Scheduler completely
   - Check Task Manager if needed

3. **Replace Application Files**
   - Delete old application folder
   - Copy new `TU Scheduler-win32-x64` folder to same location
   - Your data in `%APPDATA%` remains intact

4. **Launch New Version**
   - Run `TU Scheduler.exe`
   - Verify data integrity
   - Check all features work correctly

---

## 🗑️ Uninstallation

### Complete Removal

1. **Delete Application Folder**
   ```powershell
   Remove-Item "C:\Program Files\TU Scheduler" -Recurse -Force
   ```

2. **Optional - Remove User Data (WARNING: Deletes all data)**
   ```powershell
   Remove-Item "$env:APPDATA\tu-scheduler" -Recurse -Force
   ```

3. **Remove Desktop Shortcuts**
   ```powershell
   Remove-Item "$env:USERPROFILE\Desktop\TU Scheduler.lnk" -ErrorAction SilentlyContinue
   Remove-Item "C:\Users\Public\Desktop\TU Scheduler.lnk" -ErrorAction SilentlyContinue
   ```

---

## 🐛 Troubleshooting

### Application Won't Start

**Problem:** Double-clicking exe does nothing or shows error  
**Solutions:**
1. Check Windows Event Viewer for error details
2. Verify Windows 10/11 (64-bit) is installed
3. Try running as Administrator (right-click → "Run as administrator")
4. Check antivirus hasn't quarantined files
5. Re-copy application folder (might be corrupted)

### Missing VCRUNTIME or DLL Errors

**Problem:** Error about missing VCRUNTIME140.dll or similar  
**Solution:**
1. Install Microsoft Visual C++ Redistributable
2. Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe
3. Run installer
4. Restart computer
5. Launch TU Scheduler again

### Database Locked Error

**Problem:** "Database is locked" message  
**Solutions:**
1. Close all instances of TU Scheduler
2. Check Task Manager for running processes
3. Restart computer
4. If persists, restore from backup

### Performance Issues

**Problem:** Application runs slowly  
**Solutions:**
1. Close other applications (especially browsers)
2. Check available RAM (Task Manager)
3. Move application to faster drive (SSD vs HDD)
4. Compact database (Backup page → Create Backup → Restore)

### Forgotten Password (No Recovery Key)

**Problem:** Password forgotten and no recovery key  
**Solution:**
⚠️ **Data Loss Warning:** This will delete all data!
```powershell
# Delete all application data (including database)
Remove-Item "$env:APPDATA\tu-scheduler" -Recurse -Force

# Restart application - creates new default admin account
```

---

## 📞 Support

### Technical Support

**For Issues:**
1. Check this guide first
2. Review documentation in `docs/` folder
3. Contact local IT Department or System Administrator

**Contact Information:**
- **Developer:** Kwitee D. Gaylah
- **Location:** Harper, Maryland County, Liberia

### Reporting Bugs

When reporting issues, provide:
1. Windows version (Win 10/11)
2. Application version (1.0.0)
3. Steps to reproduce the issue
4. Screenshots if applicable
5. Error messages (exact text)

---

## 📊 Performance Tips

### Optimal Performance

1. **Database Maintenance**
   - Create backup monthly (compacts database)
   - Don't store extremely large schedules (>10,000 records)

2. **System Resources**
   - Close unnecessary applications
   - Ensure 500MB free disk space
   - Use SSD if available

3. **Network Deployment**
   - Run locally (copy to C:\) instead of network share
   - Network shares cause slower performance

---

## 🔐 Security Best Practices

### Administrator Responsibilities

1. **Password Policy**
   - Change default password immediately
   - Use strong passwords (12+ characters)
   - Don't share admin credentials

2. **Recovery Key**
   - Generate recovery key after password change
   - Store in multiple secure locations:
     - USB drive (kept in safe)
     - Password manager
     - Printed copy (secure cabinet)
   - Test recovery process quarterly

3. **Data Backup**
   - Weekly database backups
   - Store backups off-site
   - Test restore process monthly

4. **Access Control**
   - Use role-based access (Admin, Registrar, Viewer)
   - Don't create unnecessary admin accounts
   - Review user access regularly

---

## 📝 License

**MIT License**

Copyright (c) 2025 Kwitee D. Gaylah

This project is licensed under the MIT License - see the [LICENSE.txt](../LICENSE.txt) file for details.

The MIT License allows you to:
- ✅ Use the software for any purpose
- ✅ Modify and distribute the software
- ✅ Use commercially
- ✅ Distribute modified versions

---

## ✅ Post-Deployment Checklist

### IT Administrator Tasks

- [ ] Extract application to `C:\Program Files\TU Scheduler\`
- [ ] Create desktop shortcut for users
- [ ] Document installation location in IT records
- [ ] Test application launches successfully
- [ ] Login with default credentials works
- [ ] Change default admin password
- [ ] Generate and secure recovery key
- [ ] Create initial database backup
- [ ] Configure backup schedule
- [ ] Train end users on basic operations
- [ ] Provide users with quick reference guide
- [ ] Document support contact information
- [ ] Schedule first backup verification (1 week)
- [ ] Schedule user feedback collection (2 weeks)

### End User Tasks

- [ ] Launch TU Scheduler successfully
- [ ] Login with provided credentials
- [ ] Change password immediately
- [ ] Generate recovery key
- [ ] Download and save recovery key file
- [ ] Store recovery key securely (USB/printed)
- [ ] Add sample course (test)
- [ ] Add sample instructor (test)
- [ ] Add sample room (test)
- [ ] Create sample section (test)
- [ ] Build sample schedule (test)
- [ ] Export schedule to Excel (test)
- [ ] Create database backup (test)
- [ ] Bookmark documentation folder
- [ ] Report any issues to IT

---

## 📖 Additional Documentation

For detailed usage instructions, see:

- **[README.md](../README.md)** - Complete application guide
- **[PASSWORD_RECOVERY_GUIDE.md](./PASSWORD_RECOVERY_GUIDE.md)** - Password recovery procedures
- **[IMPORT_EXPORT_GUIDE.md](./IMPORT_EXPORT_GUIDE.md)** - CSV import and export instructions
- **[MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md)** - Testing and QA procedures

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2025  
**Prepared by:** GitHub Copilot  
**Developer:** Kwitee D. Gaylah
