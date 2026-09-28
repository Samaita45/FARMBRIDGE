import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonRow } from '@/components/design-system';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { SparkCurve, valueToY } from '@/components/weather/spark-curve';
import { pointOnArc, sunPosition } from '@/components/weather/sun-path';
import sky from '@/constants/sky-gradients';
import { asHref } from '@/lib/href';
import { topChrome } from '@/lib/platform-ui';
import { useAuthStore } from '@/stores/authStore';
import type {
  AgriculturalWeather,
  CurrentWeather,
  DailyForecast,
} from '@/services/weatherService';
import { makeStyles } from '@/hooks/useThemedStyles';
import { useDS } from '@/contexts/theme';

interface WeatherHeroProps {
  greeting: string;
  locationLabel: string;
  /** How the location was determined, so the hero can say rather than imply. */
  locationSource?: 'gps' | 'profile' | 'default';
  onRefreshLocation?: () => void;
  notificationCount?: number;
  avatarUri?: string | null;
  avatarInitials?: string;

  current?: CurrentWeather;
  today?: DailyForecast;
  daily?: DailyForecast[];
  agricultural?: AgriculturalWeather;
  loading?: boolean;
  onOpenForecast?: () => void;

  /**
   * Which face to wear. Driven by the resolved colour scheme, not by the clock:
   * the point is that dark mode changes what the screen is *for*, not merely
   * what colour it is.
   */
  night?: boolean;
}

const ARC_HEIGHT = 84;
const ARC_DOTS = Array.from({ length: 21 }, (_, i) => i / 20);
const SUN_DOT = 16;
const CURVE_HEIGHT = 84;
const FROST_RISK_C = 4;

/**
 * A radial glow faked with stacked discs, because expo-linear-gradient is
 * linear only and react-native-svg is a native module this project cannot add
 * without invalidating its development build.
 *
 * Built from the spec in constants/sky-gradients.js so scripts/hero-contrast
 * composites the same discs this draws. Every disc carries the same alpha:
 * varying it along a curve put the largest opacity step on the innermost edge
 * and drew a bright ring exactly where the eye goes.
 */
function discs(spec: typeof sky.SUN_GLOW_SPEC) {
  return Array.from({ length: spec.count }, (_, i) => {
    const t = i / (spec.count - 1);
    return { id: i, size: Math.round(spec.maxSize - spec.span * t ** spec.curve) };
  });
}
const SUN_GLOW = discs(sky.SUN_GLOW_SPEC);
const MOON_GLOW = discs(sky.MOON_GLOW_SPEC);

const STARS = [
  { top: 26, left: '58%', size: 2 },
  { top: 54, left: '72%', size: 3 },
  { top: 40, left: '86%', size: 2 },
  { top: 86, left: '66%', size: 2 },
  { top: 108, left: '80%', size: 2 },
] as const;

/**
 * The home hero — greeting, identity, place, and the sky, on one surface.
 *
 * WHY THESE WERE MERGED. The header and the weather card each carried a
 * location and a profile avatar, so the screen opened with the same two facts
 * printed twice. They are one thing: where you are and what it is doing there.
 * Folding the card into the header removes the duplication, removes a section
 * heading, and shortens the screen by roughly a card and a half.
 *
 * DAY AND NIGHT ARE THE SAME COMPONENT. In light mode it is today: the sun on
 * its arc, soil moisture and the chance of rain — what decides whether you
 * irrigate this morning. In dark mode it becomes the night: the moon, the
 * overnight lows for the days ahead, the coldest of them marked, and frost
 * risk — what decides whether a tomato crop survives until morning. This is
 * what the separate "Tonight" card used to say; it says it here instead,
 * because a card that duplicates the hero's location and avatar to tell you
 * about the same sky is a third copy of the same two facts.
 *
 * NOTHING REQUIRED SITS BEHIND A WORKLET. Three times on this screen an
 * essential reading was parked behind an animation and vanished when the
 * animation did not run. The temperature, the location, the stats and the
 * curve are all correct on the first frame; the only thing that moves is the
 * sun settling onto its place, and it settles onto the place it already holds.
 */
