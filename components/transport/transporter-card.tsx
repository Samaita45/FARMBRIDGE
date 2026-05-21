import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { TransportProvider } from '@/types';
import { VEHICLE_ICONS } from '@/types/transport';

interface TransporterCardProps {
  provider: TransportProvider;
  distanceKm: number;
  estimatedPrice: number;
  onRequest: () => void;
  onNegotiate: () => void;
}

export function TransporterCard({
  provider,
  distanceKm,
  estimatedPrice,
  onRequest,
  onNegotiate,
}: TransporterCardProps) {
  const mockDistanceAway = Math.max(3, Math.round(distanceKm * 0.15));

  return (
    <View
      className="mb-3 rounded-2xl bg-white p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-row gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-2xl">{VEHICLE_ICONS[provider.vehicleType]}</Text>
          </View>
          <View>
            <Text className="font-sans-bold text-dark">{provider.name}</Text>
            <Text className="font-sans text-sm text-gray-500">
              {VEHICLE_ICONS[provider.vehicleType]} {provider.vehicleType} · {provider.capacity}t
            </Text>
            <Text className="font-sans text-xs text-primary">
              ⭐ {provider.rating} · {provider.totalTrips} trips
            </Text>
          </View>
        </View>
        {!provider.isAvailable ? (
          <Text className="font-sans text-xs text-gray-400">Busy</Text>
        ) : null}
      </View>

      <Text className="mt-2 font-sans text-xs text-gray-500">
        📍 {mockDistanceAway} km away · {provider.location}
      </Text>
      <View className="mt-1 flex-row flex-wrap gap-1">
        {provider.coverageAreas.slice(0, 3).map((area) => (
          <View key={area} className="rounded-full bg-surface px-2 py-0.5">
            <Text className="font-sans text-[10px] text-gray-600">{area}</Text>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-gray-50 pt-3">
        <View>
          <Text className="font-sans text-xs text-gray-400">Est. price</Text>
          <Text className="font-sans-bold text-lg text-dark">${estimatedPrice}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={onNegotiate}
            disabled={!provider.isAvailable}
            className="rounded-xl border border-primary px-4 py-2">
            <Text className="font-sans-semibold text-sm text-primary">Negotiate</Text>
          </Pressable>
          <Pressable
            onPress={onRequest}
            disabled={!provider.isAvailable}
            className="rounded-xl bg-primary px-4 py-2 active:opacity-90">
            <Text className="font-sans-semibold text-sm text-white">Request</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
