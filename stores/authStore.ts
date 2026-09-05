import { create } from 'zustand';

import {
  getCurrentUser,
  logoutUser,
  purgeLegacyCredentials,
  updateUser as updateStoredUser,
} from '@/services/authService';
import { upsertUserCache } from '@/services/database';
import type { User, UserRole } from '@/types';
import { disconnectRealtime } from '@/services/realtime';

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
    /*
      The socket authenticates once, at the handshake, so it does not notice a
      logout on its own — it would stay open and authenticated as the previous
      user until the server dropped it. Closed first, before the tokens it was
      holding are cleared.
    */
    disconnectRealtime();
    await logoutUser();
    set({ user: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  hydrate: async () => {
    try {
      // Clears credential material written by pre-hashing builds. Runs before
      // the session is read so nothing recoverable outlives the first launch.
      await purgeLegacyCredentials();
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
      // Persisted through the user record; there is no separate session copy.
      void updateStoredUser(user.id, { subscription: user.subscription });
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
