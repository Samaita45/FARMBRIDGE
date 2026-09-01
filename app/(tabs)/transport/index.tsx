import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/design-system';
import { TransportLocked } from '@/components/transport/transport-locked';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { useLocation } from '@/hooks/useLocation';
import { asHref } from '@/lib/href';
import { getBookings } from '@/services/transportDb';
import { selectIsSubscribed, useAuthStore, type AuthState } from '@/stores/authStore';
import type { IconName } from '@/types/icons';
import type { TransportBooking } from '@/types/transport';

export default function TransportHubScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const { location } = useLocation();
  const [activeTrips, setActiveTrips] = useState<TransportBooking[]>([]);

  const loadTrips = useCallback(async () => {
    const trips = await getBookings(user?.id ?? 'guest');
    setActiveTrips(trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status)));
  }, [user?.id]);

  // Refreshes on focus, so returning from a booking shows it straight away.
  useFocusEffect(
    useCallback(() => {
      if (isSubscribed) void loadTrips();
    }, [isSubscribed, loadTrips])
  );

  if (!isSubscribed) return <TransportLocked />;

  const available = TRANSPORT_PROVIDERS.filter((t) => t.isAvailable);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Transport
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Move your harvest safely and affordably
        </Text>
        <View style={styles.headerMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={DS.colors.textSoft} />
            <Text style={styles.metaText} numberOfLines={1}>
              {location.label}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.availableDot} />
            <Text style={styles.metaText}>{available.length} available</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTrips.length > 0 ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
            accessibilityRole="button"
            accessibilityLabel={`${activeTrips.length} active ${activeTrips.length === 1 ? 'trip' : 'trips'}. Open My trips.`}
            style={styles.alert}>
            <Ionicons name="cube-outline" size={18} color={DS.semantic.warning.fg} />
            <View style={styles.flex}>
              <Text style={styles.alertTitle}>
                {activeTrips.length} active trip{activeTrips.length === 1 ? '' : 's'}
              </Text>
              <Text style={styles.alertSub}>Track and update status</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={DS.semantic.warning.fg} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>What do you need?</Text>

        <ActionCard
          icon="cube-outline"
          title="Find transport"
          subtitle="Get quotes from transporters near you"
          onPress={() => router.push(asHref('/(tabs)/transport/request'))}
        />
        <ActionCard
          icon="car-outline"
          title="Offer transport"
          subtitle="Register your vehicle and take jobs"
          onPress={() => router.push(asHref('/(tabs)/transport/register'))}
        />
        <ActionCard
          icon="list-outline"
          title="My trips"
          subtitle="Track bookings and update their status"
          onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
        />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Nearby transporters</Text>
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
            accessibilityRole="button"
            accessibilityLabel="See all transporters"
            hitSlop={8}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {available.slice(0, 3).map((provider) => (
          <Pressable
            key={provider.id}
            onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
            accessibilityRole="button"
            accessibilityLabel={`${provider.name}, ${VEHICLE_LABELS[provider.vehicleType]}, ${provider.capacity} tonnes, $${provider.pricePerKm} per kilometre. Available.`}
            style={({ pressed }) => [styles.provider, pressed && styles.pressed]}>
            <View style={styles.providerAvatar}>
              <VehicleIcon type={provider.vehicleType} size={20} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.providerName} numberOfLines={1}>
                {provider.name}
              </Text>
              <Text style={styles.providerMeta}>
                {VEHICLE_LABELS[provider.vehicleType]} · {provider.capacity}t
              </Text>
            </View>
            <View style={styles.providerRight}>
              <Text style={styles.providerRate}>${provider.pricePerKm}/km</Text>
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={DS.colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  pressed: { backgroundColor: DS.colors.surfaceMuted },

  header: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
    gap: 2,
  },
  title: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  headerMeta: { flexDirection: 'row', gap: DS.spacing.md, marginTop: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    flexShrink: 1,
  },

  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.sm + 4 },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.semantic.warning.border,
    padding: DS.spacing.sm + 4,
  },
  alertTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.warning.fg,
  },
  alertSub: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
    marginTop: 1,
  },

  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginTop: DS.spacing.sm,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
    paddingVertical: 6,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    minHeight: 68,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  actionSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  providerMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  providerRight: { alignItems: 'flex-end', gap: 4 },
  providerRate: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.semantic.success.solid,
  },
  availableText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.success.fg,
  },
});
