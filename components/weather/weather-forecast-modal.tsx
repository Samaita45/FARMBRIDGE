import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { AgriculturalWeather, DailyForecast } from '@/services/weatherService';

interface WeatherForecastModalProps {
  visible: boolean;
  onClose: () => void;
  daily: DailyForecast[];
  agricultural?: AgriculturalWeather;
  locationLabel?: string;
}

export function WeatherForecastModal({
  visible,
  onClose,
  daily,
  agricultural,
  locationLabel,
}: WeatherForecastModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text className="font-display text-xl text-dark">7-Day Forecast</Text>
          <Pressable onPress={onClose} className="rounded-full bg-gray-100 px-3 py-1">
            <Text className="font-sans-semibold text-gray-600">Close</Text>
          </Pressable>
        </View>

        {locationLabel ? (
          <Text className="px-4 py-2 font-sans text-sm text-gray-500">📍 {locationLabel}</Text>
        ) : null}

        {agricultural ? (
          <View className="mx-4 mb-3 rounded-2xl bg-primary/10 p-4">
            <Text className="font-sans-semibold text-dark">🌾 Agricultural Insight</Text>
            <Text className="mt-1 font-sans text-sm text-gray-600">{agricultural.insight}</Text>
            <View className="mt-2 flex-row gap-4">
              <Text className="font-sans text-xs text-gray-500">
                Soil temp: {agricultural.soilTemperature}°C
              </Text>
              <Text className="font-sans text-xs text-gray-500">
                Moisture: {(agricultural.soilMoisture * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        ) : null}

        <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32, gap: 8 }}>
          {daily.map((day) => {
            const label = new Date(day.date).toLocaleDateString('en-ZW', {
              weekday: 'short',
              day: 'numeric',
            });
            return (
              <View
                key={day.date}
                className="flex-row items-center justify-between rounded-2xl bg-white p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">{day.icon}</Text>
                  <View>
                    <Text className="font-sans-semibold text-dark">{label}</Text>
                    <Text className="font-sans text-xs text-gray-500">{day.condition}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-sans-bold text-dark">
                    {day.maxTemp}° / {day.minTemp}°
                  </Text>
                  <Text className="font-sans text-xs" style={{ color: Colors.primary }}>
                    🌧 {day.rainProbability}% · {day.rainAmount}mm
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
