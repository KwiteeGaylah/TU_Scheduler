# TU Scheduler - Project Structure

## Complete Directory Structure

```
TU_Scheduler/
├── src/
│   ├── main/                           # Electron Main Process
│   │   ├── main.ts                    # Main entry point for Electron
│   │   ├── preload.ts                 # Preload script (IPC bridge)
│   │   └── ipc/
│   │       └── handlers.ts            # IPC handlers for all operations
│   │
│   ├── renderer/                       # React Frontend (Renderer Process)
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Main App component with routing
│   │   ├── components/                # Reusable UI components
│   │   │   ├── Layout.tsx             # Main layout wrapper
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   ├── Header.tsx             # Top header with user info
│   │   │   ├── Modal.tsx              # Modal dialog component
│   │   │   └── LoadingSpinner.tsx     # Loading indicator
│   │   ├── pages/                     # Page components
│   │   │   ├── Login.tsx              # Login page
│   │   │   ├── Dashboard.tsx          # Dashboard with statistics
│   │   │   ├── Courses.tsx            # Course management
│   │   │   ├── Instructors.tsx        # Instructor management
│   │   │   ├── Rooms.tsx              # Room management
│   │   │   ├── Sections.tsx           # Section management
│   │   │   ├── Schedule.tsx           # Schedule builder
│   │   │   ├── Users.tsx              # User management (admin)
│   │   │   └── Settings.tsx           # Settings and backup
│   │   ├── store/                     # Zustand state management
│   │   │   ├── authStore.ts           # Authentication state
│   │   │   ├── courseStore.ts         # Course state
│   │   │   └── scheduleStore.ts       # Schedule state
│   │   ├── styles/
│   │   │   └── index.css              # Global styles with Tailwind
│   │   └── types/
│   │       └── global.d.ts            # Global TypeScript definitions
│   │
│   ├── database/                       # Database Layer
│   │   ├── init.ts                    # Database initialization
│   │   └── services/                  # Database services
│   │       ├── UserService.ts         # User CRUD operations
│   │       ├── CourseService.ts       # Course CRUD operations
│   │       ├── InstructorService.ts   # Instructor CRUD operations
│   │       ├── RoomService.ts         # Room CRUD operations
│   │       ├── SectionService.ts      # Section CRUD operations
│   │       ├── ScheduleService.ts     # Schedule CRUD & conflict detection
│   │       ├── ExportService.ts       # Excel & PDF export
│   │       ├── ImportService.ts       # CSV & Excel import
│   │       └── BackupService.ts       # Database backup & restore
│   │
│   └── shared/                         # Shared code between main & renderer
│       ├── types/
│       │   └── index.ts               # TypeScript interfaces & types
│       └── constants/
│           └── index.ts               # Application constants
│
├── dist/                               # Build output (generated)
│   ├── main/                          # Compiled main process
│   └── renderer/                      # Compiled renderer process
│
├── build/                              # Build resources
│   └── icon.ico                       # Application icon (to be added)
│
├── release/                            # Packaged installers (generated)
│
├── node_modules/                       # Dependencies (generated)
│
├── package.json                        # Project dependencies & scripts
├── tsconfig.json                       # TypeScript config for renderer
├── tsconfig.main.json                  # TypeScript config for main
├── tsconfig.node.json                  # TypeScript config for build tools
├── vite.config.ts                      # Vite configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── postcss.config.js                   # PostCSS configuration
├── .eslintrc.cjs                       # ESLint configuration
├── .prettierrc                         # Prettier configuration
├── .gitignore                          # Git ignore rules
├── README.md                           # Project documentation
└── Project Requirements Document.md    # Requirements specification
```

## Key Technologies

### Main Process (Node.js/Electron)
- **Electron**: Desktop application framework
- **sql.js**: SQLite database driver (WebAssembly)
- **bcryptjs**: Password hashing
- **exceljs**: Excel file generation
- **jspdf**: PDF generation

