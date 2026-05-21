import { type Href, Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DailyTipCard } from '@/components/home/daily-tip-card';
import { CropTrendCard } from '@/components/cards/crop-trend-card';
import { SubscriptionBanner } from '@/components/cards/subscription-banner';
import { WeatherWidget } from '@/components/cards/weather-widget';
import { CropDemandChart } from '@/components/charts/crop-demand-chart';
import { DashboardHeader } from '@/components/home/dashboard-header';
import { CropCardSkeleton } from '@/components/ui/skeleton';
import { WeatherForecastModal } from '@/components/weather/weather-forecast-modal';
import { EXCHANGE_RATE } from '@/constants/market-stats';
import {
  CROPS,
  MARKET_PRODUCTS,
  getCropsForMonth,
  getTopDemandCrops,
} from '@/constants/zimbabwe-data';
import Colors from '@/constants/colors';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { upsertCachedCropData, upsertCachedProduct } from '@/services/database';
import { isOnline } from '@/services/syncService';
import { useAuthStore, selectIsSubscribed } from '@/stores/authStore';
import { getCropIcon, getCropImage } from '@/utils/crop-emoji';

const MONTH = new Date().getMonth() + 1;
const HOURS = new Date().getHours();
const GREETING = HOURS < 12 ? 'Good morning' : HOURS < 17 ? 'Good afternoon' : 'Good evening';

const QUICK_ACCESS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string; color: string; bg: string }[] = [
  { label: 'Crop\nPlanning',     icon: 'leaf',      href: '/crop-management',        color: '#2E7D32', bg: '#E8F5E9' },
  { label: 'Crop\nHealth',       icon: 'medkit',    href: '/crop-management/health', color: '#F57C00', bg: '#FFF3E0' },
  { label: 'Soil &\nFertilizer', icon: 'water',     href: '/crop-management/soil',   color: '#1976D2', bg: '#E3F2FD' },
  { label: 'Financials',         icon: 'cash',      href: '/financials',             color: '#7B1FA2', bg: '#F3E5F5' },
  { label: 'Tutorials',          icon: 'book',      href: '/tutorials',              color: '#C62828', bg: '#FFEBEE' },
  { label: 'Community',          icon: 'people',    href: '/(tabs)/community',       color: '#00695C', bg: '#E0F2F1' },
];

