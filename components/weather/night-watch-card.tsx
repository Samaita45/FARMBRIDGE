import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { SparkCurve, valueToY } from '@/components/weather/spark-curve';
import { DS } from '@/constants/design-system';
import type { DailyForecast } from '@/services/weatherService';
import type { FarmTask } from '@/types/crop-management';

interface NightWatchCardProps {
  daily?: DailyForecast[];
  /** Shown in the greeting. Just the first name. */
  name?: string;
  /** The next thing due. Omitted when there is nothing. */
  nextTask?: FarmTask | null;
  loading?: boolean;
  onOpenForecast?: () => void;
  onOpenTask?: (task: FarmTask) => void;
}

const CURVE_HEIGHT = 96;
/** Below this, tender crops are at risk overnight. */
const FROST_RISK_C = 4;

type Range = { key: string; label: string; nights: number };

/**
 * Overnight lows for the nights ahead.
 *
 * WHY THIS CARD EXISTS IN A FARMING APP. The reference for it is a sleep
 * tracker, and the lesson it teaches is the dark treatment rather than the
 * subject: contrast, depth, and a few quiet details. Lifting the subject too
 * would have meant inventing sleep hours and a music player for people who
 * opened an app about their farm — a screenful of numbers belonging to nobody.
 * The night has a real meaning here instead. A cold night is what kills a
 * tomato crop in Nyanga, and the overnight low is the number a farmer wants
 * before dark.
 *
 * EVERY VALUE COMES FROM THE FORECAST. The curve is the minimum temperature of
 * each night ahead, the marker sits on the coldest of them, and the two figures
 * beneath are computed from the same series. The range chips offer only the
 * spans the forecast actually covers — seven days is what the service returns,
 * so there is no month or year to choose, and no chip pretending otherwise.
 */
