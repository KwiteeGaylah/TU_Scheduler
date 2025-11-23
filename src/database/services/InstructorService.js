"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructorService = void 0;
const init_1 = require("../init");
class InstructorService {
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const instructors = db.prepare('SELECT * FROM instructors ORDER BY name').all();
            return { success: true, data: instructors };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch instructors',
                error: error.message,
            };
        }
    }
    static async getById(id) {
        try {
            const db = (0, init_1.getDatabase)();
            const instructor = db.prepare('SELECT * FROM instructors WHERE id = ?').get(id);
            if (!instructor) {
                return { success: false, message: 'Instructor not found' };
            }
            return { success: true, data: instructor };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch instructor',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db
                .prepare('INSERT INTO instructors (name, email, phone, department) VALUES (?, ?, ?, ?)')
                .run(data.name, data.email || null, data.phone || null, data.department || null);
            const instructor = db
                .prepare('SELECT * FROM instructors WHERE id = ?')
                .get(result.lastInsertRowid);
            return { success: true, data: instructor, message: 'Instructor created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create instructor',
                error: error.message,
            };
        }
    }
    static async update(id, data) {
        try {
            const db = (0, init_1.getDatabase)();
            const updates = [];
            const values = [];
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
            db.prepare(`UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            const instructor = db.prepare('SELECT * FROM instructors WHERE id = ?').get(id);
            return { success: true, data: instructor, message: 'Instructor updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update instructor',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.prepare('DELETE FROM instructors WHERE id = ?').run(id);
            return { success: true, message: 'Instructor deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete instructor',
                error: error.message,
            };
        }
    }
}
exports.InstructorService = InstructorService;
