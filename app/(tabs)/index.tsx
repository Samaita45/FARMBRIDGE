import { type Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CropTrendCard } from '@/components/cards/crop-trend-card';
import { FadeInView } from '@/components/design-system/FadeInView';
import { SubscriptionBanner } from '@/components/cards/subscription-banner';
import { CropDemandChart } from '@/components/charts/crop-demand-chart';
import { AiInsightCard } from '@/components/home/ai-insight-card';
import { InsightStrip } from '@/components/home/insight-strip';
import { PremiumHeroHeader } from '@/components/home/premium-hero-header';
import { PremiumSectionHeader } from '@/components/home/premium-section-header';
import { PlantNowCard } from '@/components/home/plant-now-card';
import { QuickActionsPremium } from '@/components/home/quick-actions-premium';
import { WeatherGlassRow } from '@/components/home/weather-glass-row';
import { CropCardSkeleton } from '@/components/ui/skeleton';
import { WeatherForecastModal } from '@/components/weather/weather-forecast-modal';
import { EXCHANGE_RATE } from '@/constants/market-stats';
import { Premium } from '@/constants/premium-home';
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
import { useAuthStore, selectIsSubscribed } from '@/stores/authStore';

const MONTH = new Date().getMonth() + 1;
const HOURS = new Date().getHours();
const GREETING =
  HOURS < 12 ? 'Good morning' : HOURS < 17 ? 'Good afternoon' : 'Good evening';

const FEATURED_CROP_IDS = ['tomatoes', 'maize', 'potatoes', 'groundnuts', 'mushrooms'];

export default function HomeScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const { avatarUri, initials: avatarInitials, refresh: refreshAvatar } = useProfileAvatar();
  const { location, loading: locationLoading } = useLocation();
  const { data: weather, isLoading: weatherLoading, refetch } = useWeather(location);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const topCrops = useMemo(() => {
    const demand = getTopDemandCrops(12);
    const featured = FEATURED_CROP_IDS.map((id) => CROPS.find((c) => c.id === id)).filter(
      Boolean,
    ) as typeof demand;
    const merged = [...featured];
    for (const c of demand) {
      if (!merged.some((m) => m.id === c.id)) merged.push(c);
    }
    return merged.slice(0, 8);
  }, []);

  const plantNow = useMemo(() => getCropsForMonth(MONTH).slice(0, 4), []);

  const insights = useMemo(
    () => [
      {
        id: 'fx',
        icon: 'swap-horizontal' as const,
        label: 'USD / ZWG',
        value: `1:${EXCHANGE_RATE.usdToZwg}`,
        trend: 'Live rate',
        colors: ['#EFF6FF', '#DBEAFE'] as [string, string],
        accent: Premium.primary,
      },
      {
        id: 'crop',
        icon: 'leaf' as const,
        label: 'Top crop',
        value: topCrops[0]?.name ?? '—',
        colors: ['#F0FDF4', '#DCFCE7'] as [string, string],
        accent: Premium.green,
      },
      {
        id: 'rain',
        icon: 'rainy' as const,
        label: 'Rain',
        value:
          weather?.rain?.daysUntil != null
            ? weather.rain.daysUntil === 0
              ? 'Today'
              : `${weather.rain.daysUntil}d`
            : 'Dry',
        colors: ['#FFF7ED', '#FFEDD5'] as [string, string],
        accent: Premium.orange,
      },
      {
        id: 'temp',
        icon: 'thermometer' as const,
        label: 'Temperature',
        value: weather?.current ? `${weather.current.temp}°C` : '—',
        colors: ['#F5F3FF', '#EDE9FE'] as [string, string],
        accent: Premium.purple,
      },
    ],
    [topCrops, weather],
  );

  const aiMessage = useMemo(() => {
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
  }, [refetch, refreshNotifications]);

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Premium.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <PremiumHeroHeader
          locationLabel={location.label}
          greeting={GREETING}
          notificationCount={unreadCount}
          avatarUri={avatarUri}
          avatarInitials={avatarInitials}
        />

        <View style={s.body}>
          <FadeInView delay={0}>
            <InsightStrip items={insights} />
          </FadeInView>

          <FadeInView delay={1} style={s.block}>
            <AiInsightCard message={aiMessage} locationLabel={location.label} />
          </FadeInView>

          <FadeInView delay={2} style={s.block}>
            <PremiumSectionHeader
              icon="partly-sunny-outline"
              title="Weather & Farm"
              actionLabel="7-day"
              onPress={() => setWeatherModalOpen(true)}
            />
            <WeatherGlassRow
              current={weather?.current}
              agricultural={weather?.agricultural}
              loading={weatherLoading || locationLoading}
              onPress={() => setWeatherModalOpen(true)}
            />
          </FadeInView>

          <FadeInView delay={3} style={s.block}>
            <PremiumSectionHeader
              icon="trending-up"
              title="Crops in Demand"
              actionLabel="Market"
              onPress={() => router.push('/(tabs)/market' as Href)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.hScroll}>
              {topCrops.length === 0
                ? [1, 2, 3].map((i) => <CropCardSkeleton key={i} />)
                : topCrops.map((crop) => <CropTrendCard key={crop.id} crop={crop} />)}
            </ScrollView>
          </FadeInView>

          <FadeInView delay={4} style={s.block}>
            <CropDemandChart />
          </FadeInView>

          <FadeInView delay={5} style={s.block}>
            <PremiumSectionHeader
              icon="leaf"
              title="Plant Now"
              actionLabel="Planner"
              onPress={() => router.push('/crop-management/planner' as Href)}
            />
            {plantNow.map((crop) => (
              <PlantNowCard
                key={crop.id}
                crop={crop}
                onPress={() => router.push('/crop-management/planner' as Href)}
              />
            ))}
          </FadeInView>

          <FadeInView delay={6} style={s.block}>
            <PremiumSectionHeader icon="flash" title="Quick Actions" />
            <QuickActionsPremium />
          </FadeInView>

          {!isSubscribed ? (
            <FadeInView delay={7} style={s.block}>
              <SubscriptionBanner />
            </FadeInView>
          ) : null}
        </View>
      </ScrollView>

      <WeatherForecastModal
        visible={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        daily={weather?.daily ?? []}
        agricultural={weather?.agricultural}
        locationLabel={location.label}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Premium.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  body: {
    paddingHorizontal: 20,
    marginTop: -24,
    gap: 0,
  },
  block: { marginTop: 28 },
  hScroll: { paddingRight: 8, paddingLeft: 2 },
});
