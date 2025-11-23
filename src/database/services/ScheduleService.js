"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const init_1 = require("../init");
class ScheduleService {
    static async getAll() {
        try {
            const db = (0, init_1.getDatabase)();
            const schedules = db
                .prepare(`SELECT 
            s.*,
            c.code as course_code,
            c.title as course_title,
            c.credits as course_credits,
            i.name as instructor_name,
            r.name as room_name,
            r.capacity as room_capacity,
            sec.name as section_name
          FROM schedules s
          JOIN courses c ON s.course_id = c.id
          JOIN instructors i ON s.instructor_id = i.id
          JOIN rooms r ON s.room_id = r.id
          JOIN sections sec ON s.section_id = sec.id
          ORDER BY s.day, s.start_time`)
                .all();
            return { success: true, data: schedules };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch schedules',
                error: error.message,
            };
        }
    }
    static async getById(id) {
        try {
            const db = (0, init_1.getDatabase)();
            const schedule = db
                .prepare(`SELECT 
            s.*,
            c.code as course_code,
            c.title as course_title,
            c.credits as course_credits,
            i.name as instructor_name,
            r.name as room_name,
            r.capacity as room_capacity,
            sec.name as section_name
          FROM schedules s
          JOIN courses c ON s.course_id = c.id
          JOIN instructors i ON s.instructor_id = i.id
          JOIN rooms r ON s.room_id = r.id
          JOIN sections sec ON s.section_id = sec.id
          WHERE s.id = ?`)
                .get(id);
            if (!schedule) {
                return { success: false, message: 'Schedule not found' };
            }
            return { success: true, data: schedule };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch schedule',
                error: error.message,
            };
        }
    }
    static async create(data) {
        try {
            // Check for conflicts before creating
            const conflicts = await this.detectConflicts(data);
            if (conflicts.data && conflicts.data.length > 0) {
                return {
                    success: false,
                    message: 'Schedule conflicts detected',
                    data: conflicts.data,
                };
            }
            const db = (0, init_1.getDatabase)();
            const result = db
                .prepare(`INSERT INTO schedules 
          (course_id, instructor_id, room_id, section_id, day, start_time, end_time, available_space, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .run(data.course_id, data.instructor_id, data.room_id, data.section_id, data.day, data.start_time, data.end_time, data.available_space || null, data.notes || null);
            const schedule = db
                .prepare('SELECT * FROM schedules WHERE id = ?')
                .get(result.lastInsertRowid);
            return { success: true, data: schedule, message: 'Schedule created successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to create schedule',
                error: error.message,
            };
        }
    }
    static async update(id, data) {
        try {
            const db = (0, init_1.getDatabase)();
            // Get existing schedule
            const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
            if (!existing) {
                return { success: false, message: 'Schedule not found' };
            }
            // Merge with existing data for conflict check
            const mergedData = { ...existing, ...data };
            const conflicts = await this.detectConflicts(mergedData, id);
            if (conflicts.data && conflicts.data.length > 0) {
                return {
                    success: false,
                    message: 'Schedule conflicts detected',
                    data: conflicts.data,
                };
            }
            const updates = [];
            const values = [];
            if (data.course_id !== undefined) {
                updates.push('course_id = ?');
                values.push(data.course_id);
            }
            if (data.instructor_id !== undefined) {
                updates.push('instructor_id = ?');
                values.push(data.instructor_id);
            }
            if (data.room_id !== undefined) {
                updates.push('room_id = ?');
                values.push(data.room_id);
            }
            if (data.section_id !== undefined) {
                updates.push('section_id = ?');
                values.push(data.section_id);
            }
            if (data.day) {
                updates.push('day = ?');
                values.push(data.day);
            }
            if (data.start_time) {
                updates.push('start_time = ?');
                values.push(data.start_time);
            }
            if (data.end_time) {
                updates.push('end_time = ?');
                values.push(data.end_time);
            }
            if (data.available_space !== undefined) {
                updates.push('available_space = ?');
                values.push(data.available_space);
            }
            if (data.notes !== undefined) {
                updates.push('notes = ?');
                values.push(data.notes);
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
            return { success: true, data: schedule, message: 'Schedule updated successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update schedule',
                error: error.message,
            };
        }
    }
    static async delete(id) {
        try {
            const db = (0, init_1.getDatabase)();
            db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
            return { success: true, message: 'Schedule deleted successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to delete schedule',
                error: error.message,
            };
        }
    }
    static async detectConflicts(scheduleData, excludeId) {
        try {
            const db = (0, init_1.getDatabase)();
            const conflicts = [];
            const baseQuery = `
        SELECT * FROM schedules 
        WHERE day = ? 
        AND id != ?
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `;
            // Check instructor conflicts
            const instructorConflicts = db
                .prepare(`${baseQuery} AND instructor_id = ?`)
                .all(scheduleData.day, excludeId || 0, scheduleData.end_time, scheduleData.start_time, scheduleData.end_time, scheduleData.start_time, scheduleData.start_time, scheduleData.end_time, scheduleData.instructor_id);
            if (instructorConflicts.length > 0) {
                conflicts.push({
                    type: 'instructor',
                    message: 'Instructor is already scheduled at this time',
                    details: instructorConflicts,
                });
            }
            // Check room conflicts
            const roomConflicts = db
                .prepare(`${baseQuery} AND room_id = ?`)
                .all(scheduleData.day, excludeId || 0, scheduleData.end_time, scheduleData.start_time, scheduleData.end_time, scheduleData.start_time, scheduleData.start_time, scheduleData.end_time, scheduleData.room_id);
            if (roomConflicts.length > 0) {
                conflicts.push({
                    type: 'room',
                    message: 'Room is already booked at this time',
                    details: roomConflicts,
                });
            }
            // Check section conflicts
            const sectionConflicts = db
                .prepare(`${baseQuery} AND section_id = ?`)
                .all(scheduleData.day, excludeId || 0, scheduleData.end_time, scheduleData.start_time, scheduleData.end_time, scheduleData.start_time, scheduleData.start_time, scheduleData.end_time, scheduleData.section_id);
            if (sectionConflicts.length > 0) {
                conflicts.push({
                    type: 'section',
                    message: 'Section has another class scheduled at this time',
                    details: sectionConflicts,
                });
            }
            return { success: true, data: conflicts };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to detect conflicts',
                error: error.message,
            };
        }
    }
    static async getByFilters(filters) {
        try {
            const db = (0, init_1.getDatabase)();
            const conditions = [];
            const values = [];
            if (filters.course_id) {
                conditions.push('s.course_id = ?');
                values.push(filters.course_id);
            }
            if (filters.instructor_id) {
                conditions.push('s.instructor_id = ?');
                values.push(filters.instructor_id);
            }
            if (filters.room_id) {
                conditions.push('s.room_id = ?');
                values.push(filters.room_id);
            }
            if (filters.section_id) {
                conditions.push('s.section_id = ?');
                values.push(filters.section_id);
            }
            if (filters.day) {
                conditions.push('s.day = ?');
                values.push(filters.day);
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const schedules = db
                .prepare(`SELECT 
            s.*,
            c.code as course_code,
            c.title as course_title,
            c.credits as course_credits,
            i.name as instructor_name,
            r.name as room_name,
            r.capacity as room_capacity,
            sec.name as section_name
          FROM schedules s
          JOIN courses c ON s.course_id = c.id
          JOIN instructors i ON s.instructor_id = i.id
          JOIN rooms r ON s.room_id = r.id
          JOIN sections sec ON s.section_id = sec.id
          ${whereClause}
          ORDER BY s.day, s.start_time`)
                .all(...values);
            return { success: true, data: schedules };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch schedules',
                error: error.message,
            };
        }
    }
}
exports.ScheduleService = ScheduleService;
