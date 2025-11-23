import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron API
global.window.electronAPI = {
  user: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getAllUsers: vi.fn(),
  },
  course: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  instructor: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  room: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  section: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  schedule: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    detectConflicts: vi.fn(),
    getByFilters: vi.fn(),
    cleanupOrphaned: vi.fn(),
  },
  resolution: {
    suggestAlternativeTimes: vi.fn(),
    suggestAlternativeRooms: vi.fn(),
    autoResolve: vi.fn(),
  },
  export: {
    toExcel: vi.fn(),
    toPDF: vi.fn(),
    instructorWorkload: vi.fn(),
    roomUtilization: vi.fn(),
  },
  import: {
    validateCSV: vi.fn(),
    fromCSV: vi.fn(),
    generateSampleCSV: vi.fn(),
  },
  backup: {
    createBackup: vi.fn(),
    restoreBackup: vi.fn(),
    generateRecoveryKey: vi.fn(),
    resetPasswordWithKey: vi.fn(),
  },
  settings: {
    get: vi.fn(),
    updateSemester: vi.fn(),
    updateAcademicYear: vi.fn(),
    getActiveSemester: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
  },
};
