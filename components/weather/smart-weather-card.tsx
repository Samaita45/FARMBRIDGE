import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { pointOnArc, sunPosition } from '@/components/weather/sun-path';
import { DS } from '@/constants/design-system';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import type {
  AgriculturalWeather,
  CurrentWeather,
  DailyForecast,
} from '@/services/weatherService';

interface SmartWeatherCardProps {
  current?: CurrentWeather;
  today?: DailyForecast;
  agricultural?: AgriculturalWeather;
  locationLabel: string;
  loading?: boolean;
  onOpenForecast?: () => void;
}

const ARC_HEIGHT = 96;
/** Evenly spaced along the sun's travel, which is what the dashes represent. */
const ARC_DOTS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Widest and faintest first, so the alphas accumulate toward the centre.
 *
 * Generated on a curve rather than hand-listed: five hand-picked steps left
 * visible rings where each disc's edge landed, and the fix for banding is more
 * steps with smaller jumps between them, which is tedious to maintain by hand.
 */
const GLOW_LAYERS = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return {
    size: Math.round(300 - 260 * t),
    // Quadratic: nearly flat across the outer discs, steep at the core.
    alpha: Number((0.05 + 0.8 * t ** 3).toFixed(3)),
  };
});
const SUN_DOT = 18;

/**
 * Today's weather, at a glance.
 *
 * Built to the reference: a sky that darkens toward the top, the sun glowing
 * out of one corner, the temperature large enough to read across a room, and
 * the day's arc drawn underneath it.
 *
 * EVERY NUMBER ON IT IS REAL. The reference pairs Air Quality Index with Cloud
 * Cover; this app measures neither, and inventing two plausible figures for a
 * farmer to plan around is not a design decision worth making. The two tiles
 * carry soil moisture and the chance of rain, which the forecast actually
 * returns and which are the two things that decide whether you irrigate today.
 *
 * THE SUN ON THE ARC IS WHERE THE SUN IS. Its position comes from the
 * forecast's own sunrise and sunset, not from a fixed 6-to-6 day. After sunset
 * the dot rests at the end of the arc and the arc dims, rather than the dot
 * hovering somewhere it could not be.
 *
 * NO SVG. The arc is the top edge of a very wide ellipse, clipped by its
 * container. react-native-svg would draw it in one line and would also be a
 * native module — and this project is mid-way through a development build that
 * a new native dependency would invalidate.
 */
