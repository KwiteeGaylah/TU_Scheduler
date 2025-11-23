import { getDatabase, saveDatabase } from '../init';
import type {
  Section,
  SectionCreateInput,
  SectionUpdateInput,
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

export class SectionService {
  static async getAll(): Promise<ApiResponse<Section[]>> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT * FROM sections ORDER BY name');
      const sections = result.length > 0 ? resultToObject(result[0].values, result[0].columns) as Section[] : [];

      return { success: true, data: sections };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch sections',
        error: (error as Error).message,
      };
    }
  }

  static async getById(id: number): Promise<ApiResponse<Section>> {
    try {
      const db = getDatabase();
      const result = db.exec(`SELECT * FROM sections WHERE id = ${id}`);
      
      if (result.length === 0 || result[0].values.length === 0) {
        return { success: false, message: 'Section not found' };
      }

      const sections = resultToObject(result[0].values, result[0].columns);
      const section = sections[0] as Section;

      return { success: true, data: section };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch section',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: SectionCreateInput): Promise<ApiResponse<Section>> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('INSERT INTO sections (name, description) VALUES (?, ?)');
      stmt.run([data.name, data.description || null]);
      stmt.free();
      saveDatabase();

      // Query by unique name using prepared statement
      const selectStmt = db.prepare('SELECT * FROM sections WHERE name = ?');
      selectStmt.bind([data.name]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created section');
      }
      
      const section: any = {};
      columns.forEach((col, idx) => {
        section[col] = values[idx];
      });

      return { success: true, data: section as Section, message: 'Section created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create section',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: SectionUpdateInput): Promise<ApiResponse<Section>> {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE sections SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(values);
      stmt.free();
      saveDatabase();

      const result = db.exec(`SELECT * FROM sections WHERE id = ${id}`);
      const sections = resultToObject(result[0].values, result[0].columns);
      const section = sections[0] as Section;

      return { success: true, data: section, message: 'Section updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update section',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM sections WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      return { success: true, message: 'Section deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete section',
        error: (error as Error).message,
      };
    }
  }
}
