# TU Class Scheduling Desktop Application
## Project Requirements Document

This document outlines functional and non-functional requirements for a **desktop-based academic scheduling system**. The system enables administration to build semester schedules, detect and resolve conflicts automatically, generate printable timetables, and export/import schedule data.

Printable timetable columns:

Course code, course No. Description, Credict hours, section, Location, Days, Time, Available space, instructor.
---

## 1. Project Overview

**Project Name:** TU Scheduling & Timetable Management System  
**Goal:** Build an automated academic scheduling desktop application to replace manual Excel/Word scheduling and eliminate class conflicts between instructors, rooms, and course sections.  
**Primary Stakeholders:** Academic Affairs, Registrars, Deans, Department Chairs, Scheduling Committee

**Developed By:** Kwitee D. Gaylah  
**Deployment:** Windows Desktop Installation (.exe installer for Windows 10/11)

### Technology Stack

| Component | Technology | Notes |
|----------|------------|--------|
| Desktop Framework | **Electron.js** | Cross-platform desktop framework for Windows |
| Frontend | **React (TypeScript)** | Modern UI with component-based structure |
| State Management | Zustand / Redux | Manage UI and schedule state |
| Database | **SQLite** | Lightweight local DB, portable file-based |
| PDF & Excel Export | Puppeteer / exceljs | Printing and exporting |
| Installer Builder | electron-packager | Creates Windows application package |
| UI Framework | TailwindCSS or Material UI | Clean, responsive interface |

---

## 2. System Modules

### A. Authentication & Roles

| Feature | Description |
|---------|-------------|
| Local User Authentication | Secure login to restrict access |
| Role-based Access | Admin / Registrar / Read-only Viewer |
| Password Recovery | Local encrypted recovery key |

### B. Course, Instructor, Room, and Section Management

| Feature | Description |
|---------|-------------|
| Add/Edit/Delete Courses | Code, title, credits, department |
| Instructor Management | Name, email/phone optional |
| Room Management | Name, capacity |
| Section Management | Section name (S1, S2, etc.) |

### C. Schedule Management (Core Module)

| Field | Description |
|--------|-------------|
| Course | Link to course table |
| Section | Which section is assigned |
| Instructor | Instructor teaching |
| Room | Assigned classroom |
| Day | Monday–Saturday |
| Time | Start & End (HH:MM) |
| Available Space | Based on room capacity |

### D. Conflict Detection & Resolution

**Detect conflicts for:**
- Instructor double-booking
- Room double-booking
- Section overlapping periods
- Capacity issues

**Resolution Tools**
- Real-time alerts
- Suggest alternative times
- Suggest available rooms
- One-click auto-resolve

### E. Import & Export

| Feature | Description |
|---------|-------------|
| Import CSV/Excel | Bulk upload |
| Export Excel | Full or filtered timetable |
| Export PDF | Printable layout |
| Image-to-CSV (optional) | OCR draft conversion |

### F. Reporting & Dashboard

| Feature | Description |
|---------|-------------|
| Totals and summary metrics | Courses, instructors, rooms |
| Conflict counts | |
| Section & instructor load reports | |
| Print & download | |

### G. Settings & Backup

| Feature | Description |
|---------|-------------|
| App Settings | Time format, theme, week layout |
| DB Export | Backup .db file |
| Restore Backup | Manual import |

---

## 3. Database Design (SQLite)

| Table | Key Fields |
|--------|------------|
| courses | id, code, title, credits |
| instructors | id, name, contact |
| rooms | id, name, capacity |
| sections | id, name |
| schedules | id, course_id, instructor_id, room_id, section_id, day, start_time, end_time, available_space, notes |
| users | id, username, role, password_hash |

---

## 4. Implementation Phases

| Phase | Description | Deliverables | Duration |
|--------|-------------|---------------|-----------|
| **1. Project Setup & Architecture** | Initialize Electron + React project | Base skeleton | **2 weeks** |
| **2. Authentication & Security** | Local auth, hashing, roles | Login screen | **1.5 weeks** |
| **3. Database CRUD Modules** | Courses, rooms, instructors, sections | CRUD screens | **2 weeks** |
| **4. Scheduling Engine** | Time grid, drag-drop | Schedule editor | **3 weeks** |
| **5. Conflict Detection** | Logic + queries | Resolution module | **3 weeks** |
| **6. Reporting & Exports** | Excel, PDF, print | Reports | **2 weeks** |
| **7. Import & Optional OCR** | CSV importer | Import wizard | **1.5 weeks** |
| **8. UI Polishing & Dashboard** | Charts, indicators | Final UI | **1 week** |
| **9. Testing & QA** | Performance & security | Bug fixes | **2 weeks** |
| **10. Packaging & Deployment** | Build installer | Final .exe | **1 week** |

**Estimated Duration: 18–20 Weeks**

---

## 5. Functional Requirements

| ID | Requirement |
|-----|-------------|
| FR001 | User login & roles |
| FR002 | Manage instructors, rooms, sections |
| FR003 | Manage course catalog |
| FR004 | Create/edit schedules |
| FR005 | Detect conflicts |
| FR006 | Suggest alternative options |
| FR007 | Import/export CSV, Excel, PDF |
| FR008 | Printable timetable |
| FR009 | Dashboard analytics |
| FR010 | Backup/Restore |

---

## 6. Non-Functional Requirements

| ID | Category | Description |
|-----|----------|------------|
| NFR001 | Security | bcrypt hashed passwords |
| NFR002 | Database | AES encrypted backups |
| NFR003 | Performance | Load screens < 2 seconds |
| NFR004 | Reliability | Recoverable DB |
| NFR005 | Installation | Single .exe installer |
| NFR006 | Offline | 100% offline operation |
| NFR007 | Usability | Drag-and-drop UI |
| NFR008 | Maintainability | TypeScript & modular code |
| NFR009 | Updates | Auto-update optional |

---

## 7. Security Enhancements

- bcrypt password hashing
- Encrypted SQLite file & encrypted backups
- Optional signed installer
- Role-based authorization
- Offline-only system

---

## 8. Final Deliverables

- Source Code (Git Repo)
- Executable installer `TUScheduler.exe`
- User Manual & Training Video
- Backup/Restore Tool
- Fully functional deployed application

---

## 9. Approval

| Name | Role | Signature | Date |
|-------|--------|------------|--------|
| Kwitee D. Gaylah | Project Lead / Developer | | |
| Academic Affairs / TU | Stakeholder | | |

---

## Next Step

A) Starter Electron + React + SQLite source structure  
