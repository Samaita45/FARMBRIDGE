import { create } from 'zustand';

import { getCurrentUser, logoutUser, updateUser as updateStoredUser } from '@/services/authService';
import { upsertUserCache } from '@/services/database';
import { setJSON } from '@/services/storage';
import type { User, UserRole } from '@/types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
  updateSubscription: (planId: string, isActive: boolean, expiresAt?: string) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: (user) => {
    void upsertUserCache(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    await logoutUser();
    set({ user: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  hydrate: async () => {
    try {
      const user = await getCurrentUser();
      set({ user, isAuthenticated: !!user, isHydrated: true });
      if (user) void upsertUserCache(user);
    } catch {
      set({ isHydrated: true });
    }
  },
  updateSubscription: (planId, isActive, expiresAt) =>
    set((state) => {
      if (!state.user) return state;
      const user = {
        ...state.user,
        subscription: { planId, isActive, expiresAt },
      };
      void setJSON('current_user', user);
      void upsertUserCache(user);
      return { user };
    }),
  updateUser: async (updates) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const updated = await updateStoredUser(user.id, updates);
    set({ user: updated });
    void upsertUserCache(updated);
  },
}));

export const selectUserRole = (state: AuthState): UserRole | null =>
  state.user?.role ?? null;

export const selectIsSubscribed = (state: AuthState): boolean =>
  state.user?.subscription?.isActive ?? false;
