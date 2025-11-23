"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const init_1 = require("../init");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
let currentUser = null;
// Helper function to convert sql.js result to object
const resultToObject = (result, columns) => {
    return result.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    });
};
class UserService {
    static async login(username, password) {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);
            if (!result.length || !result[0].values.length) {
                return { success: false, message: 'Invalid username or password' };
            }
            const users = resultToObject(result[0].values, result[0].columns);
            const user = users[0];
            if (!user) {
                return { success: false, message: 'Invalid username or password' };
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                return { success: false, message: 'Invalid username or password' };
            }
            // Store current user (exclude password)
            const { password_hash, ...userWithoutPassword } = user;
            currentUser = user;
            return {
                success: true,
                data: userWithoutPassword,
                message: 'Login successful',
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Login failed',
                error: error.message,
            };
        }
    }
    static logout() {
        currentUser = null;
        return { success: true, message: 'Logged out successfully' };
    }
    static getCurrentUser() {
        if (currentUser) {
            const { password_hash, ...userWithoutPassword } = currentUser;
            return { success: true, data: userWithoutPassword };
        }
        return { success: false, data: null };
    }
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db.exec('SELECT id, username, role, created_at, updated_at FROM users');
            if (!result.length) {
                return { success: true, data: [] };
            }
            const users = resultToObject(result[0].values, result[0].columns);
            return { success: true, data: users };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch users',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            const db = (0, init_1.getDatabase)();
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
            db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [data.username, hashedPassword, data.role]);
            (0, init_1.saveDatabase)();
            const result = db.exec('SELECT id, username, role, created_at, updated_at FROM users WHERE username = ?', [data.username]);
            const users = resultToObject(result[0].values, result[0].columns);
            const user = users[0];
            return { success: true, data: user, message: 'User created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create user',
                error: error.message,
            };
        }
    }
    static async update(id, data) {
        try {
            const db = (0, init_1.getDatabase)();
            const updates = [];
            const values = [];
            if (data.username) {
                updates.push('username = ?');
                values.push(data.username);
            }
            if (data.password) {
                const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
                updates.push('password_hash = ?');
                values.push(hashedPassword);
            }
            if (data.role) {
                updates.push('role = ?');
                values.push(data.role);
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
            (0, init_1.saveDatabase)();
            const result = db.exec('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id]);
            const users = resultToObject(result[0].values, result[0].columns);
            const user = users[0];
            return { success: true, data: user, message: 'User updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update user',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.run('DELETE FROM users WHERE id = ?', [id]);
            (0, init_1.saveDatabase)();
            return { success: true, message: 'User deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete user',
                error: error.message,
            };
        }
    }
}
exports.UserService = UserService;
