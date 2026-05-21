import type { CommunityPost } from '@/types/community';

import { getDatabase } from './database';
import { getJSON, setJSON } from './storage';

const CACHE_KEY = 'community_posts_cache';
const USER_POSTS_KEY = 'community_user_posts';

export async function cachePosts(posts: CommunityPost[]): Promise<void> {
  await setJSON(CACHE_KEY, { data: posts, cachedAt: Date.now() });
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_community_posts (
      id TEXT PRIMARY KEY NOT NULL,
      dataJson TEXT NOT NULL,
      cachedAt TEXT NOT NULL
    );
  `);
  for (const post of posts) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_community_posts (id, dataJson, cachedAt) VALUES (?,?,?)`,
      post.id,
      JSON.stringify(post),
      new Date().toISOString()
    );
  }
}

export async function getCachedPosts(): Promise<CommunityPost[] | null> {
  const cached = await getJSON<{ data: CommunityPost[]; cachedAt: number }>(CACHE_KEY);
  if (cached?.data) return cached.data;

  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_community_posts (
      id TEXT PRIMARY KEY NOT NULL,
      dataJson TEXT NOT NULL,
      cachedAt TEXT NOT NULL
    );
  `);
  const rows = (await db.getAllAsync(
    `SELECT dataJson FROM cached_community_posts ORDER BY cachedAt DESC`
  )) as { dataJson: string }[];
  if (rows.length === 0) return null;
  return rows.map((r: { dataJson: string }) => JSON.parse(r.dataJson) as CommunityPost);
}

export async function saveUserPosts(posts: CommunityPost[]): Promise<void> {
  await setJSON(USER_POSTS_KEY, posts);
}

export async function getUserPosts(): Promise<CommunityPost[]> {
  return (await getJSON<CommunityPost[]>(USER_POSTS_KEY)) ?? [];
}
