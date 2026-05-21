export type NotificationType = 'task' | 'market' | 'weather' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  /** expo-router path */
  href?: string;
}
