import Papa from 'papaparse';
import type { ApiResponse, Course, Instructor, Room, Section } from '../../shared/types';
import { ScheduleService } from './ScheduleService';
import { SettingsService } from './SettingsService';
import * as fs from 'fs';

interface ImportScheduleRow {
  course_code: string;
  course_title?: string;
  credits?: string;
  section_name: string;
  instructor_name: string;
  room_name: string;
  days: string; // Comma-separated: "Monday, Tuesday"
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  available_space?: string;
}

interface ValidationResult {
  rowNum: number;
  day: string;
  course_code: string;
  section_name: string;
  instructor_name: string;
  conflicts: string[];
  scheduleData: any;
}

export class ImportService {
  /**
   * Validate CSV schedules without importing - check for conflicts
   */
  static async validateCSV(
    filePath: string,
    courses: Course[],
    instructors: Instructor[],
    rooms: Room[],
    sections: Section[]
  ): Promise<ApiResponse<{ valid: ValidationResult[]; invalid: string[]; conflicts: ValidationResult[] }>> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      return new Promise((resolve) => {
        Papa.parse<ImportScheduleRow>(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          complete: async (results) => {
            const invalid: string[] = [];
            const valid: ValidationResult[] = [];
            const conflicts: ValidationResult[] = [];

            for (let i = 0; i < results.data.length; i++) {
              const row = results.data[i];
              const rowNum = i + 2;

              try {
                // Clean and normalize all string values - remove all whitespace variations
                const cleanString = (str: string): string => {
                  return (str || '')
                    .trim()
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces
                };

                const courseCode = cleanString(row.course_code);
                const instructorName = cleanString(row.instructor_name);
                const roomName = cleanString(row.room_name);
                const sectionName = cleanString(row.section_name);

                // Find matching records with normalized comparison
                const course = courses.find(c => cleanString(c.code).toLowerCase() === courseCode.toLowerCase());
                if (!course) {
                  const suggestions = courses.map(c => `"${c.code}"`).join(', ');
                  invalid.push(`Row ${rowNum}: Course code "${courseCode}" not found.\n  → Available courses: ${suggestions}`);
                  continue;
                }

                // First try exact match
                let instructor = instructors.find(ins => cleanString(ins.name).toLowerCase() === instructorName.toLowerCase());
                
                // If exact match fails, try fuzzy match (remove all non-alphanumeric for comparison)
                if (!instructor) {
                  const fuzzyMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                  instructor = instructors.find(ins => fuzzyMatch(ins.name) === fuzzyMatch(instructorName));
                }
                
                if (!instructor) {
                  // Find the closest match for better error message
                  const fuzzyMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const csvFuzzy = fuzzyMatch(instructorName);
                  const closeMatch = instructors.find(ins => {
                    const dbFuzzy = fuzzyMatch(ins.name);
                    // Check if names are very similar (same length, mostly same characters)
                    if (Math.abs(csvFuzzy.length - dbFuzzy.length) <= 2) {
                      let diff = 0;
                      for (let i = 0; i < Math.min(csvFuzzy.length, dbFuzzy.length); i++) {
                        if (csvFuzzy[i] !== dbFuzzy[i]) diff++;
                      }
                      return diff <= 2; // Allow up to 2 character differences
                    }
                    return false;
                  });
                  
                  const hint = closeMatch 
                    ? `\n  → Did you mean "${closeMatch.name}"? (Check for typos)` 
                    : '';
                  const suggestions = instructors.map(i => `"${i.name}"`).join(', ');
                  invalid.push(`Row ${rowNum}: Instructor "${instructorName}" not found.${hint}\n  → Available instructors: ${suggestions}`);
                  continue;
                }

                // First try exact match
                let room = rooms.find(r => cleanString(r.name).toLowerCase() === roomName.toLowerCase());
                
                // If exact match fails, try fuzzy match
                if (!room) {
                  const fuzzyMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                  room = rooms.find(r => fuzzyMatch(r.name) === fuzzyMatch(roomName));
                }
                
                if (!room) {
                  // Find the closest match for better error message
                  const fuzzyMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const csvFuzzy = fuzzyMatch(roomName);
                  const closeMatch = rooms.find(r => {
                    const dbFuzzy = fuzzyMatch(r.name);
                    if (Math.abs(csvFuzzy.length - dbFuzzy.length) <= 2) {
                      let diff = 0;
                      for (let i = 0; i < Math.min(csvFuzzy.length, dbFuzzy.length); i++) {
                        if (csvFuzzy[i] !== dbFuzzy[i]) diff++;
                      }
                      return diff <= 2;
                    }
                    return false;
                  });
                  
                  const hint = closeMatch 
                    ? `\n  → Did you mean "${closeMatch.name}"? (Check for typos)` 
                    : '';
                  const suggestions = rooms.map(r => `"${r.name}"`).join(', ');
                  invalid.push(`Row ${rowNum}: Room "${roomName}" not found.${hint}\n  → Available rooms: ${suggestions}`);
                  continue;
                }

                const section = sections.find(s => cleanString(s.name).toLowerCase() === sectionName.toLowerCase());
                if (!section) {
                  const suggestions = sections.map(s => `"${s.name}"`).join(', ');
                  invalid.push(`Row ${rowNum}: Section "${sectionName}" not found.\n  → Available sections: ${suggestions}`);
                  continue;
                }

                // Parse days - trim and handle empty values
                const daysRaw = (row.days || '').trim();
                if (!daysRaw) {
                  invalid.push(`Row ${rowNum}: Days field is empty`);
                  continue;
                }
                
                const days = daysRaw.split(',').map(d => d.trim()).filter(d => d.length > 0);
                const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const invalidDays = days.filter(d => !validDays.includes(d));
                
                if (days.length === 0) {
                  invalid.push(`Row ${rowNum}: No valid days specified`);
                  continue;
                }
                
                if (invalidDays.length > 0) {
                  invalid.push(`Row ${rowNum}: Invalid days "${invalidDays.join(', ')}". Valid days: ${validDays.join(', ')}`);
                  continue;
                }

                // Validate time format - trim whitespace
                const startTime = (row.start_time || '').trim();
                const endTime = (row.end_time || '').trim();
                
                // Normalize time format: add leading zero if needed (8:00 -> 08:00)
                const normalizeTime = (time: string): string => {
                  const parts = time.split(':');
                  if (parts.length === 2) {
                    const hour = parts[0].padStart(2, '0');
                    const minute = parts[1].padStart(2, '0');
                    return `${hour}:${minute}`;
                  }
                  return time;
                };
                
                const normalizedStartTime = normalizeTime(startTime);
                const normalizedEndTime = normalizeTime(endTime);
                
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(normalizedStartTime)) {
                  invalid.push(`Row ${rowNum}: Invalid start_time "${startTime}". Use HH:MM format (e.g., 08:00 or 8:00)`);
                  continue;
                }
                if (!timeRegex.test(normalizedEndTime)) {
                  invalid.push(`Row ${rowNum}: Invalid end_time "${endTime}". Use HH:MM format (e.g., 09:30 or 9:30)`);
                  continue;
                }
                
                if (normalizedStartTime >= normalizedEndTime) {
                  invalid.push(`Row ${rowNum}: End time must be after start time`);
                  continue;
                }

                // Check each day for conflicts
                for (const day of days) {
                  const scheduleData = {
                    course_id: course.id,
                    instructor_id: instructor.id,
                    room_id: room.id,
                    section_id: section.id,
                    day: day as any,
                    start_time: normalizedStartTime,
                    end_time: normalizedEndTime,
                    available_space: row.available_space ? parseInt((row.available_space || '').trim()) : room.capacity,
                    notes: '',
                  };

                  // Check for conflicts with existing schedules
                  const conflictCheck = await ScheduleService.detectConflicts(scheduleData);
                  if (conflictCheck.data && conflictCheck.data.length > 0) {
                    conflicts.push({
                      rowNum,
                      day,
                      course_code: courseCode,
                      section_name: sectionName,
                      instructor_name: instructorName,
                      conflicts: conflictCheck.data.map(c => `${c.conflict_type}: ${c.resource_name}`),
                      scheduleData,
                    });
                  } else {
                    valid.push({
                      rowNum,
                      day,
                      course_code: courseCode,
                      section_name: sectionName,
                      instructor_name: instructorName,
                      conflicts: [],
                      scheduleData,
                    });
                  }
                }
              } catch (error) {
                invalid.push(`Row ${rowNum}: ${(error as Error).message}`);
              }
            }

            resolve({
              success: true,
              message: `Validation completed. ${valid.length} valid, ${conflicts.length} conflicts, ${invalid.length} invalid`,
              data: { valid, invalid, conflicts },
            });
          },
          error: (error: any) => {
            resolve({
              success: false,
              message: 'Failed to parse CSV file',
              error: error.message,
            });
          },
        });
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to read CSV file',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Import schedules from CSV file (after validation)
   */
  static async fromCSV(
    validationResults: ValidationResult[],
    includeConflicts: boolean = false
  ): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    try {
      const errors: string[] = [];
      let imported = 0;

      // Filter to only process non-conflicting schedules unless includeConflicts is true
      const toImport = includeConflicts 
        ? validationResults 
        : validationResults.filter(v => v.conflicts.length === 0);

      for (const validation of toImport) {
        try {
          // Create schedule (conflicts already checked during validation)
          const result = await ScheduleService.create(validation.scheduleData);
          if (result.success) {
            imported++;
          } else {
            errors.push(`Row ${validation.rowNum}, ${validation.day}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`Row ${validation.rowNum}: ${(error as Error).message}`);
        }
      }

      return {
        success: true,
        message: `Import completed. ${imported} schedules imported, ${errors.length} errors`,
        data: { imported, errors },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to import schedules',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Generate sample CSV template
   */
  static generateSampleCSV(): string {
    const sampleData = [
      {
        course_code: 'CSE 101',
        course_title: 'Introduction to Computers',
        credits: '3',
        section_name: '1',
        instructor_name: 'John Doe',
        room_name: 'Computer Lab A',
        days: 'Monday, Wednesday',
        start_time: '08:00',
        end_time: '09:30',
        available_space: '30',
      },
      {
        course_code: 'ENGL 201',
        course_title: 'Technical Communication',
        credits: '3',
        section_name: '2',
        instructor_name: 'Jane Smith',
        room_name: 'Lecture Hall 1',
        days: 'Tuesday, Thursday',
        start_time: '10:00',
        end_time: '11:30',
        available_space: '50',
      },
    ];

    const csv = Papa.unparse(sampleData);
    return csv;
  }
}
