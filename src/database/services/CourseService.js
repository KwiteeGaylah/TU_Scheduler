"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const init_1 = require("../init");
class CourseService {
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const courses = db.prepare('SELECT * FROM courses ORDER BY code').all();
            return { success: true, data: courses };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch courses',
                error: error.message,
            };
        }
    }
    static async getById(id) {
        try {
            const db = (0, init_1.getDatabase)();
            const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
            if (!course) {
                return { success: false, message: 'Course not found' };
            }
            return { success: true, data: course };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch course',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db
                .prepare('INSERT INTO courses (code, title, credits, department, description) VALUES (?, ?, ?, ?, ?)')
                .run(data.code, data.title, data.credits, data.department || null, data.description || null);
            const course = db
                .prepare('SELECT * FROM courses WHERE id = ?')
                .get(result.lastInsertRowid);
            return { success: true, data: course, message: 'Course created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create course',
                error: error.message,
            };
        }
    }
    static async update(id, data) {
        try {
            const db = (0, init_1.getDatabase)();
            const updates = [];
            const values = [];
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
            db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
            return { success: true, data: course, message: 'Course updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update course',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.prepare('DELETE FROM courses WHERE id = ?').run(id);
            return { success: true, message: 'Course deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete course',
                error: error.message,
            };
        }
    }
}
exports.CourseService = CourseService;
