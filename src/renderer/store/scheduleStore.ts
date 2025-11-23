import { create } from 'zustand';
import type { ScheduleWithDetails } from '../../shared/types';

interface ScheduleState {
  schedules: ScheduleWithDetails[];
  isLoading: boolean;
  error: string | null;
  fetchSchedules: () => Promise<void>;
  addSchedule: (schedule: any) => Promise<void>;
  updateSchedule: (id: number, schedule: any) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
  detectConflicts: (scheduleData: any) => Promise<any>;
  filterSchedules: (filters: any) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  isLoading: false,
  error: null,

  fetchSchedules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.schedule.getAll();
      if (response.success && response.data) {
        set({ schedules: response.data, isLoading: false });
      } else {
        set({ error: response.message || 'Failed to fetch schedules', isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addSchedule: async (schedule: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.schedule.create(schedule);
      if (response.success) {
        await get().fetchSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateSchedule: async (id: number, schedule: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.schedule.update(id, schedule);
      if (response.success) {
        await get().fetchSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteSchedule: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.schedule.delete(id);
      if (response.success) {
        await get().fetchSchedules();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  detectConflicts: async (scheduleData: any) => {
    try {
      const response = await window.electronAPI.schedule.detectConflicts(scheduleData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  filterSchedules: async (filters: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.schedule.getByFilters(filters);
      if (response.success && response.data) {
        set({ schedules: response.data, isLoading: false });
      } else {
        set({ error: response.message || 'Failed to filter schedules', isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
