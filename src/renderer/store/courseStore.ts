import { create } from 'zustand';
import type { Course } from '../../shared/types';

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  addCourse: (course: any) => Promise<void>;
  updateCourse: (id: number, course: any) => Promise<void>;
  deleteCourse: (id: number) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.course.getAll();
      if (response.success && response.data) {
        set({ courses: response.data, isLoading: false });
      } else {
        set({ error: response.message || 'Failed to fetch courses', isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCourse: async (course: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.course.create(course);
      if (response.success) {
        await get().fetchCourses();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateCourse: async (id: number, course: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.course.update(id, course);
      if (response.success) {
        await get().fetchCourses();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCourse: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.course.delete(id);
      if (response.success) {
        await get().fetchCourses();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
