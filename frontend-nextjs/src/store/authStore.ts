import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, User, RegisterFormData } from '@/types';
import { apiClient } from '@/lib/api';
import { isTokenExpired } from '@/lib/utils';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (identifier: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.login({ identifier, password });
          
          if (response.success && response.token && response.user) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: RegisterFormData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.register(userData);
          
          if (response.success && response.token && response.user) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        apiClient.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token || isTokenExpired(token)) {
          get().logout();
          return;
        }

        set({ isLoading: true });
        try {
          const response = await apiClient.getProfile();
          
          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            get().logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          get().logout();
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);