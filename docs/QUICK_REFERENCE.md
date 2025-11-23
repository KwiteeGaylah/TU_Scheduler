# TU Scheduler - Quick Reference Guide

## 🚀 Essential Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start development mode
npm run build           # Build for production
npm run package         # Create Windows application package

# Code Quality
npm run lint            # Check for code issues
npm run format          # Format code with Prettier
```

## 🔐 Default Login

```
Username: admin
Password: admin123
```

## 📂 Important File Locations

```
Database:  %APPDATA%\tu-scheduler\tu_scheduler.db
Backups:   %APPDATA%\tu-scheduler\backups\
```

## 🛠️ Common Development Tasks

### Add a New Page

1. Create `src/renderer/pages/NewPage.tsx`
2. Add route in `src/renderer/App.tsx`
3. Add link in `src/renderer/components/Sidebar.tsx`

### Add a New Database Entity

1. Update schema in `src/database/init.ts`
2. Create `src/database/services/NewService.ts`
3. Add handlers in `src/main/ipc/handlers.ts`
4. Expose in `src/main/preload.ts`
5. Create `src/renderer/store/newStore.ts`

### Add a Component

```tsx
// src/renderer/components/MyComponent.tsx
export default function MyComponent() {
  return <div>Content</div>;
}
```

## 🎨 Tailwind CSS Classes

```tsx
// Buttons
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Danger</button>

// Input
<input className="input-field" />

// Card
<div className="card">Content</div>

// Table
<table className="table">...</table>
```

## 📡 Using the API

```tsx
// In React components
const { data } = await window.electronAPI.courses.getAll();
await window.electronAPI.courses.create({ code, title, credits });
await window.electronAPI.courses.update(id, data);
await window.electronAPI.courses.delete(id);
```

## 🗄️ Database Service Pattern

```typescript
// src/database/services/ExampleService.ts
import { getDatabase } from '../init';
import type { ApiResponse } from '../../shared/types';

export class ExampleService {
  static async getAll(): Promise<ApiResponse<Example[]>> {
    try {
      const db = getDatabase();
      const items = db.prepare('SELECT * FROM examples').all();
      return { success: true, data: items };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed',
        error: (error as Error).message 
      };
    }
  }
}
```

## 🔄 Zustand Store Pattern

```typescript
// src/renderer/store/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  items: Example[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.examples.getAll();
      if (response.success) {
        set({ items: response.data, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
```

## 🎯 IPC Handler Pattern

```typescript
// src/main/ipc/handlers.ts
ipcMain.handle('examples:getAll', async () => {
  return await ExampleService.getAll();
});

ipcMain.handle('examples:create', async (_event, data) => {
  return await ExampleService.create(data);
});
```

## 📝 TypeScript Types

```typescript
// src/shared/types/index.ts
export interface Example {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ExampleCreateInput {
  name: string;
}

export interface ExampleUpdateInput {
  name?: string;
}
```

## 🔍 Troubleshooting

### Port Already in Use
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Clear Build
```bash
Remove-Item -Recurse -Force dist, release
npm run build
```

### Reset Database
1. Close application
2. Delete `%APPDATA%\tu-scheduler\tu_scheduler.db`
3. Restart (new DB created automatically)

### Module Not Found
```bash
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 📊 Database Query Examples

```typescript
// Get all
const items = db.prepare('SELECT * FROM table').all();

// Get by ID
const item = db.prepare('SELECT * FROM table WHERE id = ?').get(id);

// Insert
const result = db.prepare('INSERT INTO table (col) VALUES (?)').run(value);
const newId = result.lastInsertRowid;

// Update
db.prepare('UPDATE table SET col = ? WHERE id = ?').run(value, id);

// Delete
db.prepare('DELETE FROM table WHERE id = ?').run(id);

// With JOIN
const data = db.prepare(`
  SELECT t1.*, t2.name as related_name
  FROM table1 t1
  JOIN table2 t2 ON t1.foreign_id = t2.id
`).all();
```

## 🎨 Component Patterns

### Modal Usage
```tsx
import Modal from '../components/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Title">
  <form>...</form>
</Modal>
```

### Loading State
```tsx
import LoadingSpinner from '../components/LoadingSpinner';

{isLoading && <LoadingSpinner size="lg" />}
```

### Protected Route (Admin Only)
```tsx
{user?.role === 'admin' && <Route path="/admin" element={<Admin />} />}
```

## 🚨 Error Handling

```typescript
try {
  const response = await window.electronAPI.courses.create(data);
  if (response.success) {
    // Success
  } else {
    // Handle error
    console.error(response.message);
  }
} catch (error) {
  console.error('Failed:', error);
}
```

## 📦 Build Outputs

```
Development: http://localhost:5173
Build:       dist/
Installer:   release/TU Scheduler Setup x.x.x.exe
Unpacked:    release/win-unpacked/
```

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Create role-specific accounts
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Validate all user inputs
- [ ] Use prepared statements
- [ ] Enable encryption (optional)

## 📈 Performance Tips

- Use indexes on frequently queried columns
- Paginate large data sets
- Use `useMemo` for expensive calculations
- Implement virtual scrolling for long lists
- Optimize images and assets
- Use code splitting for large features

## 🎓 Learning Resources

- **Electron**: https://www.electronjs.org/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **SQLite**: https://sqlite.org/docs.html
- **Zustand**: https://github.com/pmndrs/zustand

## 📞 Getting Help

1. Check `GETTING_STARTED.md` for setup issues
2. Review `PROJECT_STRUCTURE.md` for architecture
3. Read inline code comments
4. Check console for error messages
5. Verify database file exists and is not corrupted

## ✅ Pre-Deployment Checklist

- [ ] All features tested
- [ ] No console errors
- [ ] Database migrations work
- [ ] Backup/restore tested
- [ ] Export/import verified
- [ ] User roles working correctly
- [ ] Version number updated
- [ ] Installer tested on clean machine
- [ ] Documentation updated
- [ ] Release notes prepared

---

**Quick Tip**: Keep this file open while developing for instant reference! 🚀
