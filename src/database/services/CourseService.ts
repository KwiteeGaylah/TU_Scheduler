import { getDatabase, saveDatabase } from '../init';
import type {
  Course,
  CourseCreateInput,
  CourseUpdateInput,
  ApiResponse,
} from '../../shared/types';
import { SettingsService } from './SettingsService';

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

export class CourseService {
  static async getAll(): Promise<ApiResponse<Course[]>> {
    try {
      const db = getDatabase();
      
      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';
      
      const stmt = db.prepare('SELECT * FROM courses WHERE semester = ? ORDER BY code');
      stmt.bind([activeSemester]);
      
      const courses: Course[] = [];
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const course: any = {};
        columns.forEach((col, idx) => {
          course[col] = values[idx];
        });
        courses.push(course as Course);
      }
      stmt.free();

      return { success: true, data: courses };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch courses',
        error: (error as Error).message,
      };
    }
  }

  static async getById(id: number): Promise<ApiResponse<Course>> {
    try {
      const db = getDatabase();
      const result = db.exec(`SELECT * FROM courses WHERE id = ${id}`);
      
      if (result.length === 0 || result[0].values.length === 0) {
        return { success: false, message: 'Course not found' };
      }

      const courses = resultToObject(result[0].values, result[0].columns);
      const course = courses[0] as Course;

      return { success: true, data: course };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch course',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: CourseCreateInput): Promise<ApiResponse<Course>> {
    try {
      const db = getDatabase();
      
      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';
      
      const stmt = db.prepare('INSERT INTO courses (code, title, credits, department, description, semester) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run([data.code, data.title, data.credits, data.department || null, data.description || null, activeSemester]);
      stmt.free();
      saveDatabase();

      // Query by unique code and semester using prepared statement
      const selectStmt = db.prepare('SELECT * FROM courses WHERE code = ? AND semester = ?');
      selectStmt.bind([data.code, activeSemester]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created course');
      }
      
      const course: any = {};
      columns.forEach((col, idx) => {
        course[col] = values[idx];
      });
      
      console.log('[CourseService.create] Final course object:', JSON.stringify(course));

      return { success: true, data: course as Course, message: 'Course created successfully' };
    } catch (error) {
      console.error('[CourseService.create] ERROR:', error);
      return {
        success: false,
        message: 'Failed to create course',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: CourseUpdateInput): Promise<ApiResponse<Course>> {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.code) {
        updates.push('code = ?');
        values.push(data.code);
      }

      if (data.title) {
        updates.push('title = ?');
        values.push(data.title);
      }

      if (data.credits !== undefined) {
        updates.push('credits = ?');
        values.push(data.credits);
      }

      if (data.department !== undefined) {
        updates.push('department = ?');
        values.push(data.department);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(values);
      stmt.free();
      saveDatabase();

      const result = db.exec(`SELECT * FROM courses WHERE id = ${id}`);
      const courses = resultToObject(result[0].values, result[0].columns);
      const course = courses[0] as Course;

      return { success: true, data: course, message: 'Course updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update course',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      
      // Ensure foreign keys are enabled for CASCADE to work
      db.exec('PRAGMA foreign_keys = ON');
      
      // Check how many schedules will be deleted
      const checkStmt = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE course_id = ?');
      checkStmt.bind([id]);
      checkStmt.step();
      const scheduleCount = checkStmt.get()[0] as number;
      checkStmt.free();
      
      // Delete the course (CASCADE will auto-delete related schedules)
      const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      const message = scheduleCount > 0 
        ? `Course deleted successfully. ${scheduleCount} associated schedule(s) were also removed.`
        : 'Course deleted successfully';
      
      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete course',
        error: (error as Error).message,
      };
    }
  }
}
