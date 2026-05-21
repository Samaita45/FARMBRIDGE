import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransportLocked } from '@/components/transport/transport-locked';
import Colors from '@/constants/colors';
import { ScreenImages } from '@/constants/images';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { useLocation } from '@/hooks/useLocation';
import { getBookings } from '@/services/transportDb';
import { asHref } from '@/lib/href';
import { useAuthStore, selectIsSubscribed, type AuthState } from '@/stores/authStore';
import type { TransportBooking } from '@/types/transport';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fffbeb', text: '#f59e0b' },
  confirmed:  { bg: '#eff6ff', text: Colors.primary },
  in_transit: { bg: '#dcfce7', text: Colors.accent },
  completed:  { bg: '#f1f5f9', text: Colors.gray[500] },
  cancelled:  { bg: '#fff1f2', text: Colors.error },
};

export default function TransportHubScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const { location } = useLocation();
  const [activeTrips, setActiveTrips] = useState<TransportBooking[]>([]);

  const loadTrips = useCallback(async () => {
    const trips = await getBookings(user?.id ?? 'guest');
    setActiveTrips(trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status)));
  }, [user?.id]);

  useEffect(() => {
    if (isSubscribed) void loadTrips();
  }, [isSubscribed, loadTrips]);

  if (!isSubscribed) return <TransportLocked />;

  const available = TRANSPORT_PROVIDERS.filter((t) => t.isAvailable).length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <ImageBackground source={ScreenImages.transport} style={s.heroBg} resizeMode="cover">
          <View style={s.heroOverlay}>
            <View style={s.heroTitleRow}>
              <Ionicons name="bus" size={22} color="#fff" />
              <Text style={s.heroTitle}>Farm Transport</Text>
            </View>
            <Text style={s.heroSub}>Move your harvest safely &amp; affordably</Text>
            <View style={s.heroMeta}>
              <View style={s.heroPill}>
                <Ionicons name="location" size={12} color={Colors.accentLight} />
                <Text style={s.heroPillText}>{location.label}</Text>
              </View>
              <View style={s.heroPill}>
                <View style={s.availDot} />
                <Text style={s.heroPillText}>{available} transporters available</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={s.body}>

          {/* ── Active trips alert ── */}
          {activeTrips.length > 0 && (
            <Pressable
              onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
              style={({ pressed }) => [s.alertCard, pressed && { opacity: 0.85 }]}>
              <View style={s.alertIcon}>
                <Ionicons name="cube" size={20} color="#f59e0b" />
              </View>
              <View style={s.alertText}>
                <Text style={s.alertTitle}>
                  {activeTrips.length} active trip{activeTrips.length > 1 ? 's' : ''}
                </Text>
                <Text style={s.alertSub}>Tap to track status</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#f59e0b" />
            </Pressable>
          )}

          {/* ── Primary CTA cards ── */}
          <Text style={s.sectionTitle}>What would you like to do?</Text>

          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            style={({ pressed }) => [s.ctaCard, pressed && { opacity: 0.88 }]}>
            <View style={[s.ctaIconCircle, { backgroundColor: Colors.primaryBg }]}>
              <Ionicons name="cube-outline" size={22} color={Colors.primary} />
            </View>
            <View style={s.ctaContent}>
              <Text style={s.ctaTitle}>Find Transport</Text>
              <Text style={s.ctaSub}>Get quotes from verified drivers near you</Text>
            </View>
            <View style={s.ctaArrow}>
              <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/register'))}
            style={({ pressed }) => [s.ctaCard, s.ctaCardAccent, pressed && { opacity: 0.88 }]}>
            <View style={[s.ctaIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="car-sport-outline" size={22} color="#fff" />
            </View>
            <View style={s.ctaContent}>
              <Text style={[s.ctaTitle, { color: '#fff' }]}>Offer Transport</Text>
              <Text style={[s.ctaSub, { color: 'rgba(255,255,255,0.80)' }]}>Register your vehicle &amp; earn</Text>
            </View>
            <View style={[s.ctaArrow, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </Pressable>

          {/* ── View trips button ── */}
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
            style={({ pressed }) => [s.tripsBtn, pressed && { opacity: 0.8 }]}>
            <Ionicons name="list" size={18} color={Colors.primary} />
            <Text style={s.tripsBtnText}>View My Trips</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </Pressable>

          {/* ── Nearby providers preview ── */}
          <Text style={s.sectionTitle}>Nearby Transporters</Text>
          {TRANSPORT_PROVIDERS.filter((t) => t.isAvailable).slice(0, 3).map((provider) => (
            <Pressable
              key={provider.id}
              onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
              style={({ pressed }) => [s.providerCard, pressed && { opacity: 0.85 }]}>
              <View style={s.providerAvatar}>
                <Text style={s.providerInitial}>{provider.name.charAt(0)}</Text>
              </View>
              <View style={s.providerInfo}>
                <Text style={s.providerName}>{provider.name}</Text>
                <Text style={s.providerMeta}>
                  {provider.vehicleType} · {provider.capacity}t capacity
                </Text>
                <Text style={s.providerRate}>${provider.pricePerKm}/km</Text>
              </View>
              <View style={s.availBadge}>
                <View style={s.availDotGreen} />
                <Text style={s.availText}>Available</Text>
              </View>
            </Pressable>
          ))}

          {/* View all providers button */}
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
            style={({ pressed }) => [s.viewAllBtn, pressed && { opacity: 0.8 }]}>
            <Text style={s.viewAllText}>View All Transporters</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { flex: 1 },

  // Hero
  heroBg: { width: '100%' },
  heroOverlay: {
    backgroundColor: 'rgba(15,23,42,0.65)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 4 },
  heroMeta: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  heroPillText: { fontSize: 12, color: 'rgba(255,255,255,0.90)' },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentLight },

  // Body
  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 20, marginBottom: 12 },

  // Alert card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 8,
    gap: 12,
  },
  alertIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center',
  },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  alertSub: { fontSize: 12, color: '#a16207' },

  // CTA cards
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 14,
  },
  ctaCardAccent: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
  },
  ctaIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  ctaContent: { flex: 1 },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  ctaSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  ctaArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },

  // Trips button
  tripsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  tripsBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary, flex: 1, textAlign: 'center' },

  // Provider cards
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryMid, alignItems: 'center', justifyContent: 'center',
  },
  providerInitial: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  providerMeta: { fontSize: 12, color: Colors.textSecondary },
  providerRate: { fontSize: 13, fontWeight: '700', color: Colors.accent, marginTop: 2 },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDotGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent },
  availText: { fontSize: 11, fontWeight: '600', color: Colors.accent },

  // View all
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryMid,
    marginTop: 4,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
