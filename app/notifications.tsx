import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/design-system';
import { Colors } from '@/constants/colors';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppNotification, NotificationType } from '@/types/notifications';

const TYPE_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  task: { icon: 'checkmark-circle-outline', color: DS.colors.primary, bg: '#EFF6FF' },
  market: { icon: 'trending-up-outline', color: '#059669', bg: '#ECFDF5' },
  weather: { icon: 'partly-sunny-outline', color: '#7C3AED', bg: '#F5F3FF' },
  system: { icon: 'information-circle-outline', color: '#64748B', bg: '#F1F5F9' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const meta = TYPE_META[item.type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !item.read && styles.rowUnread,
        pressed && { opacity: 0.92 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.rowBodyText} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.rowTime}>{formatWhen(item.createdAt)}</Text>
      </View>
      {item.href ? (
        <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
      ) : null}
    </Pressable>
  );
}

const TABS: { id: 'all' | NotificationType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'task', label: 'Tasks' },
  { id: 'market', label: 'Market' },
  { id: 'weather', label: 'Weather' },
  { id: 'system', label: 'System' },
];

export default function NotificationsScreen() {
  const { items, unreadCount, refresh, isHydrated, userId } = useNotifications();
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [tab, setTab] = useState<'all' | NotificationType>('all');

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((n) => n.type === tab)),
    [items, tab],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onItemPress = (item: AppNotification) => {
    if (userId && !item.read) void markRead(userId, item.id);
    if (item.href) router.push(asHref(item.href));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : 'You are all caught up'}
          </Text>
          {userId && unreadCount > 0 ? (
            <Pressable onPress={() => void markAllRead(userId)} hitSlop={8}>
              <Text style={styles.markAll}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!userId ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={40} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>Sign in for alerts</Text>
            <Text style={styles.emptyBody}>
              Task reminders, market insights, and daily digests sync to your account.
            </Text>
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.ctaText}>Log in</Text>
            </Pressable>
          </View>
        ) : !isHydrated ? (
          <ActivityIndicator color={DS.colors.primary} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={tab === 'all' ? 'No notifications' : 'Nothing in this category'}
            description="Add farm tasks or enable push in Settings."
            actionLabel="Notification settings"
            onAction={() => router.push('/settings')}
          />
        ) : (
          filtered.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onPress={() => onItemPress(item)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  tabs: { gap: 8, marginBottom: DS.spacing.md, paddingRight: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  tabActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: DS.colors.textMuted },
  tabTextActive: { color: DS.colors.textInverse },
  scroll: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subtitle: { fontSize: 14, color: Colors.gray[600], fontWeight: '500' },
  markAll: { fontSize: 14, fontWeight: '700', color: DS.colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowUnread: { borderColor: '#BFDBFE', backgroundColor: '#F8FAFC' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS.colors.primary,
  },
  rowBodyText: { fontSize: 13, color: Colors.gray[600], marginTop: 2, lineHeight: 18 },
  rowTime: { fontSize: 11, color: Colors.gray[400], marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  cta: {
    marginTop: 20,
    backgroundColor: DS.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