### Renderer Process (React)
- **React 18**: UI framework
- **React Router DOM**: Client-side routing
- **Zustand**: State management
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Type-safe development

### Build Tools
- **Vite**: Fast build tool and dev server
- **electron-packager**: Package and distribute the app
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Database Schema

### Tables

1. **users**
   - id, username, password_hash, role, created_at, updated_at
   - Default admin user created on first run

2. **courses**
   - id, code, title, credits, department, description, created_at, updated_at

3. **instructors**
   - id, name, email, phone, department, created_at, updated_at

4. **rooms**
   - id, name, capacity, building, equipment, created_at, updated_at

5. **sections**
   - id, name, description, created_at, updated_at

6. **schedules**
   - id, course_id, instructor_id, room_id, section_id
   - day, start_time, end_time, available_space, notes
   - created_at, updated_at
   - Foreign keys to related tables

## IPC Communication

The application uses Electron's IPC (Inter-Process Communication) for secure communication between the main and renderer processes:

### Available APIs (via window.electronAPI)
- **user**: login, logout, getCurrentUser, create, update, delete, getAll
- **courses**: getAll, getById, create, update, delete
- **instructors**: getAll, getById, create, update, delete
- **rooms**: getAll, getById, create, update, delete
- **sections**: getAll, getById, create, update, delete
- **schedules**: getAll, getById, create, update, delete, detectConflicts, getByFilters
- **export**: toExcel, toPdf
- **import**: fromCsv, fromExcel
- **backup**: createBackup, restoreBackup
- **dialog**: showOpenDialog, showSaveDialog

## Development Workflow

### Install Dependencies
```bash
npm install
```

### Run Development Mode
```bash
npm run dev
```
This starts:
- Vite dev server on http://localhost:5173
- Electron app with hot reload

### Build for Production
```bash
npm run build
```
Compiles both main and renderer processes

### Create Windows Application Package
```bash
npm run package
```
Creates packaged application in the `release/` folder

## Next Steps for Full Implementation

### Phase 1: Enhanced UI Components
- [ ] Complete CRUD forms for Courses, Instructors, Rooms, Sections
- [ ] Add data tables with sorting, filtering, pagination
- [ ] Implement form validation
- [ ] Add toast notifications for user feedback

### Phase 2: Schedule Builder
- [ ] Interactive time grid with drag-and-drop
- [ ] Visual conflict indicators
- [ ] Quick edit and delete from grid
- [ ] Filter by instructor, room, day, section
- [ ] Color-coding by course or department

### Phase 3: Conflict Resolution
- [ ] Detailed conflict reports
- [ ] Suggestion engine for alternative times/rooms
- [ ] One-click conflict resolution
- [ ] Bulk schedule operations

### Phase 4: Reports & Export
- [ ] Customizable report templates
- [ ] Print preview for timetables
- [ ] Multiple export formats
- [ ] Email integration (optional)

### Phase 5: Advanced Features
- [ ] Multi-semester support
- [ ] Schedule templates
- [ ] Undo/redo functionality
- [ ] Search and advanced filters
- [ ] Data validation rules

### Phase 6: Polish & Testing
- [ ] Comprehensive error handling
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] User acceptance testing
- [ ] Documentation and training materials

## Default Credentials

**Username**: admin  
**Password**: admin123

Change these immediately after first login for security.

## File Locations

- **Database**: `%APPDATA%/tu-scheduler/tu_scheduler.db`
- **Backups**: `%APPDATA%/tu-scheduler/backups/`
- **Logs**: `%APPDATA%/tu-scheduler/logs/` (if implemented)

## Security Considerations

1. Passwords are hashed with bcrypt (10 rounds)
2. Database file can be encrypted (optional feature)
3. Role-based access control
4. No external API calls (fully offline)
5. SQLite prepared statements prevent SQL injection

## License

MIT License - Open Source

## Support

For issues or questions, contact: **Kwitee D. Gaylah**