export function NightWatchCard({
  daily,
  name,
  nextTask,
  loading,
  onOpenForecast,
  onOpenTask,
}: NightWatchCardProps) {
  const reducedMotion = useReducedMotion();
  /*
    Seeded from the window rather than started at zero.

    onLayout is the accurate answer but it arrives a frame late, and on some
    hosts it does not arrive at all — the day card's own measurement came back
    wider than the box it was measuring. Starting from the window width minus
    this card's margins means the curve is drawn correctly on the first frame
    on any ordinary phone, and onLayout then corrects it for anything unusual:
    a tablet, a split screen, a rotation.
  */
  const [curveWidth, setCurveWidth] = useState(
    () => Math.max(0, Dimensions.get('window').width - DS.spacing.md * 2 - DS.spacing.md * 2)
  );

  const nights = daily ?? [];
  const ranges = useMemo<Range[]>(() => {
    const options: Range[] = [];
    if (nights.length >= 3) options.push({ key: '3n', label: '3 nights', nights: 3 });
    if (nights.length >= 5) options.push({ key: '5n', label: '5 nights', nights: 5 });
    if (nights.length >= 2) {
      options.push({ key: 'all', label: `${nights.length} nights`, nights: nights.length });
    }
    return options;
  }, [nights.length]);

  const [rangeKey, setRangeKey] = useState<string | null>(null);
  const active = ranges.find((r) => r.key === rangeKey) ?? ranges[ranges.length - 1];
  const series = nights.slice(0, active?.nights ?? nights.length);
  const lows = series.map((d) => d.minTemp);

  // The coldest night is the one worth marking; it is the one that does damage.
  const coldestIndex = lows.length ? lows.indexOf(Math.min(...lows)) : -1;
  const coldest = coldestIndex >= 0 ? series[coldestIndex] : undefined;
  const tonight = series[0];
  const averageLow = lows.length
    ? Math.round((lows.reduce((sum, v) => sum + v, 0) / lows.length) * 10) / 10
    : null;
  const frostNights = lows.filter((v) => v <= FROST_RISK_C).length;

  /*
    NO WIPE OVER THE CURVE, AND THAT IS A DELIBERATE RETREAT.

    This drew itself in behind a mask that slid off to the right. It looked
    good and it hid the whole week whenever the animation did not finish —
    which is the third time on this screen that something necessary was parked
    behind a worklet. The curve is data. It is drawn on the first frame and
    stays drawn.

    The marker is the only thing that moves, because the marker is decoration:
    if its spring never runs, a farmer has lost a flourish, not the forecast.
  */
  const markerIn = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    markerIn.set(0);
    markerIn.set(withDelay(240, withSpring(1, { damping: 13, stiffness: 150, mass: 0.7 })));
  }, [reducedMotion, rangeKey, markerIn]);

  const markerStyle = useAnimatedStyle(() => ({
    opacity: markerIn.value,
    transform: [{ scale: 0.6 + markerIn.value * 0.4 }],
  }));

  const markerLeft =
    coldestIndex >= 0 && series.length > 1 ? (coldestIndex / (series.length - 1)) * 100 : 50;
  const markerTop =
    coldest && lows.length ? valueToY(coldest.minTemp, lows, CURVE_HEIGHT) : CURVE_HEIGHT / 2;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        /*
          The last stop used to be #C79CB4, which measures 2.37:1 against the
          white text sitting on it — the stats at the bottom of the card were
          the least readable thing on the screen. #8C6699 keeps the dawn-pink
          direction the reference has and gets white to 4.69:1.
        */
        colors={['#2C2B63', '#4B3F8F', '#7A63A0', '#8C6699']}
        locations={[0, 0.38, 0.74, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.sky}>
        {/* The moon, lit from the upper left, with the same stacked falloff the
            sun uses on the day card. */}
        {MOON_GLOW.map((layer) => (
          <View
            key={layer.size}
            pointerEvents="none"
            style={[
              styles.glow,
              {
                width: layer.size,
                height: layer.size,
                borderRadius: layer.size / 2,
                top: -layer.size / 2 + 40,
                left: -layer.size / 2 + 50,
                backgroundColor: `rgba(226, 226, 255, ${layer.alpha})`,
              },
            ]}
          />
        ))}

        {STARS.map((star) => (
          <View
            key={`${star.top}-${star.left}`}
            pointerEvents="none"
            style={[
              styles.star,
              { top: `${star.top}%`, left: `${star.left}%`, opacity: star.alpha },
            ]}
          />
        ))}

        <Pressable
          onPress={onOpenForecast}
          accessibilityRole="button"
          accessibilityLabel={
            tonight
              ? `Tonight's low ${Math.round(tonight.minTemp)} degrees. Open the forecast.`
              : 'Overnight lows. Open the forecast.'
          }
          style={styles.head}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting()}
            {name ? `, ${name}` : ''}
          </Text>
          <View style={styles.tonightRow}>
            <Text style={styles.tonight} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {tonight ? Math.round(tonight.minTemp) : '—'}
            </Text>
            <Text style={styles.tonightUnit}>°</Text>
            <Text style={styles.tonightLabel}>tonight</Text>
          </View>
        </Pressable>

        {/* ── the nights ahead ── */}
        <View
          style={styles.curveBox}
          onLayout={(e: LayoutChangeEvent) => {
            const w = Math.round(e.nativeEvent.layout.width);
            if (w !== curveWidth) setCurveWidth(w);
          }}>
          {/*
            Three states, not two. "No forecast yet" is a claim about the data,
            and it must not be made while the only thing missing is a width —
            the box measures itself a frame after it mounts, and saying there is
            no forecast in that gap tells the farmer something untrue about
            their week.
          */}
          {lows.length > 1 && curveWidth > 0 ? (
            <>
              <SparkCurve
                values={lows}
                width={curveWidth}
                height={CURVE_HEIGHT}
                color="rgba(255,255,255,0.82)"
                thickness={2}
              />
              {coldest ? (
                <Animated.View
                  style={[
                    styles.marker,
                    { left: `${markerLeft}%`, top: markerTop },
                    markerStyle,
                  ]}>
                  <View style={styles.markerPill}>
                    <Text style={styles.markerValue}>{Math.round(coldest.minTemp)}°</Text>
                  </View>
                  <View style={styles.markerStem} />
                </Animated.View>
              ) : null}
            </>
          ) : lows.length > 1 ? null : (
            <View style={styles.curveEmpty}>
              <Text style={styles.curveEmptyText}>
                {loading ? 'Reading the nights ahead…' : 'No forecast yet'}
              </Text>
            </View>
          )}
        </View>

        {coldest ? (
          <View style={styles.coldestRow}>
            <Text style={styles.coldestLabel}>
              Coldest night · {weekday(coldest.date)}
            </Text>
            {coldest.minTemp <= FROST_RISK_C ? (
              <View style={styles.frostChip}>
                <Ionicons name="snow-outline" size={12} color="#0F172A" />
                <Text style={styles.frostChipText}>Frost risk</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {ranges.length > 1 ? (
          <View style={styles.ranges}>
            {ranges.map((range) => {
              const on = range.key === (active?.key ?? '');
              return (
                <Pressable
                  key={range.key}
                  onPress={() => setRangeKey(range.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Show ${range.label}`}
                  hitSlop={6}
                  style={[styles.range, on && styles.rangeOn]}>
                  <Text style={[styles.rangeText, on && styles.rangeTextOn]}>{range.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.stats}>
          <Stat
            icon="thermometer-outline"
            value={averageLow != null ? `${averageLow}°` : '—'}
            label="Average low"
          />
          <Stat
            icon="snow-outline"
            value={`${frostNights}`}
            label={frostNights === 1 ? 'Night near frost' : 'Nights near frost'}
          />
        </View>
      </LinearGradient>

      {/*
        The reference puts a music player here. This carries the next task due
        instead — the thing a farmer would actually act on after reading a cold
        night, and something the app already knows. When there is nothing due it
        is not rendered at all rather than shown empty.
      */}
      {nextTask ? (
        <Pressable
          onPress={() => onOpenTask?.(nextTask)}
          accessibilityRole="button"
          accessibilityLabel={`Next task: ${nextTask.title} for ${nextTask.cropName}`}
          style={({ pressed }) => [styles.taskBar, pressed && styles.pressed]}>
          <View style={styles.taskIcon}>
            <Ionicons name="leaf-outline" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.taskText}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {nextTask.title}
            </Text>
            <Text style={styles.taskMeta} numberOfLines={1}>
              {nextTask.cropName} · {dueLabel(nextTask.dueDate)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={17} color="rgba(255,255,255,0.92)" />
      </View>
      <View style={styles.flex}>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function weekday(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'soon';
  return date.toLocaleDateString('en-ZW', { weekday: 'long' });
}

function dueLabel(iso: string): string {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 'no date';
  const days = Math.round((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

const MOON_GLOW = Array.from({ length: 22 }, (_, i) => {
  const t = i / 21;
  return {
    size: Math.round(240 - 198 * t),
    // Quartic, and gentler at the top end: on a dark ground the eye finds the
    // edge of every disc, so the steps between them have to be smaller than
    // they need to be against a bright sky.
    alpha: Number((0.025 + 0.62 * t ** 4).toFixed(3)),
  };
});

/** Fixed, not random: a constellation that moves on every render is a distraction. */
const STARS = [
  { top: 8, left: 32, alpha: 0.55 },
  { top: 15, left: 58, alpha: 0.35 },
  { top: 5, left: 74, alpha: 0.5 },
  { top: 22, left: 88, alpha: 0.3 },
  { top: 30, left: 18, alpha: 0.28 },
];

const styles = StyleSheet.create({
  wrap: { borderRadius: DS.radius.xxl, overflow: 'hidden', backgroundColor: '#2C2B63' },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  sky: { paddingTop: DS.spacing.md, paddingBottom: DS.spacing.md },
  glow: { position: 'absolute' },
  star: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
  },

  head: { paddingHorizontal: DS.spacing.md, alignItems: 'center' },
  greeting: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.86)',
  },
  tonightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 2 },
  tonight: {
    fontSize: 52,
    lineHeight: 58,
    fontFamily: DS.fontFamily.bold,
    color: '#FFFFFF',
  },
  tonightUnit: {
    fontSize: 26,
    lineHeight: 42,
    fontFamily: DS.fontFamily.bold,
    color: 'rgba(255,255,255,0.9)',
  },
  tonightLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 30,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.72)',
    marginLeft: 4,
  },

  curveBox: {
    height: CURVE_HEIGHT,
    marginTop: DS.spacing.sm,
    marginHorizontal: DS.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  curveEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  curveEmptyText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
  },

  marker: { position: 'absolute', alignItems: 'center', marginLeft: -24, marginTop: -38 },
  markerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  markerValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: '#2C2B63',
  },
  markerStem: { width: 1.5, height: 14, backgroundColor: 'rgba(255,255,255,0.7)' },

  coldestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    marginTop: DS.spacing.xs,
  },
  coldestLabel: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.88)',
  },
  frostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(226,240,255,0.92)',
  },
  frostChipText: { fontSize: 11, fontFamily: DS.fontFamily.bold, color: '#0F172A' },

  ranges: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: DS.spacing.md,
    marginTop: DS.spacing.sm,
  },
  range: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  rangeOn: { backgroundColor: 'rgba(255,255,255,0.92)' },
  rangeText: {
    fontSize: 12,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.72)',
  },
  rangeTextOn: { color: '#2C2B63' },

  stats: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    marginTop: DS.spacing.md,
  },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.88)',
  },

  taskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    margin: DS.spacing.sm + 2,
    padding: DS.spacing.sm + 2,
    borderRadius: DS.radius.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: DS.layout.hairline,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  taskText: { flex: 1, gap: 1 },
  taskTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: '#FFFFFF',
  },
  taskMeta: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.72)',
  },
});
