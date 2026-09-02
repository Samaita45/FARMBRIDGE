import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { skyFor, tempColor } from '@/constants/sky';
import type { AgriculturalWeather, CurrentWeather, DailyForecast } from '@/services/weatherService';

interface WeatherForecastModalProps {
  visible: boolean;
  onClose: () => void;
  daily: DailyForecast[];
  current?: CurrentWeather;
  agricultural?: AgriculturalWeather;
  locationLabel?: string;
}

/**
 * The week, laid out the way the iPhone Weather app lays out its ten days.
 *
 * THE RANGE BAR IS THE POINT. Each row draws that day's low-to-high span on a
 * scale shared by the whole week, so a hot Thursday is visibly further right
 * than a cool Monday without anyone comparing two columns of numbers. The list
 * it replaced printed "31° / 18°" seven times, which is accurate and tells you
 * nothing about the shape of the week — and the shape is the thing a farmer is
 * actually reading it for.
 *
 * Today's bar carries a marker at the current temperature, so "where we are in
 * today" is legible against where today is going.
 *
 * THE BAR IS NEVER THE ONLY SIGNAL. The low and the high are printed either
 * side of it. It runs blue to orange rather than the more usual red/green
 * because that is the warm/cool pair that survives every common form of colour
 * blindness.
 *
 * The sky behind the sheet is the same one the dashboard card uses, from the
 * real sunrise and sunset. The rows sit on glass over it — the material on iOS
 * 26, a solid panel everywhere else — so the text has a known ground rather
 * than depending on where the gradient happens to be light.
 */
