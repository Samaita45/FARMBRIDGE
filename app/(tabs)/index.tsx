import { type Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CropTrendCard } from '@/components/cards/crop-trend-card';
import { FadeInView } from '@/components/design-system/FadeInView';
import { CropDemandChart } from '@/components/charts/crop-demand-chart';
import { MarketInsightCard } from '@/components/home/ai-insight-card';
import { InsightStrip } from '@/components/home/insight-strip';
import { HomeHeader } from '@/components/home/premium-hero-header';
import { PremiumSectionHeader } from '@/components/home/premium-section-header';
import { PlantNowCard } from '@/components/home/plant-now-card';
import { QuickActionsPremium } from '@/components/home/quick-actions-premium';
import { CropFilterRow, type CropCategory } from '@/components/home/crop-filter-row';
import { WeatherTodayCard } from '@/components/home/weather-today-card';
import { CropCardSkeleton } from '@/components/ui/skeleton';
import type { InsightItem } from '@/components/home/insight-strip';
import { WeatherForecastModal } from '@/components/weather/weather-forecast-modal';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { DS } from '@/constants/design-system';
import {
  CROPS,
  MARKET_PRODUCTS,
  getCropsForMonth,
  getTopDemandCrops,
} from '@/constants/zimbabwe-data';
import { useLocation } from '@/hooks/useLocation';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { useWeather } from '@/hooks/useWeather';
import { upsertCachedCropData, upsertCachedProduct } from '@/services/database';
import { isOnline } from '@/services/syncService';

const MONTH = new Date().getMonth() + 1;
const MONTH_NAME = new Date().toLocaleDateString('en-ZW', { month: 'long' });
const HOURS = new Date().getHours();
const GREETING =
  HOURS < 12 ? 'Good morning' : HOURS < 17 ? 'Good afternoon' : 'Good evening';

const FEATURED_CROP_IDS = ['tomatoes', 'maize', 'potatoes', 'groundnuts', 'mushrooms'];

