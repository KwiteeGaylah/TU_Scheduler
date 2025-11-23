import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DB_NAME } from '../../shared/constants';
import type { ApiResponse } from '../../shared/types';
import { getDatabase, saveDatabase, reloadDatabase } from '../init';

export class BackupService {
  static async createBackup(): Promise<ApiResponse> {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, DB_NAME);
      const backupDir = path.join(userDataPath, 'backups');

      // Create backups directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `tu_scheduler_backup_${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      // Copy database file
      fs.copyFileSync(dbPath, backupPath);

      return {
        success: true,
        message: 'Backup created successfully',
        data: { backupPath },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create backup',
        error: (error as Error).message,
      };
    }
  }

  static async restoreBackup(backupPath: string): Promise<ApiResponse> {
    try {
      console.log('Starting backup restore for file:', backupPath);
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, DB_NAME);
      console.log('Database path:', dbPath);

      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file not found' };
      }

      // Validate backup file by attempting to open it
      try {
        const initSqlJs = (await import('sql.js')).default;
        const wasmPath = path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        const SQL = await initSqlJs({
          wasmBinary: wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength)
        });
        
        const backupBuffer = fs.readFileSync(backupPath);
        const testDb = new SQL.Database(backupBuffer);
        testDb.close(); // Close test database
      } catch (error) {
        return { 
          success: false, 
          message: 'Invalid backup file. The selected file is not a valid database backup.' 
        };
      }

      // Create a backup of current database before restoring (optional safety backup)
      try {
        const backupDir = path.join(userDataPath, 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const preRestoreBackup = path.join(
          backupDir,
          `pre_restore_${timestamp}.db`
        );
        fs.copyFileSync(dbPath, preRestoreBackup);
      } catch (backupError) {
        // Log the error but continue with restore - this is not critical
        console.warn('Failed to create pre-restore backup:', backupError);
      }

      // Restore from backup
      fs.copyFileSync(backupPath, dbPath);

      // Reload database in memory
      await reloadDatabase();

      console.log('Backup restore completed successfully');
      return {
        success: true,
        message: 'Backup restored successfully.',
      };
    } catch (error) {
      console.error('Error during backup restore:', error);
      return {
        success: false,
        message: 'Failed to restore backup',
        error: (error as Error).message,
      };
    }
  }

  static async listBackups(): Promise<ApiResponse> {
    try {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'backups');

      if (!fs.existsSync(backupDir)) {
        return { success: true, data: [] };
      }

      const files = fs.readdirSync(backupDir);
      const backups = files
        .filter((file) => file.endsWith('.db'))
        .map((file) => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return { success: true, data: backups };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list backups',
        error: (error as Error).message,
      };
    }
  }

  static async generateRecoveryKey(): Promise<ApiResponse> {
    try {
      const userDataPath = app.getPath('userData');
      const recoveryKeyFile = path.join(userDataPath, '.recovery_key');

      // Generate a random recovery key (32 characters)
      const recoveryKey = crypto.randomBytes(16).toString('hex').toUpperCase();
      
      // Hash the recovery key before storing (same as password)
      const hashedKey = await bcrypt.hash(recoveryKey, 10);

      // Store the hashed key
      fs.writeFileSync(recoveryKeyFile, hashedKey, 'utf8');

      return {
        success: true,
        message: 'Recovery key generated successfully',
        data: { key: recoveryKey },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate recovery key',
        error: (error as Error).message,
      };
    }
  }

  static async resetPasswordWithKey(recoveryKey: string, newPassword: string): Promise<ApiResponse> {
    try {
      const userDataPath = app.getPath('userData');
      const recoveryKeyFile = path.join(userDataPath, '.recovery_key');

      console.log('Recovery key file path:', recoveryKeyFile);
      console.log('Recovery key received:', recoveryKey);

      // Check if recovery key file exists
      if (!fs.existsSync(recoveryKeyFile)) {
        console.log('Recovery key file not found');
        return {
          success: false,
          message: 'No recovery key found. Please generate a recovery key first.',
        };
      }

      // Read the stored hashed key
      const storedHashedKey = fs.readFileSync(recoveryKeyFile, 'utf8').trim();
      console.log('Stored hashed key:', storedHashedKey);

      // Verify the recovery key
      const isValidKey = await bcrypt.compare(recoveryKey, storedHashedKey);
      console.log('Key validation result:', isValidKey);

      if (!isValidKey) {
        return {
          success: false,
          message: 'Invalid recovery key',
        };
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the admin user's password (assuming admin has ID 1)
      const db = getDatabase();
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = 1',
        [hashedPassword]
      );
      
      // Save database changes
      saveDatabase();

      console.log('Password reset successfully');
      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Error in resetPasswordWithKey:', error);
      return {
        success: false,
        message: 'Failed to reset password: ' + (error as Error).message,
        error: (error as Error).message,
      };
    }
  }
}