export default function HomeScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const { location, loading: locationLoading } = useLocation();
  const { data: weather, isLoading: weatherLoading, refetch } = useWeather(location);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const topCrops = useMemo(() => getTopDemandCrops(8), []);
  const plantNow = useMemo(() => getCropsForMonth(MONTH).slice(0, 4), []);
  useEffect(() => {
    void (async () => {
      if (!(await isOnline())) return;
      try {
        await upsertCachedCropData('trends', JSON.stringify(getTopDemandCrops(20)));
        await upsertCachedCropData('all_crops', JSON.stringify(CROPS));
        for (const p of MARKET_PRODUCTS.slice(0, 24)) {
          await upsertCachedProduct(p.id, JSON.stringify(p));
        }
      } catch { /* offline cache best-effort */ }
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <DashboardHeader locationLabel={location.label} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}>

        {/* ── Market ticker strip ── */}
        <View style={s.tickerBar}>
          <TickerItem icon="trending-up" label="USD/ZWG" value={`1:${EXCHANGE_RATE.usdToZwg}`} color={Colors.primary} />
          <View style={s.tickerDiv} />
          <TickerItem icon="leaf" label="Top crop" value={topCrops[0]?.name ?? '—'} color={Colors.success} />
          <View style={s.tickerDiv} />
          <TickerItem
            icon="rainy"
            label="Rain"
            value={weather?.rain?.daysUntil != null ? (weather.rain.daysUntil === 0 ? 'Today' : `${weather.rain.daysUntil}d`) : 'Dry'}
            color={Colors.accent}
          />
          <View style={s.tickerDiv} />
          <TickerItem icon="thermometer" label="Temp" value={weather?.current ? `${weather.current.temp}°C` : '—'} color={Colors.warning} />
        </View>

        {/* ── Daily tip ── */}
        <View style={s.section}>
          <DailyTipCard />
        </View>

        {/* ── Weather card ── */}
        <View style={s.section}>
          <SectionHeader icon="partly-sunny-outline" title="Weather" onPress={() => setWeatherModalOpen(true)} actionLabel="7-day" />
          <View style={s.weatherRow}>
            <WeatherWidget
              current={weather?.current}
              rain={weather?.rain}
              loading={weatherLoading || locationLoading}
              onPress={() => setWeatherModalOpen(true)}
            />
            {/* Agricultural conditions */}
            {weather?.agricultural && (
              <View style={s.agriCard}>
                <Text style={s.agriTitle}>Farming Conditions</Text>
                {[
                  { label: 'Soil temperature', value: `${weather.agricultural.soilTemperature}°C`, icon: 'thermometer-outline' as const },
                  { label: 'Soil moisture', value: `${weather.agricultural.soilMoisture}%`, icon: 'water-outline' as const },
                  { label: 'Insight', value: weather.agricultural.insight, icon: 'bulb-outline' as const },
                ].map((row) => (
                  <View key={row.label} style={s.agriRow}>
                    <Ionicons name={row.icon as keyof typeof Ionicons.glyphMap} size={12} color={Colors.textSecondary} />
                    <Text style={s.agriLabel}>{row.label}</Text>
                    <Text style={s.agriValue} numberOfLines={1}>{row.value ?? '—'}</Text>
                  </View>
                ))}
                <Pressable
                  onPress={() => setWeatherModalOpen(true)}
                  style={s.agriMoreBtn}>
                  <Text style={s.agriMoreText}>Full forecast</Text>
                  <Ionicons name="arrow-forward" size={11} color={Colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* ── Crops in demand ── */}
        <View style={s.section}>
          <SectionHeader icon="trending-up-outline" title="Crops in Demand" onPress={() => router.push('/(tabs)/market' as Href)} actionLabel="Market" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
            {topCrops.length === 0
              ? [1, 2, 3].map((i) => <CropCardSkeleton key={i} />)
              : topCrops.map((crop) => <CropTrendCard key={crop.id} crop={crop} />)}
          </ScrollView>
        </View>

        {/* ── Demand forecast chart ── */}
        <View style={s.section}>
          <SectionHeader icon="bar-chart-outline" title="Demand Forecast" />
          <CropDemandChart />
        </View>

        {/* ── Quick access grid ── */}
        <View style={s.section}>
          <SectionHeader icon="apps-outline" title="Quick Access" />
          <View style={s.quickGrid}>
            {QUICK_ACCESS.map((item) => (
              <Link key={item.href} href={item.href as Href} asChild>
                <Pressable style={({ pressed }) => [s.quickCard, pressed && { opacity: 0.8 }]}>
                  <View style={[s.quickIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={s.quickLabel}>{item.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        {/* ── Plant now section ── */}
        <View style={s.section}>
          <SectionHeader
            icon="leaf-outline"
            title="Plant Now"
            onPress={() => router.push('/crop-management/planner' as Href)}
            actionLabel="Calendar"
          />
          {plantNow.map((crop) => (
            <Pressable
              key={crop.id}
              style={({ pressed }) => [s.plantCard, pressed && { opacity: 0.9 }]}
              onPress={() => router.push('/crop-management/planner' as Href)}>
              <View style={s.plantEmojiWrap}>
                <Image source={getCropImage(crop.id, crop.category)} style={s.plantImage} resizeMode="cover" />
                <View style={s.plantImageIcon}>
                  <Ionicons name={getCropIcon(crop.category) as keyof typeof Ionicons.glyphMap} size={11} color={Colors.primary} />
                </View>
              </View>
              <View style={s.plantInfo}>
                <Text style={s.plantName}>{crop.name}</Text>
                <Text style={s.plantMeta}>{crop.harvestDays} days to harvest · {crop.waterRequirements} water</Text>
              </View>
              <View style={s.plantPrice}>
                <Text style={s.plantPriceUSD}>${crop.currentPriceUSD.toFixed(2)}</Text>
                <Text style={s.plantPriceZWG}>ZWG {(crop.currentPriceUSD * EXCHANGE_RATE.usdToZwg).toFixed(0)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Market shortcut ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/market' as Href)}
          style={({ pressed }) => [s.marketBanner, pressed && { opacity: 0.9 }]}>
          <View style={s.marketBannerLeft}>
            <View style={s.marketIconWrap}>
              <Ionicons name="storefront" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.marketBannerTitle}>FarmBridge Market</Text>
              <Text style={s.marketBannerSub}>Buy & sell farm produce · {MARKET_PRODUCTS.length}+ listings</Text>
            </View>
          </View>
          <View style={s.marketBannerArrow}>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </View>
        </Pressable>

        {/* ── Transport shortcut ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/transport' as Href)}
          style={({ pressed }) => [s.transportBanner, pressed && { opacity: 0.9 }]}>
          <View style={s.transportLeft}>
            <Ionicons name="bus" size={26} color="#fff" />
            <View>
              <Text style={s.transportTitle}>Book Transport</Text>
              <Text style={s.transportSub}>Move your harvest safely & affordably</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {!isSubscribed && (
          <View style={s.section}>
            <SubscriptionBanner />
          </View>
        )}
      </ScrollView>

      <WeatherForecastModal
        visible={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        daily={weather?.daily ?? []}
        agricultural={weather?.agricultural}
        locationLabel={location.label}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, onPress, actionLabel = 'View All' }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; onPress?: () => void; actionLabel?: string;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.titleRow}>
        {icon ? <Ionicons name={icon} size={18} color={Colors.primary} /> : null}
        <Text style={sh.title}>{title}</Text>
      </View>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => [sh.btn, pressed && { opacity: 0.7 }]}>
          <Text style={sh.btnText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function TickerItem({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string;
}) {
  return (
    <View style={ti.wrap}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={ti.label}>{label}</Text>
      <Text style={[ti.value, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 16, marginTop: 20 },

  // Ticker strip
  tickerBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.primaryMid,
  },
  tickerDiv: { width: 1, backgroundColor: Colors.primaryMid, marginHorizontal: 10 },

  // Weather row
  weatherRow: { flexDirection: 'row', gap: 10 },
  agriCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.primaryMid,
    justifyContent: 'space-between',
  },
  agriTitle: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  agriRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  agriLabel: { fontSize: 10, color: Colors.textSecondary, flex: 1 },
  agriValue: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary, maxWidth: 70 },
  agriMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  agriMoreText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  // Quick access
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '30%', backgroundColor: '#fff', borderRadius: 18, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: Colors.gray[200],
  },
  quickIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  // Plant now
  plantCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 12, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  plantEmojiWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryBg, overflow: 'hidden' },
  plantImage: { width: '100%', height: '100%' },
  plantImageIcon: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantInfo: { flex: 1 },
  plantName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  plantMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  plantPrice: { alignItems: 'flex-end' },
  plantPriceUSD: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  plantPriceZWG: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Market banner
  marketBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginHorizontal: 16, marginTop: 20,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
  },
  marketBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marketIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  marketBannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  marketBannerSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  marketBannerArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },

  // Transport banner
  transportBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: 18, padding: 18,
    marginHorizontal: 16, marginTop: 12,
    shadowColor: Colors.primaryDark, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  transportLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  transportTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  transportSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.primaryBg, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  btnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});

const ti = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '800' },
});
