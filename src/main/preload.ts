import { contextBridge, ipcRenderer } from 'electron';

// Exposed API for renderer process
const api = {
  // User operations
  user: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke('user:login', username, password),
    logout: () => ipcRenderer.invoke('user:logout'),
    getCurrentUser: () => ipcRenderer.invoke('user:getCurrentUser'),
    createUser: (data: any) => ipcRenderer.invoke('user:create', data),
    updateUser: (id: number, data: any) => ipcRenderer.invoke('user:update', id, data),
    deleteUser: (id: number) => ipcRenderer.invoke('user:delete', id),
    getAllUsers: () => ipcRenderer.invoke('user:getAll'),
  },

  // Course operations
  course: {
    getAll: () => ipcRenderer.invoke('courses:getAll'),
    getById: (id: number) => ipcRenderer.invoke('courses:getById', id),
    create: (data: any) => ipcRenderer.invoke('courses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('courses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('courses:delete', id),
  },

  // Instructor operations
  instructor: {
    getAll: () => ipcRenderer.invoke('instructors:getAll'),
    getById: (id: number) => ipcRenderer.invoke('instructors:getById', id),
    create: (data: any) => ipcRenderer.invoke('instructors:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('instructors:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('instructors:delete', id),
  },

  // Room operations
  room: {
    getAll: () => ipcRenderer.invoke('rooms:getAll'),
    getById: (id: number) => ipcRenderer.invoke('rooms:getById', id),
    create: (data: any) => ipcRenderer.invoke('rooms:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('rooms:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('rooms:delete', id),
  },

  // Section operations
  section: {
    getAll: () => ipcRenderer.invoke('sections:getAll'),
    getById: (id: number) => ipcRenderer.invoke('sections:getById', id),
    create: (data: any) => ipcRenderer.invoke('sections:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('sections:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('sections:delete', id),
  },

  // Schedule operations
  schedule: {
    getAll: () => ipcRenderer.invoke('schedules:getAll'),
    getById: (id: number) => ipcRenderer.invoke('schedules:getById', id),
    create: (data: any) => ipcRenderer.invoke('schedules:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('schedules:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('schedules:delete', id),
    detectConflicts: (scheduleData: any, excludeIds?: number[]) => 
      ipcRenderer.invoke('schedules:detectConflicts', scheduleData, excludeIds),
    getByFilters: (filters: any) => ipcRenderer.invoke('schedules:getByFilters', filters),
    cleanupOrphaned: () => ipcRenderer.invoke('schedules:cleanupOrphaned'),
  },

  // Conflict resolution operations
  resolution: {
    suggestAlternativeTimes: (scheduleData: any, excludeIds?: number[]) => 
      ipcRenderer.invoke('resolution:suggestAlternativeTimes', scheduleData, excludeIds),
    suggestAlternativeRooms: (scheduleData: any, excludeIds?: number[]) => 
      ipcRenderer.invoke('resolution:suggestAlternativeRooms', scheduleData, excludeIds),
    autoResolve: (scheduleData: any, excludeIds?: number[]) => 
      ipcRenderer.invoke('resolution:autoResolve', scheduleData, excludeIds),
  },

  // Export operations
  export: {
    toExcel: (schedules: any[]) => ipcRenderer.invoke('export:toExcel', schedules),
    toPDF: (schedules: any[]) => ipcRenderer.invoke('export:toPDF', schedules),
    instructorWorkload: (schedules: any[]) => ipcRenderer.invoke('export:instructorWorkload', schedules),
    roomUtilization: (schedules: any[]) => ipcRenderer.invoke('export:roomUtilization', schedules),
  },

  // Import operations
  import: {
    validateCSV: (courses: any, instructors: any, rooms: any, sections: any) => 
      ipcRenderer.invoke('import:validateCSV', courses, instructors, rooms, sections),
    fromCSV: (validationResults: any, includeConflicts: boolean) => 
      ipcRenderer.invoke('import:fromCSV', validationResults, includeConflicts),
    generateSampleCSV: () => ipcRenderer.invoke('import:generateSampleCSV'),
  },

  // Backup operations
  backup: {
    createBackup: () => ipcRenderer.invoke('backup:create'),
    restoreBackup: (filePath: string) => ipcRenderer.invoke('backup:restore', filePath),
    generateRecoveryKey: () => ipcRenderer.invoke('backup:generateRecoveryKey'),
    resetPasswordWithKey: (recoveryKey: string, newPassword: string) => 
      ipcRenderer.invoke('backup:resetPasswordWithKey', recoveryKey, newPassword),
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    updateSemester: (semester: string) => ipcRenderer.invoke('settings:updateSemester', semester),
    updateAcademicYear: (academicYear: string) => ipcRenderer.invoke('settings:updateAcademicYear', academicYear),
    getActiveSemester: () => ipcRenderer.invoke('settings:getActiveSemester'),
  },

  // Dialog operations
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpen', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSave', options),
  },
};

// Expose protected API to renderer process
contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('electron', api);

// Type definitions for TypeScript
export type ElectronAPI = typeof api;
