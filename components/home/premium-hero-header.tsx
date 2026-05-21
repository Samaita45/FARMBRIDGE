import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { Premium } from '@/constants/premium-home';
import { useAuthStore } from '@/stores/authStore';

interface PremiumHeroHeaderProps {
  locationLabel: string;
  greeting: string;
  notificationCount?: number;
  avatarUri?: string | null;
  avatarInitials?: string;
}

/** Capitalize greeting for premium display e.g. "Good Morning" */
function displayGreeting(greeting: string): string {
  return greeting
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function PremiumHeroHeader({
  locationLabel,
  greeting,
  notificationCount = 0,
  avatarUri = null,
  avatarInitials = 'F',
}: PremiumHeroHeaderProps) {
  const badge = notificationCount > 99 ? '99+' : String(notificationCount);
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Farmer';
  const locationShort = locationLabel.split('·')[0]?.trim() ?? locationLabel;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#60A5FA', Premium.primary, '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + 10 }]}>
        {/* Abstract farm / fintech pattern */}
        <View style={styles.patternRow} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.patternDot, { opacity: 0.15 + i * 0.04 }]} />
          ))}
        </View>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
        <View style={styles.orb4} />

        <View style={styles.floatCard}>
          <View style={styles.glassPanel}>
            <View style={styles.topRow}>
              <View style={styles.userRow}>
                <View style={styles.avatarRing}>
                  <ProfileAvatar
                    uri={avatarUri}
                    initials={avatarInitials}
                    size={56}
                    embedded
                    showCameraBadge={false}
                    onPress={user ? () => router.push('/(tabs)/profile') : undefined}
                  />
                </View>
                <View>
                  <Text style={styles.greeting}>{displayGreeting(greeting)}</Text>
                  <Text style={styles.name}>{firstName}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.88 }]}>
                <Ionicons name="notifications" size={22} color="#fff" />
                {notificationCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <View style={styles.locationPill}>
              <Ionicons name="location" size={15} color="#4ADE80" />
              <Text style={styles.locationText}>{locationShort}</Text>
              <View style={styles.dot} />
              <Text style={styles.online}>Online</Text>
            </View>
          </View>
        </View>

        {!user ? (
          <View style={styles.authRow}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.authOutline}>
                <Text style={styles.authOutlineText}>Login</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.authSolid}>
                <Text style={styles.authSolidText}>Register</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: -24,
    zIndex: 2,
    borderBottomLeftRadius: Premium.radiusXl,
    borderBottomRightRadius: Premium.radiusXl,
    overflow: 'hidden',
    ...Premium.shadowSoft,
  },
  gradient: { paddingHorizontal: 20, paddingBottom: 36 },
  patternRow: {
    position: 'absolute',
    top: 40,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  orb1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -40,
  },
  orb2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(22,163,74,0.2)',
    top: 50,
    left: -30,
  },
  orb3: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 80,
    right: 50,
  },
  orb4: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139,92,246,0.12)',
    bottom: -20,
    left: 40,
  },
  floatCard: {
    ...Premium.shadow,
  },
  glassPanel: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Premium.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    padding: 18,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: {
    padding: 3,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Premium.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15,23,42,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  locationText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginLeft: 4,
  },
  online: { fontSize: 13, fontWeight: '700', color: '#BBF7D0' },
  authRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  authOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
  },
  authOutlineText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  authSolid: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  authSolidText: { color: Premium.primary, fontWeight: '700', fontSize: 14 },
});
