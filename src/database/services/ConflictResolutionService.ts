import { getDatabase } from '../init';
import type { ScheduleCreateInput, ScheduleWithDetails, Room, ApiResponse } from '../../shared/types';

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

interface AlternativeTime {
  start_time: string;
  end_time: string;
  days: string[]; // Support multiple days
  conflicts: number;
  section_id?: number; // Include section to maintain context
}

interface AlternativeRoom {
  room_id: number;
  room_name: string;
  capacity: number;
  conflicts: number;
}

interface AutoResolveResult {
  course_id: number;
  instructor_id: number;
  room_id: number;
  section_id: number;
  days: string[]; // Multiple days
  start_time: string;
  end_time: string;
  available_space: number;
}

export class ConflictResolutionService {
  /**
   * Suggest alternative time slots that have fewer or no conflicts
   * Suggests 2-day combinations like Mon/Wed, Tue/Thu
   */
  static async suggestAlternativeTimes(
    scheduleData: ScheduleCreateInput,
    excludeIds: number[] = []
  ): Promise<ApiResponse<AlternativeTime[]>> {
    try {
      const alternatives: AlternativeTime[] = [];
      
      // Common 2-day patterns used in scheduling
      const dayPatterns = [
        ['Monday', 'Wednesday'],
        ['Tuesday', 'Thursday'],
        ['Monday', 'Friday'],
        ['Tuesday', 'Friday'],
        ['Wednesday', 'Friday'],
        ['Thursday', 'Saturday'],
        ['Monday', 'Thursday'],
        ['Tuesday', 'Wednesday'],
        ['Wednesday', 'Thursday'],
        // Single days for flexibility
        ['Monday'],
        ['Tuesday'],
        ['Wednesday'],
        ['Thursday'],
        ['Friday'],
        ['Saturday'],
      ];
      
      const timeSlots = this.generateTimeSlots('08:00', '17:00', 90); // 1.5 hour intervals

      // Get the duration of the original schedule
      const [startHour, startMin] = scheduleData.start_time.split(':').map(Number);
      const [endHour, endMin] = scheduleData.end_time.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      for (const dayPattern of dayPatterns) {
        for (const slot of timeSlots) {
          const endTime = this.addMinutes(slot, duration);
          
          // Skip if it goes beyond 18:00
          if (endTime > '18:00') continue;

          // Check conflicts for ALL days in this pattern
          let totalConflicts = 0;
          for (const day of dayPattern) {
            const testSchedule = {
              ...scheduleData,
              day: day as any,
              start_time: slot,
              end_time: endTime,
            };
            totalConflicts += await this.countConflicts(testSchedule, excludeIds);
          }
          
          alternatives.push({
            start_time: slot,
            end_time: endTime,
            days: dayPattern,
            conflicts: totalConflicts,
            section_id: scheduleData.section_id,
          });
        }
      }

      // Sort by conflicts (fewest first), prioritize 2-day patterns, then by time
      alternatives.sort((a, b) => {
        if (a.conflicts !== b.conflicts) return a.conflicts - b.conflicts;
        // Prefer 2-day patterns
        if (a.days.length !== b.days.length) return b.days.length - a.days.length;
        return a.start_time.localeCompare(b.start_time);
      });

      // Return top 15 alternatives
      return {
        success: true,
        message: 'Alternative times found',
        data: alternatives.slice(0, 15),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to suggest alternative times',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Suggest alternative rooms that have fewer or no conflicts
   */
  static async suggestAlternativeRooms(
    scheduleData: ScheduleCreateInput,
    excludeIds: number[] = []
  ): Promise<ApiResponse<AlternativeRoom[]>> {
    try {
      const alternatives: AlternativeRoom[] = [];

      // Get all rooms
      const db = getDatabase();
      const result = db.exec('SELECT * FROM rooms ORDER BY name');
      const rooms = result.length > 0 ? resultToObject(result[0].values, result[0].columns) as Room[] : [];

      for (const room of rooms) {
        // Skip current room
        if (room.id === scheduleData.room_id) continue;

        // Check conflicts for this room
        const testSchedule = {
          ...scheduleData,
          room_id: room.id,
          available_space: room.capacity,
        };

        const conflictCount = await this.countConflicts(testSchedule, excludeIds);

        alternatives.push({
          room_id: room.id,
          room_name: room.name,
          capacity: room.capacity,
          conflicts: conflictCount,
        });
      }

      // Sort by conflicts (fewest first), then by capacity (largest first)
      alternatives.sort((a, b) => {
        if (a.conflicts !== b.conflicts) return a.conflicts - b.conflicts;
        return b.capacity - a.capacity;
      });

      return {
        success: true,
        message: 'Alternative rooms found',
        data: alternatives,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to suggest alternative rooms',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Automatically find and return a conflict-free schedule slot
   * Returns 2-day pattern schedule
   */
  static async autoResolve(
    scheduleData: ScheduleCreateInput,
    excludeIds: number[] = []
  ): Promise<ApiResponse<AutoResolveResult | null>> {
    try {
      // Common 2-day patterns used in scheduling
      const dayPatterns = [
        ['Monday', 'Wednesday'],
        ['Tuesday', 'Thursday'],
        ['Monday', 'Friday'],
        ['Tuesday', 'Friday'],
        ['Wednesday', 'Friday'],
        ['Thursday', 'Saturday'],
        ['Monday', 'Thursday'],
        ['Tuesday', 'Wednesday'],
      ];
      
      const timeSlots = this.generateTimeSlots('08:00', '17:00', 30); // Try every 30 minutes

      // Get the duration of the original schedule
      const [startHour, startMin] = scheduleData.start_time.split(':').map(Number);
      const [endHour, endMin] = scheduleData.end_time.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      // Get all rooms sorted by capacity
      const db = getDatabase();
      const result = db.exec('SELECT * FROM rooms ORDER BY capacity DESC');
      const rooms = result.length > 0 ? resultToObject(result[0].values, result[0].columns) as Room[] : [];

      // Try to find a conflict-free slot for 2-day patterns
      for (const dayPattern of dayPatterns) {
        for (const slot of timeSlots) {
          const endTime = this.addMinutes(slot, duration);
          
          // Skip if it goes beyond 18:00
          if (endTime > '18:00') continue;

          // Try each room
          for (const room of rooms) {
            // Check conflicts for ALL days in pattern
            let hasConflict = false;
            for (const day of dayPattern) {
              const testSchedule = {
                ...scheduleData,
                room_id: room.id,
                day: day as any,
                start_time: slot,
                end_time: endTime,
                available_space: room.capacity,
              };

              const conflictCount = await this.countConflicts(testSchedule, excludeIds);
              if (conflictCount > 0) {
                hasConflict = true;
                break;
              }
            }

            // Found a conflict-free slot for ALL days!
            if (!hasConflict) {
              return {
                success: true,
                message: `Conflict-free slot found: ${dayPattern.join('/')} at ${slot}-${endTime} in ${room.name}`,
                data: {
                  course_id: scheduleData.course_id,
                  instructor_id: scheduleData.instructor_id,
                  room_id: room.id,
                  section_id: scheduleData.section_id,
                  days: dayPattern,
                  start_time: slot,
                  end_time: endTime,
                  available_space: room.capacity,
                },
              };
            }
          }
        }
      }

      // No conflict-free slot found
      return {
        success: false,
        message: 'No conflict-free slot available for 2-day pattern',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to auto-resolve conflicts',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Count conflicts for a given schedule
   */
  private static async countConflicts(
    scheduleData: ScheduleCreateInput,
    excludeIds: number[] = []
  ): Promise<number> {
    const db = getDatabase();
    let conflictCount = 0;

    const excludeClause = excludeIds.length > 0 
      ? `AND s.id NOT IN (${excludeIds.join(',')})`
      : '';

    // Simplified time overlap: (start1 < end2) AND (end1 > start2)
    const overlapCondition = `(s.start_time < '${scheduleData.end_time}' AND s.end_time > '${scheduleData.start_time}')`;

    // Check instructor conflicts
    const instructorQuery = `
      SELECT COUNT(*) as count
      FROM schedules s
      WHERE s.instructor_id = ${scheduleData.instructor_id}
        AND s.day = '${scheduleData.day}'
        AND ${overlapCondition}
        ${excludeClause}
    `;
    const instructorResult = db.exec(instructorQuery);
    if (instructorResult.length > 0 && instructorResult[0].values[0][0]) {
      conflictCount += instructorResult[0].values[0][0] as number;
    }

    // Check room conflicts
    const roomQuery = `
      SELECT COUNT(*) as count
      FROM schedules s
      WHERE s.room_id = ${scheduleData.room_id}
        AND s.day = '${scheduleData.day}'
        AND ${overlapCondition}
        ${excludeClause}
    `;
    const roomResult = db.exec(roomQuery);
    if (roomResult.length > 0 && roomResult[0].values[0][0]) {
      conflictCount += roomResult[0].values[0][0] as number;
    }

    // Check section conflicts - CRITICAL for proper conflict resolution
    // Must check both section_id AND course_id since sections are course-specific
    const sectionQuery = `
      SELECT COUNT(*) as count
      FROM schedules s
      WHERE s.section_id = ${scheduleData.section_id}
        AND s.course_id = ${scheduleData.course_id}
        AND s.day = '${scheduleData.day}'
        AND ${overlapCondition}
        ${excludeClause}
    `;
    const sectionResult = db.exec(sectionQuery);
    if (sectionResult.length > 0 && sectionResult[0].values[0][0]) {
      conflictCount += sectionResult[0].values[0][0] as number;
    }

    // Check for duplicate section time (same course-instructor-section with different time)
    // This prevents suggesting a time that would create a duplicate section assignment
    const duplicateQuery = `
      SELECT COUNT(*) as count
      FROM schedules s
      WHERE s.course_id = ${scheduleData.course_id}
        AND s.instructor_id = ${scheduleData.instructor_id}
        AND s.section_id = ${scheduleData.section_id}
        AND (s.start_time != '${scheduleData.start_time}' OR s.end_time != '${scheduleData.end_time}')
        ${excludeClause}
    `;
    const duplicateResult = db.exec(duplicateQuery);
    if (duplicateResult.length > 0 && duplicateResult[0].values[0][0]) {
      conflictCount += duplicateResult[0].values[0][0] as number;
    }

    return conflictCount;
  }

  /**
   * Generate time slots between start and end times
   */
  private static generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
    const slots: string[] = [];
    let current = startTime;

    while (current < endTime) {
      slots.push(current);
      current = this.addMinutes(current, intervalMinutes);
    }

    return slots;
  }

  /**
   * Add minutes to a time string (HH:MM format)
   */
  private static addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }
}
