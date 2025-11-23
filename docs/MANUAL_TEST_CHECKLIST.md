# Manual Testing Checklist - TU Scheduler

Use this checklist to verify all functionality before deployment.

---

## 🔐 Authentication & Security

### Login
- [ ] Can log in with correct credentials
- [ ] Cannot log in with wrong password
- [ ] Cannot log in with non-existent username
- [ ] Error message displays for failed login
- [ ] App redirects to dashboard after successful login

### Password Recovery
- [ ] "Forgot Password" link visible on login page
- [ ] Recovery modal opens when clicking the link
- [ ] Can generate new recovery key when logged in
- [ ] Recovery key is 32 characters (format: ABCD1234...)
- [ ] Downloaded recovery file contains username and key
- [ ] Can reset password using valid recovery key
- [ ] Cannot reset password with invalid recovery key
- [ ] Success message shown after password reset
- [ ] Can log in with new password after reset

### Profile & Security
- [ ] Can view current username and role in Profile
- [ ] Can update username successfully
- [ ] Cannot update to existing username (validation works)
- [ ] Can change password with correct old password
- [ ] Cannot change password with wrong old password
- [ ] New password must be at least 6 characters
- [ ] Password change confirmation shown
- [ ] Can log in with new password after change

---

## 📚 Course Management

- [ ] Can view list of all courses
- [ ] Can add new course with valid data
- [ ] Course code is required
- [ ] Course name is required
- [ ] Credit hours is required (number)
- [ ] Can edit existing course
- [ ] Can delete course
- [ ] Cannot delete course if used in sections
- [ ] Search/filter works correctly

---

## 👨‍🏫 Instructor Management

- [ ] Can view list of all instructors
- [ ] Can add new instructor
- [ ] First name is required
- [ ] Last name is required
- [ ] Email is required
- [ ] Department is required
- [ ] Can edit existing instructor
- [ ] Can delete instructor
- [ ] Cannot delete instructor if assigned to schedules
- [ ] Search/filter works correctly

---

## 🏫 Room Management

- [ ] Can view list of all rooms
- [ ] Can add new room
- [ ] Room number is required
- [ ] Building is required
- [ ] Capacity is required (number)
- [ ] Room type is required
- [ ] Can edit existing room
- [ ] Can delete room
- [ ] Cannot delete room if used in schedules
- [ ] Search/filter works correctly

---

## 📋 Section Management

- [ ] Can view list of all sections
- [ ] Can add new section linked to a course
- [ ] Section number is required
- [ ] Course selection is required
- [ ] Semester is required
- [ ] Academic year is required
- [ ] Max students is required (number)
- [ ] Can edit existing section
- [ ] Can delete section
- [ ] Cannot delete section if has schedules
- [ ] Can filter by semester
- [ ] Can filter by academic year

---

## 📅 Schedule Management

### Creating Schedules
- [ ] Can create new schedule
- [ ] Section dropdown populated correctly
- [ ] Instructor dropdown populated correctly
- [ ] Room dropdown populated correctly
- [ ] Day of week selection works
- [ ] Time pickers work correctly (start/end time)
- [ ] Semester selection works
- [ ] Academic year selection works
- [ ] Schedule saved successfully message appears

### Conflict Detection
- [ ] **Instructor Time Conflict** detected when instructor has overlapping time
- [ ] **Room Conflict** detected when room is double-booked
- [ ] Conflict message displays clearly (red text, warning icon)
- [ ] Number of conflicts shown accurately
- [ ] Cannot save schedule with conflicts
- [ ] Can save schedule with "Include Conflicts" option

### Conflict Resolution
- [ ] "Suggest Alternatives" button appears when conflicts exist
- [ ] Resolution modal opens with two tabs
- [ ] **Alternative Time Slots** tab shows available times
- [ ] Can select alternative time and apply it
- [ ] **Alternative Rooms** tab shows available rooms
- [ ] Can select alternative room and apply it
- [ ] Schedule saves successfully after applying alternative

### Schedule Viewing
- [ ] Can view all schedules in table format
- [ ] Can filter by semester
- [ ] Can filter by academic year
- [ ] Can filter by instructor
- [ ] Can filter by room
- [ ] Can filter by section
- [ ] Can edit existing schedule
- [ ] Can delete schedule
- [ ] Schedule details display correctly

---

## 📤 Import/Export

### CSV Import
- [ ] Can download sample CSV template
- [ ] Can upload CSV file
- [ ] Validation detects missing required fields
- [ ] Validation detects invalid references
- [ ] Validation detects time conflicts
- [ ] Can view validation results before import
- [ ] Can choose to include/exclude conflicts
- [ ] Import success message shown
- [ ] Imported data appears in schedules list

### Excel Export
- [ ] Can export schedules to Excel
- [ ] Save dialog appears
- [ ] File saves to chosen location
- [ ] Excel file opens correctly
- [ ] All schedule data present in Excel
- [ ] Formatting is readable

### PDF Export
- [ ] Can export schedules to PDF
- [ ] Save dialog appears
- [ ] PDF contains TU logo (top left)
- [ ] PDF shows generation date and time
- [ ] PDF includes all schedule details
- [ ] PDF formatting is professional
- [ ] PDF is printable

---

## 📊 Dashboard

