import { getDatabase, saveDatabase } from '../init';
import type {
  Room,
  RoomCreateInput,
  RoomUpdateInput,
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

export class RoomService {
  static async getAll(): Promise<ApiResponse<Room[]>> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT * FROM rooms ORDER BY name');
      const rooms = result.length > 0 ? resultToObject(result[0].values, result[0].columns) as Room[] : [];

      return { success: true, data: rooms };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch rooms',
        error: (error as Error).message,
      };
    }
  }

  static async getById(id: number): Promise<ApiResponse<Room>> {
    try {
      const db = getDatabase();
      const result = db.exec(`SELECT * FROM rooms WHERE id = ${id}`);
      
      if (result.length === 0 || result[0].values.length === 0) {
        return { success: false, message: 'Room not found' };
      }

      const rooms = resultToObject(result[0].values, result[0].columns);
      const room = rooms[0] as Room;

      return { success: true, data: room };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch room',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: RoomCreateInput): Promise<ApiResponse<Room>> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('INSERT INTO rooms (name, capacity, building, equipment) VALUES (?, ?, ?, ?)');
      stmt.run([data.name, data.capacity, data.building || null, data.equipment || null]);
      stmt.free();
      saveDatabase();

      // Query by unique name using prepared statement
      const selectStmt = db.prepare('SELECT * FROM rooms WHERE name = ?');
      selectStmt.bind([data.name]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created room');
      }
      
      const room: any = {};
      columns.forEach((col, idx) => {
        room[col] = values[idx];
      });

      return { success: true, data: room as Room, message: 'Room created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create room',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: RoomUpdateInput): Promise<ApiResponse<Room>> {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.capacity !== undefined) {
        updates.push('capacity = ?');
        values.push(data.capacity);
      }

      if (data.building !== undefined) {
        updates.push('building = ?');
        values.push(data.building);
      }

      if (data.equipment !== undefined) {
        updates.push('equipment = ?');
        values.push(data.equipment);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(values);
      stmt.free();
      saveDatabase();

      const result = db.exec(`SELECT * FROM rooms WHERE id = ${id}`);
      const rooms = resultToObject(result[0].values, result[0].columns);
      const room = rooms[0] as Room;

      return { success: true, data: room, message: 'Room updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update room',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      return { success: true, message: 'Room deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete room',
        error: (error as Error).message,
      };
    }
  }
}
