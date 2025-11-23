# TU Scheduler - Class Scheduling & Timetable Management System

**An Open Source Desktop Application for Academic Scheduling**

Automated academic scheduling with conflict detection and timetable generation

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

##  Overview

**TU Scheduler** is a comprehensive desktop application designed for academic scheduling, conflict detection, and timetable generation. Built with modern web technologies, it provides a streamlined workflow for educational institutions to manage course scheduling efficiently.

**Key Benefits:**
-  **Automated Conflict Detection** - Instantly identify instructor, room, and time conflicts
-  **Analytics Dashboard** - Visual insights into scheduling metrics
-  **Offline Operation** - No internet required, all data stored locally
-  **Open Source** - Free to use, modify, and distribute
-  **Import/Export** - CSV/Excel import and PDF/Excel export capabilities
-  **Professional Reports** - Instructor workload and room utilization reports

**Developer:** Kwitee D. Gaylah  
**Platform:** Windows 10/11 Desktop Application  
**License:** MIT

---

##  Features

### Core Functionality

####  Authentication & Access Control
- Secure login with bcrypt password hashing
- Password recovery system with cryptographic keys
- Profile management and password change

####  Course Management
- Add, edit, and delete courses
- Track course codes, titles, credit hours, and departments
- Search and filter courses
- Batch import from CSV/Excel

####  Instructor Management
- Manage instructor profiles
- Track contact information
- View teaching assignments and workload
- Generate instructor workload reports

####  Room Management
- Manage classrooms and facilities
- Track room capacity
- Monitor room utilization
- Generate room utilization reports

####  Section Management
- Create course sections
- Assign instructors and rooms
- Set enrollment limits
- Track section capacity

####  Schedule Builder
- Interactive scheduling interface
- Real-time conflict detection (instructor, room, time)
- Multiple time slot options
- Day-of-week selection

####  Analytics Dashboard
- Total courses, sections, and schedules metrics
- Visual charts and graphs
- Conflict resolution status
- System health indicators

####  Import/Export
- CSV/Excel bulk import with validation
- Excel export (.xlsx) - Professional formatting
- PDF export (print-ready timetables)
- Instructor workload and room utilization reports

####  Backup & Restore
- Manual backup creation
- Backup restore functionality
- Recovery key generation for password reset
- Automatic backup validation

---

##  Quick Start

### Default Admin Credentials

When you first launch TU Scheduler:

**Username:** `admin`  
**Password:** `admin123`

>  **IMPORTANT:** Change the default password immediately after first login!

### First-Time Setup (5 Minutes)

1. **Login** with default credentials
2. **Change Password:** Navigate to Profile  Change Password
3. **Generate Recovery Key:** Password Recovery  Generate New Recovery Key  Download file
4. **Start Scheduling:** Add courses, instructors, rooms  Create sections  Build schedules

---

##  Installation

### Prerequisites

- **Operating System:** Windows 10 or Windows 11 (64-bit)
- **Node.js:** Version 18+ (development only)
- **npm:** Version 8+ (development only)

### End Users (Production)