export function WeatherForecastModal({
  visible,
  onClose,
  daily,
  current,
  agricultural,
  locationLabel,
}: WeatherForecastModalProps) {
  const sky = useMemo(
    () => skyFor(new Date(), daily[0]?.sunrise, daily[0]?.sunset),
    [daily]
  );

  /*
    One scale for the week. Without a shared span each row would be drawn
    against its own range and every bar would be full width, which looks like a
    chart and carries no information at all.
  */
  const scale = useMemo(() => {
    if (daily.length === 0) return null;
    const lows = daily.map((d) => d.minTemp);
    const highs = daily.map((d) => d.maxTemp);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    // A flat week would divide by zero; give it a nominal span so the bars
    // render centred rather than collapsing.
    return { min, max, span: Math.max(1, max - min) };
  }, [daily]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <LinearGradient
          colors={sky.colors as unknown as [string, string, string]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: sky.onSky }]}>7-day forecast</Text>
              {locationLabel ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color={sky.onSky} />
                  <Text style={[styles.location, { color: sky.onSky }]} numberOfLines={1}>
                    {locationLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close the forecast"
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={DS.colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <GlassSurface tint="dark" strength="strong" radius={DS.radius.xl} padding={0} style={styles.panel}>
              <View style={styles.panelHead}>
                <Ionicons name="calendar-outline" size={13} color={DS.colors.textInverse} />
                <Text style={styles.panelHeadText}>NEXT 7 DAYS</Text>
              </View>

              {daily.map((day, i) => (
                <ForecastRow
                  key={day.date}
                  day={day}
                  index={i}
                  scale={scale}
                  currentTemp={i === 0 ? current?.temp : undefined}
                  last={i === daily.length - 1}
                />
              ))}
            </GlassSurface>

            {agricultural ? (
              <GlassSurface tint="dark" strength="strong" radius={DS.radius.xl} style={styles.panel}>
                <View style={styles.insightHead}>
                  <Ionicons name="leaf-outline" size={15} color={DS.colors.textInverse} />
                  <Text style={styles.insightTitle}>Agricultural insight</Text>
                </View>
                <Text style={styles.insightBody}>{agricultural.insight}</Text>
                <View style={styles.insightStats}>
                  <Text style={styles.insightStat}>
                    Soil {agricultural.soilTemperature}°C
                  </Text>
                  <Text style={styles.insightStat}>
                    Moisture {(agricultural.soilMoisture * 100).toFixed(0)}%
                  </Text>
                </View>
              </GlassSurface>
            ) : null}

            <Text style={[styles.footnote, { color: sky.onSky }]}>
              Forecast from Open-Meteo for {locationLabel ?? 'your area'}. Soil readings are
              current, not forecast.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function ForecastRow({
  day,
  index,
  scale,
  currentTemp,
  last,
}: {
  day: DailyForecast;
  index: number;
  scale: { min: number; max: number; span: number } | null;
  currentTemp?: number;
  last: boolean;
}) {
  const label =
    index === 0
      ? 'Today'
      : new Date(day.date).toLocaleDateString('en-ZW', { weekday: 'short' });

  const left = scale ? ((day.minTemp - scale.min) / scale.span) * 100 : 0;
  const width = scale ? Math.max(6, ((day.maxTemp - day.minTemp) / scale.span) * 100) : 100;

  // Where today's actual temperature sits inside its own bar.
  const markerPct =
    currentTemp !== undefined && day.maxTemp > day.minTemp
      ? Math.min(100, Math.max(0, ((currentTemp - day.minTemp) / (day.maxTemp - day.minTemp)) * 100))
      : null;

  return (
    <View
      style={[styles.row, !last && styles.rowDivider]}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${day.condition}, low ${day.minTemp}, high ${day.maxTemp} degrees${
        day.rainProbability > 0 ? `, ${day.rainProbability} percent chance of rain` : ''
      }`}>
      <Text style={styles.day} numberOfLines={1}>
        {label}
      </Text>

      <View style={styles.iconCol}>
        <Ionicons name={day.icon} size={20} color={DS.colors.textInverse} />
        {day.rainProbability > 0 ? (
          <Text style={styles.rain}>{day.rainProbability}%</Text>
        ) : null}
      </View>

      <Text style={styles.low}>{day.minTemp}°</Text>

      <View style={styles.track}>
        <View style={[styles.bar, { left: `${left}%`, width: `${width}%` }]}>
          <LinearGradient
            colors={[tempColor(day.minTemp), tempColor(day.maxTemp)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.barFill}
          />
          {markerPct !== null ? (
            <View style={[styles.marker, { left: `${markerPct}%` }]} />
          ) : null}
        </View>
      </View>

      <Text style={styles.high}>{day.maxTemp}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.primaryDark },
  safe: { flex: 1 },
  pressed: { opacity: 0.7 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: {
    flexShrink: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },

  scroll: {
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
    gap: DS.spacing.md,
  },
  panel: { overflow: 'hidden' },

  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.sm,
  },
  panelHeadText: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
    letterSpacing: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: 52,
    paddingHorizontal: DS.spacing.md,
  },
  /*
    Decorative structure, not a control boundary, so the 3:1 rule for non-text
    contrast does not apply — the rows are already separated by their spacing
    and their content. Nudged from 0.16 to 0.22 so it is visible on a bright
    sky without becoming a rule across the panel.
  */
  rowDivider: {
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  day: {
    width: 52,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  iconCol: { width: 34, alignItems: 'center' },
  rain: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    /*
      The rain figure is the one number here that changes a decision, so it
      keeps its own colour rather than blending into the row. sky-300 measured
      3.96:1 on the panel over a bright sky; sky-200 clears it at 5.15 and still
      reads as blue rather than as white.
    */
    color: '#BAE6FD',
    marginTop: 1,
  },
  // Fixed widths, so seven rows of numbers line up into columns and the bars
  // all start and end at the same x.
  low: {
    width: 34,
    textAlign: 'right',
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
  },
  high: {
    width: 34,
    textAlign: 'right',
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  track: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'visible',
  },
  bar: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, overflow: 'visible' },
  barFill: { ...StyleSheet.absoluteFillObject, borderRadius: 3 },
  marker: {
    position: 'absolute',
    top: -2.5,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: DS.colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(15,23,42,0.35)',
  },

  insightHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  insightTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  insightBody: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 19,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    marginTop: 6,
  },
  insightStats: { flexDirection: 'row', gap: DS.spacing.md, marginTop: DS.spacing.sm },
  insightStat: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: 'rgba(255,255,255,0.85)',
  },

  footnote: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    opacity: 0.9,
    paddingHorizontal: DS.spacing.xs,
  },
});
