"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const constants_1 = require("../../shared/constants");
class BackupService {
    static async createBackup() {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const dbPath = path_1.default.join(userDataPath, constants_1.DB_NAME);
            const backupDir = path_1.default.join(userDataPath, 'backups');
            // Create backups directory if it doesn't exist
            if (!fs_1.default.existsSync(backupDir)) {
                fs_1.default.mkdirSync(backupDir, { recursive: true });
            }
            // Create backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `tu_scheduler_backup_${timestamp}.db`;
            const backupPath = path_1.default.join(backupDir, backupFileName);
            // Copy database file
            fs_1.default.copyFileSync(dbPath, backupPath);
            return {
                success: true,
                message: 'Backup created successfully',
                data: { backupPath },
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create backup',
                error: error.message,
            };
        }
    }
    static async restoreBackup(backupPath) {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const dbPath = path_1.default.join(userDataPath, constants_1.DB_NAME);
            // Verify backup file exists
            if (!fs_1.default.existsSync(backupPath)) {
                return { success: false, message: 'Backup file not found' };
            }
            // Create a backup of current database before restoring
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const preRestoreBackup = path_1.default.join(userDataPath, 'backups', `pre_restore_${timestamp}.db`);
            fs_1.default.copyFileSync(dbPath, preRestoreBackup);
            // Restore from backup
            fs_1.default.copyFileSync(backupPath, dbPath);
            return {
                success: true,
                message: 'Backup restored successfully. Please restart the application.',
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to restore backup',
                error: error.message,
            };
        }
    }
    static async listBackups() {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const backupDir = path_1.default.join(userDataPath, 'backups');
            if (!fs_1.default.existsSync(backupDir)) {
                return { success: true, data: [] };
            }
            const files = fs_1.default.readdirSync(backupDir);
            const backups = files
                .filter((file) => file.endsWith('.db'))
                .map((file) => {
                const filePath = path_1.default.join(backupDir, file);
                const stats = fs_1.default.statSync(filePath);
                return {
                    filename: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                };
            })
                .sort((a, b) => b.created.getTime() - a.created.getTime());
            return { success: true, data: backups };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to list backups',
                error: error.message,
            };
        }
    }
}
exports.BackupService = BackupService;