1. Download [TU.Scheduler.exe](https://github.com/KwiteeGaylah/TU_Scheduler/releases/download/V1/TU.Scheduler.exe)
2. Run installer and follow wizard
3. Launch from Start Menu or Desktop
4. Login and complete first-time setup

### Developers (From Source)

```powershell
git clone <repository-url>
cd TU_Scheduler
npm install
npm run dev        # Development mode
npm run build      # Production build
npm run package    # Create installer
```

---

##  Usage

### Basic Workflow

1. **Add Courses**  Courses page  + Add Course
2. **Add Instructors**  Instructors page  + Add Instructor
3. **Add Rooms**  Rooms page  + Add Room
4. **Create Sections**  Sections page  + Add Section (assign course, instructor, room)
5. **Build Schedule**  Schedule Management  + Add Schedule (select section, days, time)
6. **Export Timetable**  Schedule Management   Export (Excel or PDF)

### Import Schedules

1. Download sample CSV template from Schedule Management
2. Fill required columns: Course Code, Section, Room, Days, Time, Instructor
3. Import via Import button  validation  confirm

---

##  Documentation

Comprehensive documentation in `docs/` folder:

| Document | Description |
|----------|-------------|
| **[Password Recovery Guide](./docs/PASSWORD_RECOVERY_GUIDE.md)** | Password recovery system guide |
| **[Import/Export Guide](./docs/IMPORT_EXPORT_GUIDE.md)** | CSV/Excel import and PDF/Excel export |
| **[Manual Test Checklist](./docs/MANUAL_TEST_CHECKLIST.md)** | 150+ test scenarios for QA |
| **[Test Report](./docs/TEST_REPORT.md)** | Testing infrastructure and results |
| **[Project Requirements](./docs/PROJECT_REQUIREMENTS.md)** | Original requirements document |
| **[Project Structure](./docs/PROJECT_STRUCTURE.md)** | Detailed codebase structure |
| **[Getting Started](./docs/GETTING_STARTED.md)** | Developer getting started guide |

---

##  Tech Stack

**Desktop:** Electron.js, electron-packager  
**Frontend:** React 18.2.0, TypeScript 5.2.2, Vite 5.0.8, TailwindCSS 3.4.0  
**State:** Zustand 4.4.7  
**Database:** SQLite via sql.js 1.10.3, bcryptjs 2.4.3  
**Import/Export:** ExcelJS 4.4.0, jsPDF 3.0.4, Papa Parse 5.5.3  
**Charts:** Recharts 2.10.3  
**Icons:** Lucide React 0.294.0  
**Testing:** Vitest 1.0.4, Testing Library, jsdom

---

##  Project Structure

```
TU_Scheduler/
 src/
    main/                    # Electron main process
    renderer/                # React frontend
    database/                # Database layer & services
    shared/                  # TypeScript types & constants
    tests/                   # Test files
 public/                      # Static assets (logos)
 docs/                        # Documentation
 dist/                        # Build output (generated)
 release/                     # Installers (generated)
```

**Key Directories:**
- `src/main/` - Electron main process, IPC handlers
- `src/renderer/` - React components, pages, routing
- `src/database/` - SQLite, services (User, Course, Schedule, etc.)
- `src/tests/` - Vitest unit and component tests
- `docs/` - All documentation files

---

##  Development

### Available Scripts

```powershell
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run package          # Create Windows application package
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run test             # Run tests in watch mode
npm run test:ui          # Run tests with visual UI
npm run test:run         # Run tests once (CI mode)
npm run test:coverage    # Run tests with coverage report
```

### Database Schema

**Tables:**
- `users` - Authentication (id, username, password_hash, role, created_at)
- `courses` - Course catalog (id, code, name, credit_hours, department)
- `instructors` - Instructor info (id, name, email, phone)
- `rooms` - Classroom data (id, name, capacity)
- `sections` - Course sections (id, course_id, instructor_id, room_id, max_students, section_number)
- `schedules` - Schedule assignments (id, section_id, day_of_week, time_slot, created_at)

### IPC Communication

Electron IPC channels for main-renderer communication:
- `user:*` - User authentication and management
- `course:*` - Course CRUD operations
- `instructor:*` - Instructor CRUD operations
- `room:*` - Room CRUD operations
- `section:*` - Section CRUD operations
- `schedule:*` - Schedule CRUD and conflict detection
- `export:*` - Excel/PDF export
- `import:*` - CSV/Excel import
- `backup:*` - Backup/restore and recovery key management

---

##  Security

### Password Security
- **bcrypt hashing** with 10 salt rounds
- **No plaintext passwords** stored anywhere
- **Password recovery** uses cryptographic keys

### Recovery Key System
- **32-character hexadecimal keys** (128-bit entropy)
- **bcrypt hashing** before storage
- **Secure storage** at `%APPDATA%/tu-scheduler/.recovery_key`
- **One-time viewing** - key shown only during generation

### Role-Based Access Control
- **Admin** - Full access
- **Registrar** - Limited access (no user management)
- **Viewer** - Read-only access

### Data Security
- **SQLite database** at `%APPDATA%/tu-scheduler/scheduler.db`
- **Offline-only** - No internet connection required
- **Local storage** - All data stays on your computer
- **Manual backups** - User-controlled

### Best Practices
1.  Change default admin password immediately
2.  Generate and store recovery key
3.  Store recovery key securely (USB, printed copy, password manager)
4.  Create regular database backups
5.  Test backup restoration periodically

---

##  Testing

### Automated Testing

- **36 total tests** covering services and components
- **Vitest** framework with jsdom environment
- **Testing Library** for React components
- **Test coverage reporting** available

Run tests:
```powershell
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:ui           # Visual UI
npm run test:coverage     # With coverage
```

### Manual Testing

Comprehensive checklist with **150+ test scenarios**:
- Authentication & Security (9 tests)
- Course/Instructor/Room/Section Management (60+ tests)
- Schedule Management (20+ tests)
- Import/Export (15 tests)
- UI/UX (25+ tests)
- Performance (8 tests)
- Pre-Deployment Verification (10 tests)

See: [docs/MANUAL_TEST_CHECKLIST.md](./docs/MANUAL_TEST_CHECKLIST.md)

---

##  Deployment

### Creating Windows Application Package

```powershell
npm run build      # Build application
npm run package    # Create application package
```

Application package created at: `release/TU Scheduler-win32-x64/`

### Installation Requirements
- **OS:** Windows 10/11 (64-bit)
- **Disk Space:** ~300 MB
- **RAM:** 2 GB minimum, 4 GB recommended
- **Display:** 1366x768 minimum resolution

### Post-Installation
1. Application folder created at `release/TU Scheduler-win32-x64/`
2. Copy the entire folder to desired location (e.g., `C:\Program Files\TU Scheduler\`)
2. Database created at `%APPDATA%\tu-scheduler\scheduler.db`
3. Desktop shortcut created (optional)
4. Start Menu entry added
5. Default admin account created automatically

---

##  Troubleshooting

**Cannot login with default credentials**  
 Check `%APPDATA%\tu-scheduler\scheduler.db` exists

**Forgot password and lost recovery key**  
 Delete `%APPDATA%\tu-scheduler\` folder ( loses all data), restart app

**Schedule conflicts not detected**  
 Ensure instructor, room, day, and time slot are set correctly

**Export fails**  
 Check Downloads folder permissions, try "Run as Administrator"

**Import validation errors**  
 Download sample CSV, ensure columns match exactly

**Application won't start**  
 Check Windows Event Viewer, reinstall, check antivirus

---

##  License

**MIT License**

Copyright (c) 2025 Kwitee D. Gaylah

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

The MIT License allows you to:
- ✅ Use the software for any purpose
- ✅ Modify and distribute the software
- ✅ Use commercially
- ✅ Distribute modified versions

---

##  Developer

**Name:** Kwitee D. Gaylah  
**Institution:** Tubman University  
**Project:** TU Scheduler - Class Scheduling & Timetable Management System  
**Year:** 2025

---

##  Acknowledgments

- Academic institutions and educators (inspiration)
- React, Electron, and TypeScript communities
- Open-source contributors

---

<div align="center">

**Made with  ❤️ for Education**

*Open Source Academic Scheduling*

</div>