export default function HomeScreen() {
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const { avatarUri, initials: avatarInitials, refresh: refreshAvatar } = useProfileAvatar();
  const {
    location,
    loading: locationLoading,
    source: locationSource,
    refresh: refreshLocation,
  } = useLocation();
  const { rate: fxRate, isIndicative: fxIsIndicative } = useExchangeRate();
  const { data: weather, isLoading: weatherLoading, refetch } = useWeather(location);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cropCategory, setCropCategory] = useState<CropCategory>(null);

  const topCrops = useMemo(() => {
    const demand = getTopDemandCrops(12);
    const featured = FEATURED_CROP_IDS.map((id) => CROPS.find((c) => c.id === id)).filter(
      Boolean,
    ) as typeof demand;
    const merged = [...featured];
    for (const c of demand) {
      if (!merged.some((m) => m.id === c.id)) merged.push(c);
    }
    return merged;
  }, []);

  /** The categories the catalogue actually contains, in the order they appear. */
  const cropCategories = useMemo(() => {
    const seen: (typeof CROPS)[number]['category'][] = [];
    for (const c of CROPS) if (!seen.includes(c.category)) seen.push(c.category);
    return seen;
  }, []);

  /** A real crop name per category, so each chip shows what it is filtering to. */
  const cropSample = useCallback(
    (category: (typeof CROPS)[number]['category']) =>
      CROPS.find((c) => c.category === category)?.name ?? category,
    []
  );

  const visibleCrops = useMemo(
    () =>
      (cropCategory ? topCrops.filter((c) => c.category === cropCategory) : topCrops).slice(0, 8),
    [topCrops, cropCategory]
  );

  const plantNow = useMemo(() => getCropsForMonth(MONTH).slice(0, 6), []);

  const insights = useMemo(
    () => [
      {
        id: 'fx',
        icon: 'swap-horizontal-outline',
        label: 'USD / ZWG',
        value: `1:${fxRate.usdToZwg}`,
        // The tile states its own provenance. A number about money must never
        // look more authoritative than its source actually is.
        trend: fxIsIndicative ? 'Indicative' : 'Live',
        tone: 'info',
      },
      {
        id: 'crop',
        icon: 'leaf-outline',
        label: 'Top crop',
        value: topCrops[0]?.name ?? '—',
        tone: 'success',
      },
      {
        id: 'rain',
        icon: 'rainy-outline',
        label: 'Rain',
        value:
          weather?.rain?.daysUntil != null
            ? weather.rain.daysUntil === 0
              ? 'Today'
              : `${weather.rain.daysUntil}d`
            : 'Dry',
        tone: 'warning',
      },
      {
        id: 'temp',
        icon: 'thermometer-outline',
        label: 'Temperature',
        value: weather?.current ? `${weather.current.temp}°C` : '—',
        tone: 'neutral',
      },
    ] satisfies InsightItem[],
    [topCrops, weather, fxRate, fxIsIndicative],
  );

  const insightMessage = useMemo(() => {
    const crop = topCrops[0]?.name ?? 'Tomatoes';
    const place = location.label.split('·')[0]?.trim() ?? 'Harare';
    return `${crop} show strong market demand this week in ${place}.`;
  }, [topCrops, location.label]);

  useEffect(() => {
    void (async () => {
      if (!(await isOnline())) return;
      try {
        await upsertCachedCropData('trends', JSON.stringify(getTopDemandCrops(20)));
        await upsertCachedCropData('all_crops', JSON.stringify(CROPS));
        for (const p of MARKET_PRODUCTS.slice(0, 24)) {
          await upsertCachedProduct(p.id, JSON.stringify(p));
        }
      } catch {
        /* cache best-effort */
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
    }, [refreshNotifications]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refreshNotifications(), refreshAvatar()]);
    setRefreshing(false);
  }, [refetch, refreshNotifications, refreshAvatar]);

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DS.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <HomeHeader
          locationLabel={location.label}
          greeting={GREETING}
          notificationCount={unreadCount}
          avatarUri={avatarUri}
          avatarInitials={avatarInitials}
          locationSource={locationSource}
          onRefreshLocation={() => void refreshLocation()}
        />

        <View style={s.body}>
          <FadeInView delay={0}>
            <InsightStrip items={insights} />
          </FadeInView>

          <FadeInView delay={1} style={s.block}>
            <MarketInsightCard message={insightMessage} locationLabel={location.label} />
          </FadeInView>

          <FadeInView delay={2} style={s.block}>
            <PremiumSectionHeader
              icon="partly-sunny-outline"
              // Names what is below it. The card is today only now; the rest of
              // the week lives behind the action.
              title="Today"
              actionLabel="7-day forecast"
              onPress={() => setWeatherModalOpen(true)}
            />
            <WeatherTodayCard
              current={weather?.current}
              daily={weather?.daily}
              agricultural={weather?.agricultural}
              loading={weatherLoading || locationLoading}
              onOpenForecast={() => setWeatherModalOpen(true)}
            />
          </FadeInView>

          <FadeInView delay={3} style={s.block}>
            <PremiumSectionHeader
              icon="trending-up"
              title="Crops in Demand"
              actionLabel="Market"
              onPress={() => router.push('/(tabs)/market' as Href)}
            />
            <CropFilterRow
              categories={cropCategories}
              value={cropCategory}
              onChange={setCropCategory}
              sampleFor={cropSample}
            />

            {/*
              Three states, not two. An empty filter is not a loading state, and
              rendering skeletons for it leaves someone waiting for crops that
              were never coming.
            */}
            {topCrops.length === 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hScroll}>
                {[1, 2, 3].map((i) => (
                  <CropCardSkeleton key={i} />
                ))}
              </ScrollView>
            ) : visibleCrops.length === 0 ? (
              <View style={s.filterEmpty}>
                <Text style={s.filterEmptyText}>
                  No crops in this group are showing strong demand right now.
                </Text>
                <Pressable
                  onPress={() => setCropCategory(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Show all crops"
                  hitSlop={8}>
                  <Text style={s.filterEmptyAction}>Show all crops</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hScroll}>
                {visibleCrops.map((crop) => (
                  <CropTrendCard key={crop.id} crop={crop} />
                ))}
              </ScrollView>
            )}
          </FadeInView>

          <FadeInView delay={4} style={s.block}>
            <CropDemandChart />
          </FadeInView>

          <FadeInView delay={5} style={s.block}>
            <PremiumSectionHeader
              icon="leaf"
              title={`Plant now · ${MONTH_NAME}`}
              actionLabel="Planner"
              onPress={() => router.push('/crop-management/planner' as Href)}
            />
            {plantNow.length === 0 ? (
              <View style={s.filterEmpty}>
                <Text style={s.filterEmptyText}>
                  Nothing in the catalogue has a planting window open in {MONTH_NAME}. The planner
                  shows what is coming next.
                </Text>
                <Pressable
                  onPress={() => router.push('/crop-management/planner' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Open the planner"
                  hitSlop={8}>
                  <Text style={s.filterEmptyAction}>Open the planner</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.cardRow}>
                {plantNow.map((crop) => (
                  <PlantNowCard
                    key={crop.id}
                    crop={crop}
                    onPress={() => router.push('/crop-management/planner' as Href)}
                  />
                ))}
              </ScrollView>
            )}
          </FadeInView>

          <FadeInView delay={6} style={s.block}>
            <PremiumSectionHeader icon="flash" title="Quick Actions" />
            <QuickActionsPremium />
          </FadeInView>

        </View>
      </ScrollView>

      <WeatherForecastModal
        visible={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        daily={weather?.daily ?? []}
        current={weather?.current}
        agricultural={weather?.agricultural}
        locationLabel={location.label}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  body: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
  },
  block: { marginTop: DS.spacing.lg },
  hScroll: { paddingRight: 8, paddingLeft: 2 },
  cardRow: { gap: DS.spacing.sm + 4, paddingRight: DS.spacing.md, paddingLeft: 2 },
  filterEmpty: {
    gap: 6,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
  },
  filterEmptyText: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  filterEmptyAction: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
});
