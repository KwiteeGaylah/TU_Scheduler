"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionService = void 0;
const init_1 = require("../init");
class SectionService {
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const sections = db.prepare('SELECT * FROM sections ORDER BY name').all();
            return { success: true, data: sections };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch sections',
                error: error.message,
            };
        }
    }
    static async getById(id) {
        try {
            const db = (0, init_1.getDatabase)();
            const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
            if (!section) {
                return { success: false, message: 'Section not found' };
            }
            return { success: true, data: section };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch section',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db
                .prepare('INSERT INTO sections (name, description) VALUES (?, ?)')
                .run(data.name, data.description || null);
            const section = db
                .prepare('SELECT * FROM sections WHERE id = ?')
                .get(result.lastInsertRowid);
            return { success: true, data: section, message: 'Section created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create section',
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
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            db.prepare(`UPDATE sections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
            return { success: true, data: section, message: 'Section updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update section',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.prepare('DELETE FROM sections WHERE id = ?').run(id);
            return { success: true, message: 'Section deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete section',
                error: error.message,
            };
        }
    }
}
exports.SectionService = SectionService;