- [ ] Dashboard loads quickly on startup
- [ ] **Total Courses** stat displays correctly
- [ ] **Total Instructors** stat displays correctly
- [ ] **Total Rooms** stat displays correctly
- [ ] **Total Schedules** stat displays correctly
- [ ] Clicking stat cards navigates to respective pages
- [ ] **Schedules by Semester** chart displays
- [ ] **Instructor Workload** chart displays
- [ ] **Room Utilization** chart displays
- [ ] **Recent Schedules** table shows latest entries
- [ ] Charts update when data changes

---

## 💾 Backup & Restore

### Backup
- [ ] Can create database backup
- [ ] Save dialog appears with default filename
- [ ] Backup file saves to chosen location
- [ ] Backup file has .db extension
- [ ] Success message displayed
- [ ] Backup file can be found on disk

### Restore
- [ ] Can initiate restore
- [ ] File picker opens for .db files
- [ ] Can select backup file
- [ ] Warning about restart appears
- [ ] Database restored successfully
- [ ] App needs restart after restore
- [ ] Data from backup is present after restart

---

## ⚙️ Settings

- [ ] Can view current semester setting
- [ ] Can change active semester
- [ ] Semester change saves successfully
- [ ] Can view current academic year
- [ ] Can change academic year
- [ ] Academic year change saves successfully
- [ ] Changes reflect throughout app immediately
- [ ] **About** section displays app information
- [ ] **Features** list visible and readable
- [ ] **License** information shown

---

## 🎨 UI/UX

### Dark Mode
- [ ] Can toggle between light and dark mode
- [ ] Theme persists after app restart
- [ ] All pages respect theme setting
- [ ] Text is readable in both themes
- [ ] Buttons visible in both themes
- [ ] Tables readable in dark mode
- [ ] Hover effects work in dark mode
- [ ] No white-on-white or dark-on-dark text issues

### Navigation
- [ ] Sidebar displays all menu items
- [ ] Active page highlighted in sidebar
- [ ] Can navigate to all pages via sidebar
- [ ] TU logo displays in sidebar
- [ ] Logout button works correctly
- [ ] Returns to login page after logout

### Window Controls
- [ ] Native Windows minimize button works
- [ ] Native Windows maximize/restore button works
- [ ] Native Windows close button works
- [ ] F11 toggles fullscreen mode
- [ ] Can exit fullscreen with F11 or Escape
- [ ] Menu bar auto-hides correctly

### Responsiveness
- [ ] App works on 1920x1080 resolution
- [ ] App works on 1366x768 resolution
- [ ] Sidebar doesn't overlap content
- [ ] Tables scroll horizontally when needed
- [ ] Modals center on screen
- [ ] Forms don't overflow containers

---

## 🐛 Error Handling

- [ ] Network errors handled gracefully
- [ ] Database errors show clear messages
- [ ] Form validation errors are user-friendly
- [ ] File operation errors explained clearly
- [ ] No unhandled exceptions crash the app
- [ ] Error messages have close/dismiss buttons
- [ ] Errors don't prevent using other features

---

## 🔒 Security Checks

- [ ] Passwords are not visible in plain text
- [ ] Cannot access admin features as registrar
- [ ] Cannot access registrar features as viewer
- [ ] Viewer can only view, not edit/delete
- [ ] Recovery key is not visible after generation
- [ ] Database file is in secure user directory
- [ ] No sensitive data in console logs

---

## ⚡ Performance Checks

- [ ] App starts in under 5 seconds
- [ ] Login completes in under 1 second
- [ ] Dashboard loads in under 2 seconds
- [ ] Schedule list loads 100+ items smoothly
- [ ] No lag when typing in forms
- [ ] Charts render without flickering
- [ ] No memory leaks after extended use
- [ ] Export operations complete in reasonable time

---

## 📱 Edge Cases

- [ ] Can handle empty database (no courses/instructors)
- [ ] Can create schedule with same instructor, different times
- [ ] Can create schedule with same room, different times
- [ ] Can create schedule with same time, different days
- [ ] Form validation catches all required fields
- [ ] Cannot submit form with invalid data
- [ ] Long names don't break UI layout
- [ ] Special characters in names handled correctly
- [ ] Large datasets (500+ schedules) perform acceptably

---

## ✅ Final Checks Before Deployment

- [ ] All above tests passed
- [ ] No critical bugs identified
- [ ] Performance acceptable for production
- [ ] Security requirements met
- [ ] User documentation available (README.md)
- [ ] Recovery key documentation available (PASSWORD_RECOVERY_GUIDE.md)
- [ ] Default admin credentials documented
- [ ] Backup created before deployment
- [ ] Installation tested on clean Windows machine

---

## 🚀 Deployment Checklist

- [ ] Production build created (`npm run build`)
- [ ] Windows installer created (`npm run package`)
- [ ] Installer tested on target machine
- [ ] Database initialized on first run
- [ ] Default admin account created
- [ ] TU logos display correctly
- [ ] Application icon correct
- [ ] App auto-starts after installation (if configured)
- [ ] Uninstall works correctly
- [ ] App can be found in Start Menu

---

**Tester Name:** _________________  
**Date:** _________________  
**Build Version:** _________________  
**Test Result:** ☐ PASS  ☐ FAIL (list issues below)

**Issues Found:**
1. 
2. 
3. 

**Notes:**


---

**Testing Time Estimate:** 45-60 minutes for complete checklist
