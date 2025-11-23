import { create } from 'zustand';
import type { User } from '../../shared/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.user.login(username, password);
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
      } else {
        set({ error: response.message || 'Login failed', isLoading: false });
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    window.electronAPI.user.logout();
    set({ user: null, error: null });
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));
