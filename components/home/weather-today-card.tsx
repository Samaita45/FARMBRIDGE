import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { DS } from '@/constants/design-system';
import { skyFor } from '@/constants/sky';
import { MOTI_SPRING, MOTI_TRANSITION } from '@/lib/motion';
import type {
  AgriculturalWeather,
  CurrentWeather,
  DailyForecast,
} from '@/services/weatherService';

interface WeatherTodayCardProps {
  current?: CurrentWeather;
  daily?: DailyForecast[];
  agricultural?: AgriculturalWeather;
  loading?: boolean;
  onOpenForecast?: () => void;
}

/**
 * Today's weather, and only today's.
 *
 * WHAT WENT AND WHY. This carried a strip of seven day chips you could select
 * between. Six of them described days you cannot act on this morning, and every
 * one of them was a state the card had to hold — which meant soil readings that
 * applied to one chip and not the others, and a panel whose numbers depended on
 * what you last pressed. The dashboard is a glance; the week is a decision.
 * The other six days are still there, in the 7-day forecast this card opens.
 *
 * IT HOLDS TODAY UNTIL TODAY ENDS. The forecast entry is matched on date rather
 * than taken from index zero, so a phone left open across midnight rolls to the
 * new day instead of holding yesterday's high — the cached bundle is still the
 * old one at that point, and `daily[0]` would be yesterday.
 *
 * THE PANEL IS THE SKY. Behind the temperature is a gradient of the sky at the
 * hour you are looking at it, from the real sunrise and sunset for your own
 * coordinates. It is the one gradient in the app: every decorative one was
 * removed and stays removed, but this is a picture of the subject rather than
 * chrome, in the same way the crop cards carry photographs of crops. Each phase
 * carries a foreground proven against all three of its own stops, so legibility
 * never depends on which part of the band a word lands on.
 */
export function WeatherTodayCard({
  current,
  daily,
  agricultural,
  loading,
  onOpenForecast,
}: WeatherTodayCardProps) {
  // Re-checked on the minute so the sky turns while the screen is open, and so
  // the card rolls over at midnight rather than at the next cold start.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayKey = localDateKey(now);

  /*
    Matched on date, not index. The bundle is cached, so after midnight
    `daily[0]` is yesterday until the next fetch lands.
  */
  const today = useMemo(
    () => daily?.find((d) => d.date === todayKey) ?? daily?.[0],
    [daily, todayKey]
  );

  const sky = useMemo(
    () => skyFor(now, today?.sunrise, today?.sunset),
    [now, today]
  );

  if (loading || !current || !today) {
    return (
      <View style={styles.card}>
        <Skeleton height={150} />
        <Skeleton height={14} style={styles.gap} />
      </View>
    );
  }

  // True only when the cached forecast actually covers today. When it does not,
  // the card says so rather than presenting yesterday's numbers as this
  // morning's.
  const isCurrent = today.date === todayKey;
  const fg = sky.onSky;
  const moisturePct = agricultural ? Math.round(agricultural.soilMoisture * 100) : null;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onOpenForecast}
        disabled={!onOpenForecast}
        accessibilityRole="button"
        accessibilityLabel={`Today, ${sky.label.toLowerCase()}. ${current.temp} degrees, ${today.condition}. High ${today.maxTemp}, low ${today.minTemp}. ${today.rainProbability} percent chance of rain. Open the seven day forecast.`}
        style={({ pressed }) => [styles.panel, pressed && styles.pressed]}>
        {/* Crossfaded on the phase, so the sky turns rather than cutting. */}
        <MotiView
          key={sky.phase}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...MOTI_TRANSITION, duration: 700 }}
          style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={sky.colors as unknown as [string, string, string]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MotiView>

        <View style={styles.panelTop}>
          <View style={styles.flex}>
            <Text style={[styles.phase, { color: fg }]}>{sky.label.toUpperCase()}</Text>
            <Text style={[styles.date, { color: fg }]} numberOfLines={1}>
              {longDate(now)}
            </Text>
          </View>
          <Ionicons name={today.icon} size={44} color={fg} />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={MOTI_SPRING}
          style={styles.panelBottom}>
          <Text
            style={[styles.temp, { color: fg }]}
            maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {current.temp}°
          </Text>
          <View style={styles.flex}>
            <Text style={[styles.condition, { color: fg }]} numberOfLines={1}>
              {today.condition}
            </Text>
            <Text style={[styles.range, { color: fg }]} numberOfLines={1}>
              High {today.maxTemp}° · Low {today.minTemp}°
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={fg} />
        </MotiView>
      </Pressable>

      {!isCurrent ? (
        <View style={styles.staleRow}>
          <Ionicons name="cloud-offline-outline" size={13} color={DS.semantic.warning.fg} />
          <Text style={styles.staleText}>
            Showing the last forecast we could fetch, for {longDate(new Date(today.date))}.
          </Text>
        </View>
      ) : null}

      <View style={styles.pills}>
        <Pill icon="rainy-outline" label={`${today.rainProbability}% rain`} />
        {today.rainAmount > 0 ? (
          <Pill icon="water-outline" label={`${today.rainAmount} mm`} />
        ) : null}
        <Pill icon="speedometer-outline" label={`${current.humidity}% humidity`} />
        <Pill icon="navigate-outline" label={`${current.windSpeed} km/h wind`} />

        {agricultural ? (
          <>
            <Pill icon="thermometer-outline" label={`Soil ${agricultural.soilTemperature}°`} />
            {moisturePct !== null ? (
              <Pill icon="pulse-outline" label={`Moisture ${moisturePct}%`} />
            ) : null}
          </>
        ) : null}
      </View>

      {agricultural?.insight ? (
        <Text style={styles.insight}>{agricultural.insight}</Text>
      ) : null}
    </View>
  );
}

function Pill({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color={DS.colors.primaryDark} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

/** Local calendar date, not UTC — `toISOString` would roll over at 2am in Harare. */
function localDateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const longDate = (d: Date) =>
  d.toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'long' });

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
    gap: DS.spacing.sm + 2,
  },
  flex: { flex: 1 },
  gap: { marginTop: DS.spacing.sm },
  pressed: { opacity: 0.94 },

  panel: {
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    padding: DS.spacing.md,
    gap: DS.spacing.md,
    minHeight: 158,
    justifyContent: 'space-between',
    backgroundColor: DS.colors.primaryBg,
  },
  panelTop: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  phase: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    letterSpacing: 1,
  },
  date: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    marginTop: 2,
  },

  panelBottom: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  temp: {
    fontSize: 56,
    lineHeight: 62,
    fontFamily: DS.fontFamily.display,
  },
  condition: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
  },
  range: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    marginTop: 1,
  },

  staleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  staleText: {
    flex: 1,
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

  insight: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
