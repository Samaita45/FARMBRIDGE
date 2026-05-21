import { getJSON, setJSON } from './storage';

const completedKey = (userId: string) => `tutorials_completed:${userId}`;
const bookmarkKey = (userId: string) => `tutorials_bookmarks:${userId}`;

export async function getCompletedIds(userId: string): Promise<string[]> {
  return (await getJSON<string[]>(completedKey(userId))) ?? [];
}

export async function markComplete(userId: string, tutorialId: string): Promise<void> {
  const ids = await getCompletedIds(userId);
  if (!ids.includes(tutorialId)) {
    await setJSON(completedKey(userId), [...ids, tutorialId]);
  }
}

export async function getBookmarkedIds(userId: string): Promise<string[]> {
  return (await getJSON<string[]>(bookmarkKey(userId))) ?? [];
}

export async function toggleBookmark(userId: string, tutorialId: string): Promise<boolean> {
  const ids = await getBookmarkedIds(userId);
  const next = ids.includes(tutorialId)
    ? ids.filter((id) => id !== tutorialId)
    : [...ids, tutorialId];
  await setJSON(bookmarkKey(userId), next);
  return next.includes(tutorialId);
}

export async function isBookmarked(userId: string, tutorialId: string): Promise<boolean> {
  const ids = await getBookmarkedIds(userId);
  return ids.includes(tutorialId);
}