export function SmartWeatherCard({
  current,
  today,
  agricultural,
  locationLabel,
  loading,
  onOpenForecast,
}: SmartWeatherCardProps) {
  const { avatarUri, initials } = useProfileAvatar();
  const reducedMotion = useReducedMotion();

  const sun =
    today?.sunrise && today?.sunset
      ? sunPosition(today.sunrise, today.sunset)
      : { progress: 0.5, isUp: false };

  const dot = pointOnArc(sun.progress);

  /*
    The sun travels to its place rather than appearing there. It is the one
    element on the card that represents movement, so it is the one worth
    animating; everything else simply fades up.
  */
  /*
    Starts at 1, not 0.

    An earlier version faded the temperature up from nothing and the whole
    reading vanished the moment the animation did not run — the same failure as
    a button whose background lives inside a callback nobody calls. Motion here
    is decoration on top of a card that is already readable: the sun travels
    along its arc, and that is all. If the worklet never fires, the sun is
    simply already where it belongs.
  */
  const settleIn = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    settleIn.set(0);
    settleIn.set(withDelay(200, withSpring(1, { damping: 12, stiffness: 140, mass: 0.8 })));
  }, [reducedMotion, settleIn]);

  /*
    The sun settles onto its place rather than sliding to it. Its position is a
    percentage, and a percentage cannot go through a transform — so the motion
    is a scale, and the one thing that must be right, where it sits, is right
    from the first frame whether or not the spring ever runs.
  */
  const sunStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -SUN_DOT / 2 },
      { translateY: -SUN_DOT / 2 },
      { scale: 0.4 + settleIn.value * 0.6 },
    ],
  }));

  const temperature = current ? Math.round(current.temp) : null;
  const rainChance = today ? Math.round(today.rainProbability) : null;
  // The API reports 0–1; a farmer reads percent.
  const soil = agricultural ? Math.round(agricultural.soilMoisture * 100) : null;

  return (
    <Pressable
      onPress={onOpenForecast}
      accessibilityRole="button"
      accessibilityLabel={
        temperature != null
          ? `${temperature} degrees, ${current?.condition ?? ''} in ${locationLabel}. Open the seven day forecast.`
          : 'Weather. Open the seven day forecast.'
      }
      style={styles.wrap}>
      <LinearGradient
        // Deepest at the top so the white type has something to sit on, opening
        // out toward the horizon the way a sky actually does.
        colors={['#1D5FA8', '#3E8BD0', '#8FC2E8', '#DCEBF5']}
        locations={[0, 0.42, 0.76, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.sky}>
        {/*
          The sun's glow, built from two soft discs rather than a radial
          gradient — expo-linear-gradient is linear only, and two overlapping
          circles at low opacity read as light better than a hard edge does.
        */}
        {/*
          Four concentric discs, each barely there. A single circle of solid
          colour has a hard edge no matter how transparent it is, and reads as
          a disc sitting on the sky rather than as light coming through it.
          Stacked, their alphas sum toward the centre and approximate the
          falloff a radial gradient would give — which expo-linear-gradient,
          being linear, cannot.
        */}
        {GLOW_LAYERS.map((layer) => (
          <View
            key={layer.size}
            pointerEvents="none"
            style={[
              styles.glow,
              {
                width: layer.size,
                height: layer.size,
                borderRadius: layer.size / 2,
                top: -layer.size / 2 + 34,
                left: -layer.size / 2 + 46,
                backgroundColor: `rgba(255, 208, 92, ${layer.alpha})`,
              },
            ]}
          />
        ))}

        <View style={styles.topRow}>
          <View style={styles.locationPill}>
            <Ionicons name="location" size={13} color="rgba(255,255,255,0.95)" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
          <ProfileAvatar uri={avatarUri} initials={initials} size={40} embedded showCameraBadge={false} />
        </View>

        <View style={styles.readingRow}>
          <View style={styles.reading}>
            <View style={styles.tempRow}>
              <Text style={styles.temp} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {temperature != null ? temperature : '—'}
              </Text>
              <Text style={styles.degree}>°</Text>
            </View>
            <Text style={styles.condition} numberOfLines={1}>
              {loading ? 'Checking the sky…' : (current?.condition ?? 'No reading')}
            </Text>
          </View>
        </View>

        {/* ── the day's arc ── */}
        <View style={styles.arcBox} pointerEvents="none">
          {/*
            The arc is drawn as dots along the same curve the sun is placed on,
            so the two can never disagree. A border-radius dome was tried first
            and needed the container measured; the measurement came back wider
            than the container and the arc left the box entirely. Dots need no
            measurement at all — every position here is a percentage.
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

        <View style={styles.footRow}>
          <Text style={styles.footText}>{formatTime(new Date())}</Text>
          <Text style={styles.footText}>{formatDate(new Date())}</Text>
        </View>
      </LinearGradient>

      {/*
        The tiles overlap the sky's lower edge, as in the reference. It keeps
        them tied to the card rather than reading as a separate row, and the
        gap under the temperature is where that overlap lands.
      */}
      <View style={styles.tiles}>
        <StatTile
          label="Soil moisture"
          icon="water-outline"
          value={soil != null ? `${soil}` : '—'}
          suffix={soil != null ? '%' : undefined}
          caption={soilCaption(soil)}
          fill={soil != null ? soil / 100 : 0}
          tone="soil"
        />
        <StatTile
          label="Rain chance"
          icon="rainy-outline"
          value={rainChance != null ? `${rainChance}` : '—'}
          suffix={rainChance != null ? '%' : undefined}
          caption={rainCaption(rainChance)}
          fill={rainChance != null ? rainChance / 100 : 0}
          tone="rain"
        />
      </View>
    </Pressable>
  );
}