export function WeatherHero({
  greeting,
  locationLabel,
  locationSource = 'default',
  onRefreshLocation,
  notificationCount = 0,
  avatarUri = null,
  avatarInitials = 'F',
  current,
  today,
  daily,
  agricultural,
  loading,
  onOpenForecast,
  night = false,
}: WeatherHeroProps) {
  const DS = useDS();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const reducedMotion = useReducedMotion();

  const firstName = user?.name?.split(' ')[0] ?? 'Farmer';
  const locationShort = locationLabel.split('·')[0]?.trim() ?? locationLabel;
  const badge = notificationCount > 99 ? '99+' : String(notificationCount);

  const sun =
    today?.sunrise && today?.sunset
      ? sunPosition(today.sunrise, today.sunset)
      : { progress: 0.5, isUp: false };
  const dot = pointOnArc(sun.progress);

  /*
    Starts at 1. If the worklet never fires the sun is simply already where it
    belongs — the motion is decoration on a reading that is right regardless.
  */
  const settleIn = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    settleIn.set(0);
    settleIn.set(withDelay(200, withSpring(1, { damping: 12, stiffness: 140, mass: 0.8 })));
  }, [reducedMotion, settleIn]);

  const sunStyle = useAnimatedStyle(() => ({
    // A percentage cannot go through a transform, so the motion is a scale and
    // the position — the thing that must be right — never depends on it.
    transform: [
      { translateX: -SUN_DOT / 2 },
      { translateY: -SUN_DOT / 2 },
      { scale: 0.4 + settleIn.value * 0.6 },
    ],
  }));

  // ── day readings ──
  const temperature = current ? Math.round(current.temp) : null;
  const rainChance = today ? Math.round(today.rainProbability) : null;
  // The API reports 0–1; a farmer reads percent.
  const soil = agricultural ? Math.round(agricultural.soilMoisture * 100) : null;

  // ── night readings ──
  const nights = (daily ?? []).slice(0, 7);
  const lows = nights.map((d) => d.minTemp);
  const coldestIndex = lows.length ? lows.indexOf(Math.min(...lows)) : -1;
  const coldest = coldestIndex >= 0 ? nights[coldestIndex] : undefined;
  const tonight = nights[0];
  const frostNights = lows.filter((v) => v <= FROST_RISK_C).length;
  const markerLeft =
    coldestIndex >= 0 && nights.length > 1 ? (coldestIndex / (nights.length - 1)) * 100 : 50;
  const markerTop =
    coldest && lows.length ? valueToY(coldest.minTemp, lows, CURVE_HEIGHT) : CURVE_HEIGHT / 2;

  const reading = night ? (tonight ? Math.round(tonight.minTemp) : null) : temperature;
  const caption = night
    ? loading
      ? 'Reading the night…'
      : tonight
        ? `Low tonight · ${nights.length} nights ahead`
        : 'No forecast yet'
    : loading
      ? 'Checking the sky…'
      : (current?.condition ?? 'No reading');

  /*
    The stops live in constants/sky-gradients.js so scripts/hero-contrast-check
    reads the same values this renders. The day sky was authored for a shorter
    card and measured 2.73:1 under the condition line at this height.
  */
  const stops = night ? sky.NIGHT_SKY : sky.DAY_SKY;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={stops}
        locations={sky.SKY_LOCATIONS}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.sky, { paddingTop: topChrome(insets.top) + DS.spacing.sm }]}>
        {(night ? MOON_GLOW : SUN_GLOW).map((layer) => {
          const spec = night ? sky.MOON_GLOW_SPEC : sky.SUN_GLOW_SPEC;
          return (
            <View
              key={layer.id}
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  width: layer.size,
                  height: layer.size,
                  borderRadius: layer.size / 2,
                  top: -layer.size / 2 + spec.cy,
                  left: -layer.size / 2 + spec.cx,
                  backgroundColor: `rgba(${spec.rgb[0]}, ${spec.rgb[1]}, ${spec.rgb[2]}, ${spec.alpha})`,
                },
              ]}
            />
          );
        })}

        {night
          ? STARS.map((s) => (
              <View
                key={`${s.top}-${s.left}`}
                pointerEvents="none"
                style={[
                  styles.star,
                  { top: s.top, left: s.left, width: s.size, height: s.size, borderRadius: s.size },
                ]}
              />
            ))
          : null}

        {/* ── identity ── the only avatar and the only bell on this screen */}
        <View style={styles.topRow}>
          <View style={styles.identity}>
            <Text style={styles.greeting} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {greeting}, {firstName}
            </Text>
            <Pressable
              onPress={onRefreshLocation}
              disabled={!onRefreshLocation}
              accessibilityRole="button"
              accessibilityLabel={`${LOCATION_CAPTION[locationSource]}: ${locationShort}. Tap to locate again.`}
              style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}>
              <Ionicons
                name={locationSource === 'gps' ? 'locate' : 'locate-outline'}
                size={13}
                color="rgba(255,255,255,0.95)"
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationShort}
              </Text>
              <Text style={styles.locationSource}>{LOCATION_CAPTION[locationSource]}</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'
            }
            onPress={() => router.push(asHref('/notifications'))}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
            <Ionicons name="notifications-outline" size={20} color={DS.colors.textInverse} />
            {notificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>

          <ProfileAvatar
            uri={avatarUri}
            initials={avatarInitials}
            size={40}
            embedded
            showCameraBadge={false}
            onPress={user ? () => router.push(asHref('/(tabs)/profile')) : undefined}
          />
        </View>

        {/* ── the reading ── */}
        <Pressable
          onPress={onOpenForecast}
          accessibilityRole="button"
          accessibilityLabel={
            reading != null
              ? `${reading} degrees, ${caption}, in ${locationLabel}. Open the seven day forecast.`
              : 'Weather. Open the seven day forecast.'
          }
          style={styles.readingBlock}>
          <View style={styles.readingRow}>
            <View style={styles.reading}>
              <View style={styles.tempRow}>
                <Text style={styles.temp} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                  {reading != null ? reading : '—'}
                </Text>
                <Text style={styles.degree}>°</Text>
              </View>
              <Text style={styles.condition} numberOfLines={1}>
                {caption}
              </Text>
            </View>
          </View>

          {night ? (
            <View style={styles.curveBox}>
              {lows.length > 1 ? (
                <>
                  <SparkCurve
                    values={lows}
                    width={CURVE_WIDTH}
                    height={CURVE_HEIGHT}
                    color="rgba(255,255,255,0.92)"
                    thickness={2}
                  />
                  {coldest ? (
                    <View
                      pointerEvents="none"
                      style={[styles.marker, { left: `${markerLeft}%`, top: markerTop }]}>
                      <View style={styles.markerDot} />
                      <Text style={styles.markerValue}>{Math.round(coldest.minTemp)}°</Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.arcBox} pointerEvents="none">
              {/*
                Dots along the same curve the sun is placed on, so the two can
                never disagree. Every position here is a percentage — a measured
                dome came back wider than the box that contained it.
              */}
              {ARC_DOTS.map((t) => {
                const p = pointOnArc(t);
                const passed = t <= sun.progress && sun.isUp;
                return (
                  <View
                    key={t}
                    style={[
                      styles.arcDot,
                      passed ? styles.arcDotPassed : null,
                      !sun.isUp ? styles.arcDotNight : null,
                      { left: `${p.xPercent}%`, top: `${p.yPercent}%` },
                    ]}
                  />
                );
              })}
              <Animated.View
                style={[
                  styles.sunDot,
                  { left: `${dot.xPercent}%`, top: `${dot.yPercent}%` },
                  sunStyle,
                  !sun.isUp && styles.sunDown,
                ]}
              />
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push(asHref('/(tabs)/market/search'))}
          accessibilityRole="search"
          accessibilityLabel="Search the marketplace"
          style={({ pressed }) => [
            styles.searchPill,
            pressed && styles.pressed,
          ]}>
          <Ionicons name="search" size={17} color={DS.colors.textSoft} />
          <Text style={styles.searchText} numberOfLines={1}>
            Search seeds, produce, equipment
          </Text>
        </Pressable>

        {!user ? (
          <ButtonRow style={styles.authRow}>
            <Link href="/(auth)/login" asChild>
              <Button title="Log in" variant="onImage" size="sm" style={styles.authBtn} />
            </Link>
            <Link href="/(auth)/register" asChild>
              <Button title="Register" size="sm" style={styles.authBtn} />
            </Link>
          </ButtonRow>
        ) : null}
      </LinearGradient>

      {/*
        The tiles sit on their own surface rather than on the gradient. The
        sky's lower stop is pale by design, and white type on it measures under
        2:1 — the readings that decide an irrigation go on a ground that holds
        them at full contrast.
      */}
      <View style={styles.tiles}>
        {night ? (
          <>
            <StatTile
              icon="snow-outline"
              label="Coldest night"
              value={coldest ? `${Math.round(coldest.minTemp)}` : '—'}
              suffix={coldest ? '°' : undefined}
              caption={coldest ? weekday(coldest.date) : 'No forecast yet'}
            />
            <StatTile
              icon="alert-circle-outline"
              label="Frost risk"
              value={lows.length ? `${frostNights}` : '—'}
              suffix={lows.length ? (frostNights === 1 ? ' night' : ' nights') : undefined}
              caption={
                !lows.length
                  ? 'No forecast yet'
                  : frostNights > 0
                    ? `At or below ${FROST_RISK_C}°`
                    : 'None in the week ahead'
              }
            />
          </>
        ) : (
          <>
            <StatTile
              icon="water-outline"
              label="Soil moisture"
              value={soil != null ? `${soil}` : '—'}
              suffix={soil != null ? '%' : undefined}
              caption={soilCaption(soil)}
            />
            <StatTile
              icon="rainy-outline"
              label="Rain chance"
              value={rainChance != null ? `${rainChance}` : '—'}
              suffix={rainChance != null ? '%' : undefined}
              caption={rainCaption(rainChance)}
            />
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Fixed rather than measured. The curve is decoration over a figure that is
 * already printed; measuring it introduced a state that rendered "no forecast"
 * whenever the box had not been laid out yet, which is every first frame.
 */
const CURVE_WIDTH = 150;

function StatTile({
  icon,
  label,
  value,
  suffix,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  suffix?: string;
  caption: string;
}) {
  const DS = useDS();
  const styles = useStyles();
  return (
    <View
      style={styles.tile}>
      <View style={styles.tileHead}>
        <Ionicons name={icon} size={14} color={DS.colors.textMuted} />
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.tileValueRow}>
        <Text
          style={styles.tileValue}
          maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {value}
        </Text>
        {suffix ? (
          <Text style={styles.tileSuffix}>{suffix}</Text>
        ) : null}
      </View>
      <Text style={styles.tileCaption} numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

const LOCATION_CAPTION: Record<'gps' | 'profile' | 'default', string> = {
  gps: 'your location',
  profile: 'from your profile',
  default: 'default',
};

function soilCaption(v: number | null): string {
  if (v == null) return 'No reading';
  if (v < 30) return 'Dry — irrigate';
  if (v < 60) return 'Adequate';
  return 'Wet — hold off';
}

function rainCaption(v: number | null): string {
  if (v == null) return 'No reading';
  if (v < 20) return 'Unlikely today';
  if (v < 60) return 'Possible today';
  return 'Likely today';
}

function weekday(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZW', { weekday: 'long' });
}

const useStyles = makeStyles((DS) => ({
  wrap: {
    backgroundColor: DS.colors.surface,
    borderBottomLeftRadius: DS.radius.xxl,
    borderBottomRightRadius: DS.radius.xxl,
    overflow: 'hidden',
  },
  sky: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.md },
  glow: { position: 'absolute' },
  star: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.85)' },
  pressed: { opacity: 0.85 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  identity: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: DS.typography.h3.fontSize,
    lineHeight: DS.typography.h3.lineHeight,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.95)',
    flexShrink: 1,
  },
  locationSource: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.82)',
  },

  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.danger,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
  },

  readingBlock: { marginTop: DS.spacing.md },
  readingRow: { flexDirection: 'row', alignItems: 'flex-start' },
  reading: { flex: 1, minWidth: 0 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-start' },
  temp: {
    fontSize: 64,
    lineHeight: 68,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
  },
  degree: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  condition: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.92)',
  },

  arcBox: {
    height: ARC_HEIGHT,
    marginTop: DS.spacing.xs,
    marginLeft: 96,
    marginRight: 8,
  },
  arcDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    marginLeft: -1.5,
    marginTop: -1.5,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  arcDotPassed: { backgroundColor: 'rgba(255,255,255,0.75)' },
  arcDotNight: { backgroundColor: 'rgba(255,255,255,0.22)' },
  sunDot: {
    position: 'absolute',
    width: SUN_DOT,
    height: SUN_DOT,
    borderRadius: SUN_DOT / 2,
    backgroundColor: '#FFD05C',
  },
  sunDown: { backgroundColor: 'rgba(255,255,255,0.55)' },

  curveBox: {
    height: CURVE_HEIGHT,
    width: CURVE_WIDTH,
    marginTop: DS.spacing.xs,
    alignSelf: 'flex-end',
  },
  marker: { position: 'absolute', alignItems: 'center' },
  markerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: -4.5,
    marginTop: -4.5,
    backgroundColor: '#FFFFFF',
  },
  markerValue: {
    marginTop: 2,
    marginLeft: -4.5,
    fontSize: 12,
    fontFamily: DS.fontFamily.bold,
    color: '#FFFFFF',
  },

  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.xs,
    marginTop: DS.spacing.md,
    paddingHorizontal: DS.spacing.sm + 2,
    height: 44,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
  },
  searchText: {
    flex: 1,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  authRow: { marginTop: DS.spacing.sm },
  authBtn: { flex: 1 },

  tiles: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm + 2,
    paddingBottom: DS.spacing.md,
    backgroundColor: DS.colors.surface,
  },
  tile: {
    flex: 1,
    gap: 2,
    padding: DS.spacing.sm,
    borderRadius: DS.radius.lg,
    backgroundColor: DS.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: DS.colors.borderLight,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tileLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
    flexShrink: 1,
  },
  tileValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  tileValue: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  tileSuffix: {
    fontSize: 13,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  tileCaption: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
}));
