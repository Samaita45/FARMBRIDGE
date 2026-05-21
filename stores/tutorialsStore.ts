import { create } from 'zustand';

import {
  getBookmarkedIds,
  getCompletedIds,
  markComplete,
  toggleBookmark,
} from '@/services/tutorialsProgress';

export interface TutorialsState {
  completedIds: string[];
  bookmarkedIds: string[];
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  complete: (userId: string, tutorialId: string) => Promise<void>;
  toggleBookmark: (userId: string, tutorialId: string) => Promise<void>;
}

export const useTutorialsStore = create<TutorialsState>((set) => ({
  completedIds: [],
  bookmarkedIds: [],
  isHydrated: false,

  hydrate: async (userId) => {
    const [completedIds, bookmarkedIds] = await Promise.all([
      getCompletedIds(userId),
      getBookmarkedIds(userId),
    ]);
    set({ completedIds, bookmarkedIds, isHydrated: true });
  },

  complete: async (userId, tutorialId) => {
    await markComplete(userId, tutorialId);
    set((s: TutorialsState) => ({
      completedIds: s.completedIds.includes(tutorialId)
        ? s.completedIds
        : [...s.completedIds, tutorialId],
    }));
  },

  toggleBookmark: async (userId, tutorialId) => {
    const bookmarked = await toggleBookmark(userId, tutorialId);
    set((s: TutorialsState) => ({
      bookmarkedIds: bookmarked
        ? [...s.bookmarkedIds, tutorialId]
        : s.bookmarkedIds.filter((id) => id !== tutorialId),
    }));
  },
}));
