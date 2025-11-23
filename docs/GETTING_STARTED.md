# Getting Started with TU Scheduler

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18.x or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional) - For version control
- **Windows 10 or 11** - Primary target platform

## Installation Steps

### 1. Install Dependencies

Open PowerShell or Command Prompt in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Electron
- React
- TypeScript
- SQLite
- TailwindCSS
- And all other dependencies

**Note**: Installation may take 5-10 minutes depending on your internet connection.

### 2. Verify Installation

Check that all dependencies are installed correctly:

```bash
npm list --depth=0
```

You should see a list of all installed packages without errors.

## Running the Application

### Development Mode

To run the application in development mode with hot reload:

```bash
npm run dev
```

This command will:
1. Start the Vite development server on `http://localhost:5173`
2. Launch the Electron application
3. Enable hot module replacement (changes auto-reload)
4. Open developer tools for debugging

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

### Development Workflow

While in development mode:
- Edit files in `src/` directory
- Changes to React components auto-reload
- Changes to main process require app restart
- Use Chrome DevTools for debugging (opens automatically)

## Building the Application

### Build for Testing

Compile the application without packaging:

```bash
npm run build
```

Output will be in the `dist/` folder.

### Create Windows Application Package

To create a distributable Windows application package:

```bash
npm run package
```

The application package will be created in the `release/` folder as:
- `TU Scheduler-win32-x64/` - Complete application folder

### Quick Package (No Rebuild)

For faster packaging without rebuilding:

```bash
npm run package:dir
```

Creates the same packaged application folder.

## Project Structure Overview

```
src/
├── main/          # Electron main process (Node.js backend)
├── renderer/      # React frontend (UI)
├── database/      # SQLite database and services
└── shared/        # Shared types and constants
```

## Common Development Tasks

### Add a New Page

1. Create a new file in `src/renderer/pages/`, e.g., `NewPage.tsx`
2. Add route in `src/renderer/App.tsx`
3. Add navigation link in `src/renderer/components/Sidebar.tsx`

### Add a New Database Table

1. Update schema in `src/database/init.ts`
2. Create service file in `src/database/services/`
3. Add IPC handlers in `src/main/ipc/handlers.ts`
4. Expose API in `src/main/preload.ts`
5. Create Zustand store in `src/renderer/store/`

### Add a New Component

Create in `src/renderer/components/` and import where needed:

```tsx
// src/renderer/components/MyComponent.tsx
export default function MyComponent() {
  return <div>Hello!</div>;
}
```

## Database Location

The SQLite database is stored at:
```
Windows: %APPDATA%/tu-scheduler/tu_scheduler.db
```

To access this folder:
1. Press `Win + R`
2. Type `%APPDATA%\tu-scheduler`
3. Press Enter

## Troubleshooting

### Issue: "Cannot find module 'electron'"

**Solution**: Run `npm install` again to ensure all dependencies are installed.

### Issue: Port 5173 already in use

**Solution**: Kill the process using port 5173 or change the port in `vite.config.ts`:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Issue: Build fails with TypeScript errors

**Solution**: 
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run build`

### Issue: Electron app won't start

**Solution**:
1. Check console for errors
2. Verify database initialization in `src/database/init.ts`
3. Check `dist/main/main.js` exists after building

### Issue: Hot reload not working

**Solution**: Restart the dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Code Style & Linting

### Run ESLint

```bash
npm run lint
```

### Format Code with Prettier

```bash
npm run format
```

### VS Code Setup

Install recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

These are listed in `.vscode/extensions.json`.

## Testing the Application

### Manual Testing Checklist

1. **Login**
   - Try correct credentials
   - Try incorrect credentials
   - Verify role-based access

2. **CRUD Operations**
   - Create new records
   - Edit existing records
   - Delete records
   - Verify data persistence

3. **Schedule Management**
   - Create schedules
   - Test conflict detection
   - Verify filtering

4. **Export/Import**
   - Export to Excel
   - Export to PDF
   - Import from CSV/Excel

5. **Backup/Restore**
   - Create backup
   - Restore from backup

## Production Deployment

### Before Deploying

1. Update version in `package.json`
2. Test all features thoroughly
3. Build the installer: `npm run package`
4. Test the installer on a clean Windows machine
5. Create release notes

### Installing on User Machines

1. Run `TU Scheduler Setup x.x.x.exe`
2. Follow installation wizard
3. Launch application from Start Menu or Desktop
4. Login with default credentials
5. Create new admin user and delete default

## Performance Tips

### Development
- Use React DevTools for component profiling
- Keep state updates minimal
- Use `useCallback` and `useMemo` for expensive operations

### Production
- Minimize bundle size (automatic with Vite)
- Optimize database queries with indexes
- Use pagination for large data sets

## Database Maintenance

### Backup Database

Use the built-in backup feature in Settings or manually copy:
```
%APPDATA%/tu-scheduler/tu_scheduler.db
```

### Reset Database

1. Close the application
2. Delete `tu_scheduler.db`
3. Restart application (new database created automatically)

## Getting Help

### Resources
- Project Requirements: `Project Requirements Document.md`
- Project Structure: `PROJECT_STRUCTURE.md`
- TypeScript Docs: https://www.typescriptlang.org/
- React Docs: https://react.dev/
- Electron Docs: https://www.electronjs.org/docs

### Common Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build application
npm run build

# Create installer
npm run package

# Run linter
npm run lint

# Format code
npm run format

# Clean build artifacts
Remove-Item -Recurse -Force dist, release
```

## Next Steps

After successfully running the application:

1. Explore the existing pages and components
2. Review the database schema in `src/database/init.ts`
3. Understand the IPC communication flow
4. Start implementing the placeholder pages
5. Add form validation and error handling
6. Implement the schedule builder with drag-and-drop
7. Add comprehensive testing

## Security Recommendations

1. **Change Default Password**: Immediately after first login
2. **User Management**: Create separate accounts for each user
3. **Regular Backups**: Schedule automatic backups
4. **Updates**: Keep Node.js and dependencies updated
5. **Access Control**: Use role-based permissions appropriately

## Contributing Guidelines

When contributing to this project:

1. Follow the existing code style
2. Write TypeScript with proper types
3. Test all changes thoroughly
4. Update documentation as needed
5. Commit messages should be descriptive

---

**Congratulations!** You now have a complete Electron + React + SQLite desktop application ready for development. Start building amazing features! 🚀
