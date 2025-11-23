"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const init_1 = require("../init");
class RoomService {
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const rooms = db.prepare('SELECT * FROM rooms ORDER BY name').all();
            return { success: true, data: rooms };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch rooms',
                error: error.message,
            };
        }
    }
    static async getById(id) {
        try {
            const db = (0, init_1.getDatabase)();
            const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
            if (!room) {
                return { success: false, message: 'Room not found' };
            }
            return { success: true, data: room };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch room',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            const db = (0, init_1.getDatabase)();
            const result = db
                .prepare('INSERT INTO rooms (name, capacity, building, equipment) VALUES (?, ?, ?, ?)')
                .run(data.name, data.capacity, data.building || null, data.equipment || null);
            const room = db
                .prepare('SELECT * FROM rooms WHERE id = ?')
                .get(result.lastInsertRowid);
            return { success: true, data: room, message: 'Room created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create room',
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
            db.prepare(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
            return { success: true, data: room, message: 'Room updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update room',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
            return { success: true, message: 'Room deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete room',
                error: error.message,
            };
        }
    }
}
exports.RoomService = RoomService;
