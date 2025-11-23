import { getDatabase, saveDatabase } from '../init';
import { ApiResponse } from '../../shared/types';

// Helper function to convert sql.js result format to objects
function resultToObject(values: any[][], columns: string[]): any[] {
  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

export interface Settings {
  id: number;
  active_semester: string;
  academic_year: string;
  updated_at: string;
}

export class SettingsService {
  /**
   * Get current settings
   */
  static getSettings(): ApiResponse<Settings> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT * FROM settings WHERE id = 1');
      
      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          message: 'Settings not found',
        };
      }

      const settings = resultToObject(result[0].values, result[0].columns)[0] as Settings;
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get settings',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update active semester
   */
  static updateSemester(semester: string): ApiResponse<Settings> {
    try {
      const db = getDatabase();
      
      // Validate semester
      if (!['Semester 1', 'Semester 2'].includes(semester)) {
        return {
          success: false,
          message: 'Invalid semester. Must be "Semester 1" or "Semester 2"',
        };
      }

      db.run(
        `UPDATE settings 
         SET active_semester = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
        [semester]
      );
      
      saveDatabase();
      return this.getSettings();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update semester',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update academic year
   */
  static updateAcademicYear(academicYear: string): ApiResponse<Settings> {
    try {
      const db = getDatabase();
      
      db.run(
        `UPDATE settings 
         SET academic_year = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
        [academicYear]
      );
      
      saveDatabase();
      return this.getSettings();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update academic year',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get active semester
   */
  static getActiveSemester(): ApiResponse<string> {
    try {
      const settingsResponse = this.getSettings();
      
      if (!settingsResponse.success || !settingsResponse.data) {
        return {
          success: false,
          message: 'Failed to get active semester',
        };
      }

      return {
        success: true,
        data: settingsResponse.data.active_semester,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get active semester',
        error: (error as Error).message,
      };
    }
  }
}
