import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/colors';
import type { CurrentWeather, RainForecast } from '@/services/weatherService';

interface WeatherWidgetProps {
  current?: CurrentWeather;
  rain?: RainForecast;
  loading?: boolean;
  onPress?: () => void;
}

export function WeatherWidget({ current, rain, loading, onPress }: WeatherWidgetProps) {
  if (loading || !current) {
    return (
      <View style={s.card}>
        <View style={s.skeletonIcon} />
        <View style={[s.skeletonLine, { width: 60, marginTop: 8 }]} />
        <View style={[s.skeletonLine, { width: 90, marginTop: 6 }]} />
      </View>
    );
  }

  const rainSoon = rain?.daysUntil != null && rain.daysUntil <= 2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`Weather: ${current.temp}°C, ${current.condition}`}>

      {/* Weather icon + temp */}
      <Text style={s.icon}>{current.icon}</Text>
      <Text style={s.temp}>{current.temp}°<Text style={s.unit}>C</Text></Text>
      <Text style={s.condition} numberOfLines={1}>{current.condition}</Text>

      {/* Humidity */}
      <View style={s.row}>
        <Ionicons name="water-outline" size={11} color={Colors.accent} />
        <Text style={s.meta}>{current.humidity}%</Text>
      </View>

      {/* Rain */}
      {rain?.daysUntil != null && (
        <View style={[s.rainPill, rainSoon && s.rainPillSoon]}>
          <Text style={[s.rainText, rainSoon && s.rainTextSoon]}>
            🌧 {rain.daysUntil === 0 ? 'Today' : `${rain.daysUntil}d`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: 130, marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 20, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  icon: { fontSize: 28, marginBottom: 4 },
  temp: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  unit: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  condition: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 11, fontWeight: '600', color: Colors.accent },
  rainPill: {
    marginTop: 7, alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  rainPillSoon: { backgroundColor: '#FFF3E0' },
  rainText: { fontSize: 10, fontWeight: '700', color: Colors.accent },
  rainTextSoon: { color: Colors.warning },
  skeletonIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray[200] },
  skeletonLine: { height: 10, borderRadius: 5, backgroundColor: Colors.gray[200] },
});
