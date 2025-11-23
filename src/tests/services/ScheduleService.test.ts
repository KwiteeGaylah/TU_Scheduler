import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleService } from '../../database/services/ScheduleService';

const mockDb = {
  exec: vi.fn(),
  run: vi.fn(),
  prepare: vi.fn(() => ({
    get: vi.fn(),
    all: vi.fn(),
  })),
};

vi.mock('../../database/init', () => ({
  getDatabase: () => mockDb,
  saveDatabase: vi.fn(),
}));

describe('ScheduleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConflicts', () => {
    it('should detect instructor time conflicts', async () => {
      const scheduleData = {
        section_id: 1,
        instructor_id: 1,
        room_id: 1,
        day_of_week: 'Monday',
        start_time: '10:00',
        end_time: '12:00',
        semester: 'Semester 1',
        academic_year: '2024/2025',
      };

      mockDb.prepare().all.mockReturnValue([
        {
          id: 1,
          section_id: 2,
          instructor_id: 1,
          room_id: 2,
          day_of_week: 'Monday',
          start_time: '11:00',
          end_time: '13:00',
        },
      ]);

      const result = await ScheduleService.detectConflicts(scheduleData);

      expect(result.success).toBe(true);
      expect(result.data.conflicts.length).toBeGreaterThan(0);
      expect(result.data.conflicts[0].type).toBe('instructor');
    });

    it('should detect room conflicts', async () => {
      const scheduleData = {
        section_id: 1,
        instructor_id: 1,
        room_id: 1,
        day_of_week: 'Tuesday',
        start_time: '14:00',
        end_time: '16:00',
        semester: 'Semester 1',
        academic_year: '2024/2025',
      };

      mockDb.prepare().all.mockReturnValue([
        {
          id: 2,
          section_id: 3,
          instructor_id: 2,
          room_id: 1,
          day_of_week: 'Tuesday',
          start_time: '15:00',
          end_time: '17:00',
        },
      ]);

      const result = await ScheduleService.detectConflicts(scheduleData);

      expect(result.success).toBe(true);
      expect(result.data.conflicts.length).toBeGreaterThan(0);
      expect(result.data.conflicts[0].type).toBe('room');
    });

    it('should return no conflicts for valid schedule', async () => {
      const scheduleData = {
        section_id: 1,
        instructor_id: 1,
        room_id: 1,
        day_of_week: 'Wednesday',
        start_time: '08:00',
        end_time: '10:00',
        semester: 'Semester 1',
        academic_year: '2024/2025',
      };

      mockDb.prepare().all.mockReturnValue([]);

      const result = await ScheduleService.detectConflicts(scheduleData);

      expect(result.success).toBe(true);
      expect(result.data.conflicts.length).toBe(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        section_id: 1,
        // Missing required fields
      } as any;

      const result = await ScheduleService.detectConflicts(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('createSchedule', () => {
    it('should create schedule without conflicts', async () => {
      mockDb.prepare().all.mockReturnValue([]); // No conflicts
      mockDb.run.mockReturnValue({ lastID: 1 });

      const scheduleData = {
        section_id: 1,
        instructor_id: 1,
        room_id: 1,
        day_of_week: 'Thursday',
        start_time: '10:00',
        end_time: '12:00',
        semester: 'Semester 1',
        academic_year: '2024/2025',
      };

      const result = await ScheduleService.create(scheduleData);

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should prevent creating schedule with conflicts', async () => {
      mockDb.prepare().all.mockReturnValue([
        {
          id: 1,
          section_id: 2,
          instructor_id: 1,
          day_of_week: 'Thursday',
          start_time: '11:00',
          end_time: '13:00',
        },
      ]);

      const scheduleData = {
        section_id: 1,
        instructor_id: 1,
        room_id: 1,
        day_of_week: 'Thursday',
        start_time: '10:00',
        end_time: '12:00',
        semester: 'Semester 1',
        academic_year: '2024/2025',
      };

      const result = await ScheduleService.create(scheduleData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('conflict');
    });
  });

  describe('getByFilters', () => {
    it('should filter by semester', async () => {
      mockDb.prepare().all.mockReturnValue([
        { id: 1, semester: 'Semester 1' },
        { id: 2, semester: 'Semester 1' },
      ]);

      const result = await ScheduleService.getByFilters({
        semester: 'Semester 1',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it('should filter by instructor', async () => {
      mockDb.prepare().all.mockReturnValue([
        { id: 1, instructor_id: 5 },
      ]);

      const result = await ScheduleService.getByFilters({
        instructor_id: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
    });
  });
});
