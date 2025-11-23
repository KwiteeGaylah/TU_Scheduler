import { getDatabase, saveDatabase } from '../init';
import bcrypt from 'bcryptjs';
import type {
  User,
  UserCreateInput,
  UserUpdateInput,
  ApiResponse,
} from '../../shared/types';

let currentUser: User | null = null;

// Helper function to convert sql.js result to object
const resultToObject = (result: any[], columns: string[]): any[] => {
  return result.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
};

export class UserService {
  static async login(username: string, password: string): Promise<ApiResponse<User>> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);

      if (!result.length || !result[0].values.length) {
        return { success: false, message: 'Invalid username or password' };
      }

      const users = resultToObject(result[0].values, result[0].columns);
      const user = users[0] as User;

      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Store current user (exclude password)
      const { password_hash, ...userWithoutPassword } = user;
      currentUser = user;

      return {
        success: true,
        data: userWithoutPassword as User,
        message: 'Login successful',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed',
        error: (error as Error).message,
      };
    }
  }

  static logout(): ApiResponse {
    currentUser = null;
    return { success: true, message: 'Logged out successfully' };
  }

  static getCurrentUser(): ApiResponse<User | null> {
    if (currentUser) {
      const { password_hash, ...userWithoutPassword } = currentUser;
      return { success: true, data: userWithoutPassword as User };
    }
    return { success: false, data: null };
  }

  static async getAll(): Promise<ApiResponse<User[]>> {
    try {
      const db = getDatabase();
      const result = db.exec('SELECT id, username, role, created_at, updated_at FROM users');
      
      if (!result.length) {
        return { success: true, data: [] };
      }

      const users = resultToObject(result[0].values, result[0].columns) as User[];
      return { success: true, data: users };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch users',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: UserCreateInput): Promise<ApiResponse<User>> {
    try {
      const db = getDatabase();
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
      stmt.run([data.username, hashedPassword, data.role]);
      stmt.free();

      saveDatabase();

      // Query by unique username using prepared statement
      const selectStmt = db.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE username = ?');
      selectStmt.bind([data.username]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created user');
      }
      
      const user: any = {};
      columns.forEach((col, idx) => {
        user[col] = values[idx];
      });

      return { success: true, data: user as User, message: 'User created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create user',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: UserUpdateInput): Promise<ApiResponse<User>> {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.username) {
        updates.push('username = ?');
        values.push(data.username);
      }

      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        updates.push('password_hash = ?');
        values.push(hashedPassword);
      }

      if (data.role) {
        updates.push('role = ?');
        values.push(data.role);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(values);
      stmt.free();
      saveDatabase();

      const result = db.exec('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id]);
      const users = resultToObject(result[0].values, result[0].columns);
      const user = users[0] as User;

      return { success: true, data: user, message: 'User updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user',
        error: (error as Error).message,
      };
    }
  }
}
