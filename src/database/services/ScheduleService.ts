import { getDatabase, saveDatabase } from '../init';
import type {
  Schedule,
  ScheduleWithDetails,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  ScheduleFilters,
  Conflict,
  ApiResponse,
} from '../../shared/types';
import { SettingsService } from './SettingsService';

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

export class ScheduleService {
  static async getAll(): Promise<ApiResponse<ScheduleWithDetails[]>> {
    try {
      const db = getDatabase();
      
      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';
      
      const stmt = db.prepare(
        `SELECT 
          s.*,
          c.code as course_code,
          c.title as course_title,
          c.credits as course_credits,
          i.name as instructor_name,
          r.name as room_name,
          r.capacity as room_capacity,
          sec.name as section_name
        FROM schedules s
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN instructors i ON s.instructor_id = i.id
        LEFT JOIN rooms r ON s.room_id = r.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.semester = ?
        ORDER BY s.day, s.start_time`
      );
      stmt.bind([activeSemester]);

      const schedules: ScheduleWithDetails[] = [];
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const schedule: any = {};
        columns.forEach((col, idx) => {
          schedule[col] = values[idx];
        });
        schedules.push(schedule as ScheduleWithDetails);
      }
      stmt.free();

      return { success: true, data: schedules };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch schedules',
        error: (error as Error).message,
      };
    }
  }

  static async getById(id: number): Promise<ApiResponse<ScheduleWithDetails>> {
    try {
      const db = getDatabase();
      const stmt = db.prepare(
        `SELECT 
          s.*,
          c.code as course_code,
          c.title as course_title,
          c.credits as course_credits,
          i.name as instructor_name,
          r.name as room_name,
          r.capacity as room_capacity,
          sec.name as section_name
        FROM schedules s
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN instructors i ON s.instructor_id = i.id
        LEFT JOIN rooms r ON s.room_id = r.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.id = ?`
      );
      stmt.bind([id]);
      stmt.step();

      const columns = stmt.getColumnNames();
      const values = stmt.get();
      stmt.free();

      if (!values || values.length === 0) {
        return { success: false, message: 'Schedule not found' };
      }

      const schedule: any = {};
      columns.forEach((col, idx) => {
        schedule[col] = values[idx];
      });

      return { success: true, data: schedule as ScheduleWithDetails };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch schedule',
        error: (error as Error).message,
      };
    }
  }

  static async create(data: ScheduleCreateInput): Promise<ApiResponse<Schedule>> {
    try {
      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';
      
      // Check for conflicts before creating
      const conflicts = await this.detectConflicts(data);
      if (conflicts.data && conflicts.data.length > 0) {
        return {
          success: false,
          message: 'Schedule conflicts detected',
          data: conflicts.data as any,
        };
      }

      const db = getDatabase();
      const stmt = db.prepare(
        `INSERT INTO schedules 
        (course_id, instructor_id, room_id, section_id, day, start_time, end_time, available_space, notes, semester) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run([
        data.course_id,
        data.instructor_id,
        data.room_id,
        data.section_id,
        data.day,
        data.start_time,
        data.end_time,
        data.available_space || null,
        data.notes || null,
        activeSemester
      ]);
      stmt.free();
      saveDatabase();

      // Query the created schedule
      const selectStmt = db.prepare(
        'SELECT * FROM schedules WHERE course_id = ? AND day = ? AND start_time = ? AND semester = ? ORDER BY id DESC LIMIT 1'
      );
      selectStmt.bind([data.course_id, data.day, data.start_time, activeSemester]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const values = selectStmt.get();
      selectStmt.free();
      
      if (!values || values.length === 0) {
        throw new Error('Failed to retrieve created schedule');
      }
      
      const schedule: any = {};
      columns.forEach((col, idx) => {
        schedule[col] = values[idx];
      });

      return { success: true, data: schedule as Schedule, message: 'Schedule created successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create schedule',
        error: (error as Error).message,
      };
    }
  }

  static async update(id: number, data: ScheduleUpdateInput): Promise<ApiResponse<Schedule>> {
    try {
      const db = getDatabase();

      // Get existing schedule
      const existingStmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
      existingStmt.bind([id]);
      existingStmt.step();
      const existingCols = existingStmt.getColumnNames();
      const existingVals = existingStmt.get();
      existingStmt.free();
      
      if (!existingVals || existingVals.length === 0) {
        return { success: false, message: 'Schedule not found' };
      }
      
      const existing: any = {};
      existingCols.forEach((col, idx) => {
        existing[col] = existingVals[idx];
      });

      // Merge with existing data for conflict check
      const mergedData = { ...existing, ...data };
      const conflicts = await this.detectConflicts(mergedData, [id]);
      if (conflicts.data && conflicts.data.length > 0) {
        return {
          success: false,
          message: 'Schedule conflicts detected',
          data: conflicts.data as any,
        };
      }

      const updates: string[] = [];
      const values: any[] = [];

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

      const updateStmt = db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`);
      updateStmt.run(values);
      updateStmt.free();
      saveDatabase();

      const selectStmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
      selectStmt.bind([id]);
      selectStmt.step();
      
      const columns = selectStmt.getColumnNames();
      const vals = selectStmt.get();
      selectStmt.free();
      
      const schedule: any = {};
      columns.forEach((col, idx) => {
        schedule[col] = vals[idx];
      });

      return { success: true, data: schedule, message: 'Schedule updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update schedule',
        error: (error as Error).message,
      };
    }
  }

  static async delete(id: number): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      saveDatabase();

      return { success: true, message: 'Schedule deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete schedule',
        error: (error as Error).message,
      };
    }
  }

  static async cleanupOrphaned(): Promise<ApiResponse> {
    try {
      const db = getDatabase();
      
      // Delete schedules where the course no longer exists
      const stmt = db.prepare(
        `DELETE FROM schedules 
         WHERE course_id NOT IN (SELECT id FROM courses)
         OR instructor_id NOT IN (SELECT id FROM instructors)
         OR room_id NOT IN (SELECT id FROM rooms)
         OR section_id NOT IN (SELECT id FROM sections)`
      );
      stmt.run();
      const changesResult = db.exec('SELECT changes()');
      const deletedCount = changesResult[0]?.values[0]?.[0] as number || 0;
      stmt.free();
      saveDatabase();

      const message = deletedCount > 0
        ? `Cleaned up ${deletedCount} orphaned schedule(s)`
        : 'No orphaned schedules found';
      
      return { success: true, message, data: { deletedCount } };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cleanup orphaned schedules',
        error: (error as Error).message,
      };
    }
  }

  static async detectConflicts(
    data: ScheduleCreateInput | ScheduleUpdateInput,
    excludeIds?: number[]
  ): Promise<ApiResponse<Conflict[]>> {
    try {
      const db = getDatabase();
      const conflicts: Conflict[] = [];

      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';

      // Build WHERE clause for time overlap check
      // Two time ranges overlap if: start1 < end2 AND start2 < end1
      let whereClause = 'WHERE day = ? AND start_time < ? AND end_time > ? AND s.semester = ?';
      const params: any[] = [
        data.day,
        data.end_time,  // end of new schedule
        data.start_time,  // start of new schedule
        activeSemester
      ];

      if (excludeIds && excludeIds.length > 0) {
        const placeholders = excludeIds.map(() => '?').join(',');
        whereClause += ` AND s.id NOT IN (${placeholders})`;
        params.push(...excludeIds);
      }

      // Check instructor conflicts
      if (data.instructor_id) {
        const instructorQuery = `
          SELECT s.*, i.name as resource_name
          FROM schedules s
          JOIN instructors i ON s.instructor_id = i.id
          ${whereClause} AND instructor_id = ?
        `;
        const stmt = db.prepare(instructorQuery);
        stmt.bind([...params, data.instructor_id]);
        
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const conflict: any = { conflict_type: 'Instructor' };
          columns.forEach((col, idx) => {
            conflict[col] = values[idx];
          });
          conflicts.push(conflict as Conflict);
        }
        stmt.free();
      }

      // Check room conflicts
      if (data.room_id) {
        const roomQuery = `
          SELECT s.*, r.name as resource_name
          FROM schedules s
          JOIN rooms r ON s.room_id = r.id
          ${whereClause} AND room_id = ?
        `;
        const stmt = db.prepare(roomQuery);
        stmt.bind([...params, data.room_id]);
        
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const conflict: any = { conflict_type: 'Room' };
          columns.forEach((col, idx) => {
            conflict[col] = values[idx];
          });
          conflicts.push(conflict as Conflict);
        }
        stmt.free();
      }

      // Check section conflicts on same day at same time
      // Same section of the SAME COURSE cannot be scheduled at the same time on the same day (student conflict)
      // Different courses can have the same section number without conflict
      if (data.section_id && data.course_id) {
        const sectionQuery = `
          SELECT s.*, sec.name as resource_name
          FROM schedules s
          JOIN sections sec ON s.section_id = sec.id
          ${whereClause} AND section_id = ? AND course_id = ?
        `;
        const stmt = db.prepare(sectionQuery);
        stmt.bind([...params, data.section_id, data.course_id]);
        
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const conflict: any = { conflict_type: 'Section' };
          columns.forEach((col, idx) => {
            conflict[col] = values[idx];
          });
          conflicts.push(conflict as Conflict);
        }
        stmt.free();
      }

      // Additional check: Same course-instructor-section with different times
      // A section should have consistent times across all its days
      // This prevents: Mon 9:40-11:20 and Wed 13:00-14:40 for the same section (inconsistent)
      // This allows: Adding Mon when Wed already exists with same time (consistent multi-day)
      // But prevents: Creating entirely new schedule when section already exists with different time
      if (data.course_id && data.instructor_id && data.section_id && data.start_time && data.end_time) {
        let duplicateQuery = `
          SELECT s.*, 'Duplicate Section Time' as resource_name
          FROM schedules s
          WHERE s.course_id = ? AND s.instructor_id = ? AND s.section_id = ?
          AND (s.start_time != ? OR s.end_time != ?)
        `;
        const dupParams: any[] = [data.course_id, data.instructor_id, data.section_id, data.start_time, data.end_time];
        if (excludeIds && excludeIds.length > 0) {
          const placeholders = excludeIds.map(() => '?').join(',');
          duplicateQuery += ` AND s.id NOT IN (${placeholders})`;
          dupParams.push(...excludeIds);
        }
        
        const dupStmt = db.prepare(duplicateQuery);
        dupStmt.bind(dupParams);
        
        while (dupStmt.step()) {
          const columns = dupStmt.getColumnNames();
          const values = dupStmt.get();
          const conflict: any = { conflict_type: 'Duplicate Time Slot' };
          columns.forEach((col, idx) => {
            conflict[col] = values[idx];
          });
          conflicts.push(conflict as Conflict);
        }
        dupStmt.free();
      }

      // Additional check: Course-Section combination can only be assigned to ONE instructor
      // Prevent same course-section from being assigned to different instructors
      if (data.course_id && data.section_id && data.instructor_id) {
        let courseSecQuery = `
          SELECT s.*, i.name as resource_name, 'Course-Section Already Assigned' as conflict_message
          FROM schedules s
          JOIN instructors i ON s.instructor_id = i.id
          WHERE s.course_id = ? AND s.section_id = ? AND s.instructor_id != ?
        `;
        const courseSecParams: any[] = [data.course_id, data.section_id, data.instructor_id];
        if (excludeIds && excludeIds.length > 0) {
          const placeholders = excludeIds.map(() => '?').join(',');
          courseSecQuery += ` AND s.id NOT IN (${placeholders})`;
          courseSecParams.push(...excludeIds);
        }
        
        const csStmt = db.prepare(courseSecQuery);
        csStmt.bind(courseSecParams);
        
        while (csStmt.step()) {
          const columns = csStmt.getColumnNames();
          const values = csStmt.get();
          const conflict: any = { conflict_type: 'Course-Section Assignment' };
          columns.forEach((col, idx) => {
            conflict[col] = values[idx];
          });
          conflicts.push(conflict as Conflict);
        }
        csStmt.free();
      }

      return { success: true, data: conflicts };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to detect conflicts',
        error: (error as Error).message,
      };
    }
  }

  static async getByFilters(filters: ScheduleFilters): Promise<ApiResponse<ScheduleWithDetails[]>> {
    try {
      const db = getDatabase();
      
      // Get active semester
      const semesterResponse = SettingsService.getActiveSemester();
      const activeSemester = semesterResponse.success && semesterResponse.data 
        ? semesterResponse.data 
        : 'Semester 1';
      
      const conditions: string[] = ['s.semester = ?'];
      const values: any[] = [activeSemester];

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

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const query = `
        SELECT 
          s.*,
          c.code as course_code,
          c.title as course_title,
          c.credits as course_credits,
          i.name as instructor_name,
          r.name as room_name,
          r.capacity as room_capacity,
          sec.name as section_name
        FROM schedules s
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN instructors i ON s.instructor_id = i.id
        LEFT JOIN rooms r ON s.room_id = r.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        ${whereClause}
        ORDER BY s.day, s.start_time
      `;

      const schedules: ScheduleWithDetails[] = [];
      const stmt = db.prepare(query);
      if (values.length > 0) {
        stmt.bind(values);
      }
      
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const vals = stmt.get();
        const schedule: any = {};
        columns.forEach((col, idx) => {
          schedule[col] = vals[idx];
        });
        schedules.push(schedule as ScheduleWithDetails);
      }
      stmt.free();

      return { success: true, data: schedules };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch schedules',
        error: (error as Error).message,
      };
    }
  }
}
