import { getDatabase, saveDatabase } from '../init';
import type {
  Instructor,
  InstructorCreateInput,
  InstructorUpdateInput,
  ApiResponse,
} from '../../shared/types';

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

export class InstructorService {
  static async getAll(): Promise<ApiResponse<Instructor[]>> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT * FROM instructors ORDER BY name');
      const instructors = result.length > 0 ? resultToObject(result[0].values, result[0].columns) as Instructor[] : [];

      return { success: true, data: instructors };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch instructors',
        error: (error as Error).message,
      };
    }
  }

  static async getById(id: number): Promise<ApiResponse<Instructor>> {
    try {
      const db = getDatabase();
      const result = db.exec(`SELECT * FROM instructors WHERE id = ${id}`);
      
      if (result.length === 0 || result[0].values.length === 0) {
        return { success: false, message: 'Instructor not found' };
      }

      const instructors = resultToObject(result[0].values, result[0].columns);
      const instructor = instructors[0] as Instructor;

      return { success: true, data: instructor };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch instructor',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: InstructorCreateInput): Promise<ApiResponse<Instructor>> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('INSERT INTO instructors (name, email, phone, department) VALUES (?, ?, ?, ?)');
      stmt.run([data.name, data.email || null, data.phone || null, data.department || null]);
      stmt.free();
      saveDatabase();

      // Query by name using prepared statement
      const selectStmt = db.prepare('SELECT * FROM instructors WHERE name = ? ORDER BY id DESC LIMIT 1');
      selectStmt.bind([data.name]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created instructor');
      }
      
      const instructor: any = {};
      columns.forEach((col, idx) => {
        instructor[col] = values[idx];
      });

      return { success: true, data: instructor as Instructor, message: 'Instructor created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create instructor',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: InstructorUpdateInput): Promise<ApiResponse<Instructor>> {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.email !== undefined) {
        updates.push('email = ?');
        values.push(data.email);
      }

      if (data.phone !== undefined) {
        updates.push('phone = ?');
        values.push(data.phone);
      }

      if (data.department !== undefined) {
        updates.push('department = ?');
        values.push(data.department);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(values);
      stmt.free();
      saveDatabase();

      const result = db.exec(`SELECT * FROM instructors WHERE id = ${id}`);
      const instructors = resultToObject(result[0].values, result[0].columns);
      const instructor = instructors[0] as Instructor;

      return { success: true, data: instructor, message: 'Instructor updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update instructor',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM instructors WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      return { success: true, message: 'Instructor deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete instructor',
        error: (error as Error).message,
      };
    }
  }
}
