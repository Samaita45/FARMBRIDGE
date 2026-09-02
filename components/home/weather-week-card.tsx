import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LiquidSelection } from '@/components/design-system';
import { Skeleton } from '@/components/ui/skeleton';
import { DS } from '@/constants/design-system';
import { skyFor } from '@/constants/sky';
import { MOTI_SPRING, MOTI_TRANSITION } from '@/lib/motion';
import type {
  AgriculturalWeather,
  CurrentWeather,
  DailyForecast,
} from '@/services/weatherService';

interface WeatherWeekCardProps {
  current?: CurrentWeather;
  daily?: DailyForecast[];
  agricultural?: AgriculturalWeather;
  loading?: boolean;
  onOpenForecast?: () => void;
}

/**
 * The week ahead, as the Farm UI reference lays it out: a strip of days with
 * one selected, and that day's conditions underneath.
 *
 * WHAT EACH DAY ACTUALLY SHOWS. The strip is the real seven-day forecast from
 * open-meteo, so the numbers move when the forecast does. Selecting a day
 * changes the panel to that day's high, low, condition and rain chance —
 * things the forecast genuinely provides per day.
 *
 * The soil temperature and moisture readings appear only when today is
 * selected, and are labelled "now". They are a current measurement, not a
 * forecast; showing them under Friday would be presenting today's soil as
 * Friday's, which is the kind of quiet lie that gets a planting decision wrong.
 *
 * THE PANEL IS THE SKY. Behind the temperature is a gradient of the sky at the
 * hour you are looking at it, from the real sunrise and sunset for your own
 * coordinates. It is the one gradient in the app: every decorative one was
 * removed and stays removed, but this is a picture of the subject rather than
 * chrome, in the same way the crop cards carry photographs of crops. Each phase
 * carries a foreground proven against all three of its own stops, so the
 * legibility does not depend on which part of the band a word lands on.
 *
 * Only TODAY gets a sky. A future day has no "now", and painting Friday in this
 * evening's dusk would be describing a moment that does not exist.
 *
 * THE SELECTION TRAVELS. A single pill springs between the days rather than
 * appearing on one and vanishing from another, so the row reads as one control
 * with a current value instead of seven separate buttons. The panel beneath
 * re-enters on each change, which is what makes it obvious the numbers below
 * belong to the day just pressed. Both fall straight to their end state when
 * the phone is set to reduce motion.
 */
