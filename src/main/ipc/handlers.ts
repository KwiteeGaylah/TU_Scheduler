import { ipcMain, dialog } from 'electron';
import { UserService } from '../../database/services/UserService';
import { CourseService } from '../../database/services/CourseService';
import { InstructorService } from '../../database/services/InstructorService';
import { RoomService } from '../../database/services/RoomService';
import { SectionService } from '../../database/services/SectionService';
import { ScheduleService } from '../../database/services/ScheduleService';
import { ExportService } from '../../database/services/ExportService';
import { ImportService } from '../../database/services/ImportService';
import { BackupService } from '../../database/services/BackupService';
import { ConflictResolutionService } from '../../database/services/ConflictResolutionService';
import { SettingsService } from '../../database/services/SettingsService';

export const setupIpcHandlers = () => {
  // User handlers
  ipcMain.handle('user:login', async (_event, username: string, password: string) => {
    return await UserService.login(username, password);
  });

  ipcMain.handle('user:logout', async () => {
    return UserService.logout();
  });

  ipcMain.handle('user:getCurrentUser', async () => {
    return UserService.getCurrentUser();
  });

  ipcMain.handle('user:create', async (_event, data) => {
    return await UserService.create(data);
  });

  ipcMain.handle('user:update', async (_event, id: number, data) => {
    return await UserService.update(id, data);
  });

  ipcMain.handle('user:delete', async (_event, id: number) => {
    return await UserService.delete(id);
  });

  ipcMain.handle('user:getAll', async () => {
    return await UserService.getAll();
  });

  // Course handlers
  ipcMain.handle('courses:getAll', async () => {
    return await CourseService.getAll();
  });

  ipcMain.handle('courses:getById', async (_event, id: number) => {
    return await CourseService.getById(id);
  });

  ipcMain.handle('courses:create', async (_event, data) => {
    console.log('[IPC] courses:create received:', JSON.stringify(data));
    const result = await CourseService.create(data);
    console.log('[IPC] courses:create result:', JSON.stringify(result));
    return result;
  });

  ipcMain.handle('courses:update', async (_event, id: number, data) => {
    return await CourseService.update(id, data);
  });

  ipcMain.handle('courses:delete', async (_event, id: number) => {
    return await CourseService.delete(id);
  });

  // Instructor handlers
  ipcMain.handle('instructors:getAll', async () => {
    return await InstructorService.getAll();
  });

  ipcMain.handle('instructors:getById', async (_event, id: number) => {
    return await InstructorService.getById(id);
  });

  ipcMain.handle('instructors:create', async (_event, data) => {
    return await InstructorService.create(data);
  });

  ipcMain.handle('instructors:update', async (_event, id: number, data) => {
    return await InstructorService.update(id, data);
  });

  ipcMain.handle('instructors:delete', async (_event, id: number) => {
    return await InstructorService.delete(id);
  });

  // Room handlers
  ipcMain.handle('rooms:getAll', async () => {
    return await RoomService.getAll();
  });

  ipcMain.handle('rooms:getById', async (_event, id: number) => {
    return await RoomService.getById(id);
  });

  ipcMain.handle('rooms:create', async (_event, data) => {
    return await RoomService.create(data);
  });

  ipcMain.handle('rooms:update', async (_event, id: number, data) => {
    return await RoomService.update(id, data);
  });

  ipcMain.handle('rooms:delete', async (_event, id: number) => {
    return await RoomService.delete(id);
  });

  // Section handlers
  ipcMain.handle('sections:getAll', async () => {
    return await SectionService.getAll();
  });

  ipcMain.handle('sections:getById', async (_event, id: number) => {
    return await SectionService.getById(id);
  });

  ipcMain.handle('sections:create', async (_event, data) => {
    return await SectionService.create(data);
  });

  ipcMain.handle('sections:update', async (_event, id: number, data) => {
    return await SectionService.update(id, data);
  });

  ipcMain.handle('sections:delete', async (_event, id: number) => {
    return await SectionService.delete(id);
  });

  // Schedule handlers
  ipcMain.handle('schedules:getAll', async () => {
    return await ScheduleService.getAll();
  });

  ipcMain.handle('schedules:getById', async (_event, id: number) => {
    return await ScheduleService.getById(id);
  });

  ipcMain.handle('schedules:create', async (_event, data) => {
    return await ScheduleService.create(data);
  });

  ipcMain.handle('schedules:update', async (_event, id: number, data) => {
    return await ScheduleService.update(id, data);
  });

  ipcMain.handle('schedules:delete', async (_event, id: number) => {
    return await ScheduleService.delete(id);
  });

  ipcMain.handle('schedules:detectConflicts', async (_event, scheduleData, excludeIds) => {
    return await ScheduleService.detectConflicts(scheduleData, excludeIds);
  });

  ipcMain.handle('schedules:getByFilters', async (_event, filters) => {
    return await ScheduleService.getByFilters(filters);
  });

  ipcMain.handle('schedules:cleanupOrphaned', async () => {
    return await ScheduleService.cleanupOrphaned();
  });

  // Conflict resolution handlers
  ipcMain.handle('resolution:suggestAlternativeTimes', async (_event, scheduleData, excludeIds) => {
    return await ConflictResolutionService.suggestAlternativeTimes(scheduleData, excludeIds);
  });

  ipcMain.handle('resolution:suggestAlternativeRooms', async (_event, scheduleData, excludeIds) => {
    return await ConflictResolutionService.suggestAlternativeRooms(scheduleData, excludeIds);
  });

  ipcMain.handle('resolution:autoResolve', async (_event, scheduleData, excludeIds) => {
    return await ConflictResolutionService.autoResolve(scheduleData, excludeIds);
  });

  // Export handlers with Save As dialogs
  ipcMain.handle('export:toExcel', async (_event, schedules) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Schedules to Excel',
      defaultPath: 'schedules.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
    });
    if (!result.canceled && result.filePath) {
      return await ExportService.toExcel(schedules, result.filePath);
    }
    return { success: false, message: 'Export cancelled' };
  });

  ipcMain.handle('export:toPDF', async (_event, schedules) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Schedules to PDF',
      defaultPath: 'schedules.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    if (!result.canceled && result.filePath) {
      return await ExportService.toPDF(schedules, result.filePath);
    }
    return { success: false, message: 'Export cancelled' };
  });

  ipcMain.handle('export:instructorWorkload', async (_event, schedules) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Instructor Workload Report',
      defaultPath: 'instructor_workload.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
    });
    if (!result.canceled && result.filePath) {
      return await ExportService.exportInstructorWorkload(schedules, result.filePath);
    }
    return { success: false, message: 'Export cancelled' };
  });

  ipcMain.handle('export:roomUtilization', async (_event, schedules) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Room Utilization Report',
      defaultPath: 'room_utilization.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
    });
    if (!result.canceled && result.filePath) {
      return await ExportService.exportRoomUtilization(schedules, result.filePath);
    }
    return { success: false, message: 'Export cancelled' };
  });

  // Import handlers
  ipcMain.handle('import:validateCSV', async (_event, courses, instructors, rooms, sections) => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return await ImportService.validateCSV(result.filePaths[0], courses, instructors, rooms, sections);
    }
    return { success: false, message: 'Import cancelled' };
  });

  ipcMain.handle('import:fromCSV', async (_event, validationResults, includeConflicts) => {
    return await ImportService.fromCSV(validationResults, includeConflicts);
  });

  ipcMain.handle('import:generateSampleCSV', () => {
    return ImportService.generateSampleCSV();
  });

  // Backup handlers
  ipcMain.handle('backup:create', async () => {
    try {
      // First create the backup in the default location
      const backupResult = await BackupService.createBackup();
      
      if (!backupResult.success || !backupResult.data?.backupPath) {
        return backupResult;
      }

      // Show Save As dialog
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const result = await dialog.showSaveDialog({
        title: 'Save Backup',
        defaultPath: `tu_scheduler_backup_${timestamp}.db`,
        filters: [{ name: 'Database Backup', extensions: ['db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Backup cancelled' };
      }

      // Copy the backup file to the user-selected location
      const fs = require('fs');
      fs.copyFileSync(backupResult.data.backupPath, result.filePath);

      return {
        success: true,
        message: 'Backup created successfully',
        data: { backupPath: result.filePath },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create backup',
      };
    }
  });

  ipcMain.handle('backup:restore', async () => {
    console.log('Opening backup restore dialog...');
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Database Backup', extensions: ['db'] }],
      properties: ['openFile'],
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('Selected backup file:', result.filePaths[0]);
      const restoreResult = await BackupService.restoreBackup(result.filePaths[0]);
      console.log('Restore result:', restoreResult);
      return restoreResult;
    }
    
    console.log('Restore cancelled by user');
    return { success: false, message: 'Restore cancelled' };
  });

  ipcMain.handle('backup:generateRecoveryKey', async () => {
    return await BackupService.generateRecoveryKey();
  });

  ipcMain.handle('backup:resetPasswordWithKey', async (_event, recoveryKey: string, newPassword: string) => {
    return await BackupService.resetPasswordWithKey(recoveryKey, newPassword);
  });

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    return SettingsService.getSettings();
  });

  ipcMain.handle('settings:updateSemester', async (_event, semester: string) => {
    return SettingsService.updateSemester(semester);
  });

  ipcMain.handle('settings:updateAcademicYear', async (_event, academicYear: string) => {
    return SettingsService.updateAcademicYear(academicYear);
  });

  ipcMain.handle('settings:getActiveSemester', async () => {
    return SettingsService.getActiveSemester();
  });

  // Dialog handlers
  ipcMain.handle('dialog:showOpen', async (_event, options) => {
    return await dialog.showOpenDialog(options);
  });

  ipcMain.handle('dialog:showSave', async (_event, options) => {
    return await dialog.showSaveDialog(options);
  });
};