function StatTile({
  label,
  icon,
  value,
  suffix,
  caption,
  fill,
  tone,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  suffix?: string;
  caption: string;
  fill: number;
  tone: 'soil' | 'rain';
}) {
  const reducedMotion = useReducedMotion();
  const grow = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      grow.set(1);
      return;
    }
    grow.set(
      withDelay(220, withTiming(1, { duration: DS.motion.slow, easing: Easing.out(Easing.cubic) }))
    );
  }, [reducedMotion, grow]);

  /*
    The bar grows by translating a full-width fill, not by animating `width`
    and not by scaling it. Width cannot be driven on the UI thread, and a scaleX
    would squeeze the whole gradient into the filled part, so the colour at the
    tip would read the same at 10% as at 90% — which is the one thing the
    gradient is there to tell you apart.
  */
  const barStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(fill, 0), 1) * grow.value;
    return { transform: [{ translateX: -trackWidth * (1 - progress) }] };
  });

  return (
    <View style={styles.tile}>
      <View style={styles.tileHead}>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name={icon} size={17} color={DS.colors.textMuted} />
      </View>

      <View style={styles.tileValueRow}>
        <Text style={styles.tileValue}>{value}</Text>
        {suffix ? <Text style={styles.tileSuffix}>{suffix}</Text> : null}
      </View>

      <Text style={styles.tileCaption} numberOfLines={1}>
        {caption}
      </Text>

      <View
        style={styles.barTrack}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.barClip, barStyle]}>
          <LinearGradient
            colors={
              tone === 'soil'
                ? ['#C8A06A', '#7BAE68', '#2F7D5B']
                : ['#BFD9EF', '#5FA8DC', '#1D5FA8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

/** Plain words for a number most people have never had to read. */
function soilCaption(percent: number | null): string {
  if (percent == null) return 'No reading';
  if (percent < 15) return 'Dry';
  if (percent < 30) return 'Low';
  if (percent < 45) return 'Good';
  return 'Wet';
}

function rainCaption(percent: number | null): string {
  if (percent == null) return 'No reading';
  if (percent < 20) return 'Unlikely';
  if (percent < 50) return 'Possible';
  if (percent < 80) return 'Likely';
  return 'Expected';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-ZW', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  wrap: { borderRadius: DS.radius.xxl, overflow: 'hidden', backgroundColor: DS.colors.surface },
  sky: { paddingTop: DS.spacing.md, paddingBottom: DS.spacing.xl + DS.spacing.lg },

  // Two discs, the outer one barely there, so the light falls off gradually.
  glow: { position: 'absolute' },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  locationText: {
    flexShrink: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: '#FFFFFF',
  },

  readingRow: { paddingHorizontal: DS.spacing.md, marginTop: DS.spacing.md },
  reading: { alignSelf: 'flex-start' },
  tempRow: { flexDirection: 'row', alignItems: 'flex-start' },
  temp: {
    fontSize: 64,
    lineHeight: 70,
    fontFamily: DS.fontFamily.bold,
    color: '#FFFFFF',
  },
  degree: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: DS.fontFamily.bold,
    color: 'rgba(255,255,255,0.9)',
  },
  condition: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.92)',
  },

  /*
    Inset from the left so the arc's descending leg clears the temperature
    rather than running through the word underneath it.
  */
  arcBox: {
    marginTop: -6,
    marginLeft: DS.spacing.xl + DS.spacing.md,
    marginRight: DS.spacing.lg,
    height: ARC_HEIGHT,
    position: 'relative',
  },
  /*
    Every dot is placed by percentage and then pulled back by half its own size,
    so the percentage lands on the dot's centre rather than its top-left corner.
  */
  arcDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginLeft: -1.5,
    marginTop: -1.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  // The part of the day already behind you reads brighter than the part ahead.
  arcDotPassed: { backgroundColor: 'rgba(255,255,255,0.85)', width: 4, height: 4, borderRadius: 2 },
  arcDotNight: { backgroundColor: 'rgba(255,255,255,0.22)' },
  sunDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SUN_DOT,
    height: SUN_DOT,
    borderRadius: SUN_DOT / 2,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 3,
    borderColor: 'rgba(255, 214, 120, 0.85)',
  },
  // After sunset the dot stops claiming to be the sun.
  sunDown: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: 'rgba(255,255,255,0.35)',
  },

  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    marginTop: DS.spacing.sm,
  },
  footText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.88)',
  },

  tiles: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.sm + 4,
    // Pulls the tiles up over the sky's lower edge.
    marginTop: -DS.spacing.xl - 8,
    paddingBottom: DS.spacing.sm + 4,
  },
  tile: {
    flex: 1,
    gap: 4,
    padding: DS.spacing.sm + 4,
    borderRadius: DS.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: DS.layout.hairline,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileLabel: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  tileValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  tileValue: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  tileSuffix: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  tileCaption: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: DS.colors.surfaceMuted,
    marginTop: 2,
  },
  barClip: { ...StyleSheet.absoluteFill, borderRadius: 4, overflow: 'hidden' },
});