export function WeatherWeekCard({
  current,
  daily,
  agricultural,
  loading,
  onOpenForecast,
}: WeatherWeekCardProps) {
  const [selected, setSelected] = useState(0);
  // Re-checked on the minute so the sky turns while the screen is open, rather
  // than being fixed at whatever it was when the dashboard mounted.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  /*
    Computed before the loading return: hooks must run in the same order every
    render, and this one sat after it. Only today ever uses the result — a
    future day has no "now" to paint, and showing Friday in this evening's dusk
    would describe a moment that does not exist.
  */
  const sky = useMemo(
    () => skyFor(now, daily?.[0]?.sunrise, daily?.[0]?.sunset),
    [now, daily]
  );

  if (loading || !current || !daily || daily.length === 0) {
    return (
      <View style={styles.card}>
        <Skeleton height={62} />
        <Skeleton height={40} width="55%" style={styles.gap} />
        <Skeleton height={14} style={styles.gap} />
      </View>
    );
  }

  const index = Math.min(selected, daily.length - 1);
  const day = daily[index];
  const isToday = index === 0;
  const moisturePct = agricultural ? Math.round(agricultural.soilMoisture * 100) : null;
  const fg = isToday ? sky.onSky : DS.colors.text;

  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripPad}>
        <LiquidSelection selected={index} gap={DS.spacing.sm} radius={DS.radius.full}>
          {daily.map((d, i) => {
            const active = i === index;
            const date = new Date(d.date);
            return (
              <Pressable
                key={d.date}
                onPress={() => setSelected(i)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${weekday(date)} ${date.getDate()}, high ${d.maxTemp} degrees, ${d.condition}`}
                style={[styles.day, !active && styles.dayIdle]}>
                <Text style={[styles.dayName, active && styles.dayTextActive]}>
                  {i === 0 ? 'Today' : weekday(date)}
                </Text>
                <Ionicons
                  name={d.icon}
                  size={19}
                  color={active ? DS.colors.accentOn : DS.colors.primary}
                />
                <Text style={[styles.dayTemp, active && styles.dayTextActive]}>
                  {d.maxTemp}°
                </Text>
              </Pressable>
            );
          })}
        </LiquidSelection>
      </ScrollView>

      {/* Keyed on the date, so a new day is a new element and re-enters. */}
      <MotiView
        key={day.date}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={MOTI_SPRING}
        style={styles.panelWrap}>
        <Pressable
          onPress={onOpenForecast}
          disabled={!onOpenForecast}
          accessibilityRole="button"
          accessibilityLabel={`${isToday ? `Today, ${sky.label.toLowerCase()}` : longDate(day.date)}: ${day.condition}, high ${day.maxTemp}, low ${day.minTemp} degrees. Open the full forecast.`}
          style={({ pressed }) => [styles.panel, pressed && styles.pressed]}>
          {/*
            Crossfaded on the phase, so the sky turns rather than cutting.
            MotiView keyed on the phase name gives a new element each time.
          */}
          {isToday ? (
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
          ) : null}

          <View style={styles.panelMain}>
            <Text style={[styles.panelDate, { color: fg }]}>
              {isToday ? `Today · ${sky.label}` : longDate(day.date)}
            </Text>
            <Text
              style={[styles.panelTemp, { color: fg }]}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {isToday ? current.temp : day.maxTemp}°C
            </Text>
            <Text style={[styles.panelCondition, { color: fg }]}>
              {day.condition} · low {day.minTemp}°
            </Text>
          </View>

          <View style={styles.panelSide}>
            <Ionicons name={day.icon} size={40} color={fg} />
            <Ionicons name="chevron-forward" size={16} color={fg} />
          </View>
        </Pressable>
      </MotiView>

      <MotiView
        key={`pills-${day.date}`}
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={MOTI_TRANSITION}
        style={styles.pills}>
        <Pill icon="rainy-outline" label={`${day.rainProbability}% rain`} />
        {day.rainAmount > 0 ? <Pill icon="water-outline" label={`${day.rainAmount} mm`} /> : null}

        {/* Soil is measured now, not forecast, so it is only shown against today. */}
        {isToday && agricultural ? (
          <>
            <Pill icon="thermometer-outline" label={`Soil ${agricultural.soilTemperature}° now`} />
            {moisturePct !== null ? (
              <Pill icon="speedometer-outline" label={`Moisture ${moisturePct}% now`} />
            ) : null}
          </>
        ) : null}
      </MotiView>

      {isToday && agricultural?.insight ? (
        <Text style={styles.insight}>{agricultural.insight}</Text>
      ) : null}
    </View>
  );
}

function Pill({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color={DS.colors.primaryDark} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const weekday = (d: Date) => d.toLocaleDateString('en-ZW', { weekday: 'short' });
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'short' });

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
    gap: DS.spacing.sm + 2,
  },
  gap: { marginTop: DS.spacing.sm },
  pressed: { opacity: 0.9 },

  stripPad: { paddingRight: DS.spacing.xs },
  day: {
    alignItems: 'center',
    gap: 4,
    minWidth: 58,
    paddingVertical: DS.spacing.sm,
    paddingHorizontal: 8,
    borderRadius: DS.radius.full,
  },
  // The selected chip's fill IS the travelling pill behind it, so only the
  // unselected ones carry a border. Text weight still changes, so selection is
  // never carried by colour alone.
  dayIdle: {
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  dayName: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  dayTemp: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  dayTextActive: { color: DS.colors.accentOn, fontFamily: DS.fontFamily.bold },

  panelWrap: { borderRadius: DS.radius.lg, overflow: 'hidden' },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    // The fill is the sky behind it. A future day, which gets no sky, falls
    // back to the tinted surface the panel always had.
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    overflow: 'hidden',
  },
  panelMain: { flex: 1, gap: 1 },
  panelDate: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },
  panelTemp: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  panelCondition: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  panelSide: { alignItems: 'center', gap: 4 },

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
