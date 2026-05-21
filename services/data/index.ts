/**
 * Data layer facade — swap SQLite implementations for Firestore when backend is ready.
 *
 * Today: local SQLite + Zustand (offline-first demo).
 * Future: `EXPO_PUBLIC_FIREBASE_ENABLED=true` → Firestore repositories.
 */
export const DATA_BACKEND = 'sqlite' as const;

export function isCloudSyncEnabled(): boolean {
  return process.env.EXPO_PUBLIC_FIREBASE_ENABLED === 'true';
}
