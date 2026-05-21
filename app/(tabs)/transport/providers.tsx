import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { TransporterCard } from '@/components/transport/transporter-card';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { estimatePrice } from '@/services/transportDb';
import { asHref } from '@/lib/href';
import { useTransportStore, type TransportState } from '@/stores/transportStore';

export default function ProvidersScreen() {
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectProvider = useTransportStore((s: TransportState) => s.selectProvider);

  const sorted = useMemo(() => {
    return [...TRANSPORT_PROVIDERS]
      .filter((p) => p.isAvailable)
      .map((p) => ({
        provider: p,
        price: estimatePrice(p, distanceKm),
      }))
      .sort((a, b) => a.price - b.price);
  }, [distanceKm]);

  if (!request) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-4">
        <Text className="font-sans text-gray-500">No request found. Go back and fill the form.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface px-4" contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}>
      <View className="mb-4 rounded-xl bg-white p-3">
        <Text className="font-sans text-xs text-gray-500">Route</Text>
        <Text className="font-sans-semibold text-dark">
          {request.pickup} → {request.destination}
        </Text>
        <Text className="mt-1 font-sans text-sm text-gray-500">
          ~{distanceKm} km · {request.weightKg} kg · {request.category}
        </Text>
      </View>

      <Text className="mb-2 font-sans-bold text-dark">Available transporters</Text>
      {sorted.map(({ provider, price }) => (
        <TransporterCard
          key={provider.id}
          provider={provider}
          distanceKm={distanceKm}
          estimatedPrice={price}
          onRequest={() => {
            selectProvider(provider.id, price);
            router.push(
              asHref({
                pathname: '/(tabs)/transport/confirm',
                params: { mode: 'direct', price: String(price) },
              })
            );
          }}
          onNegotiate={() => {
            selectProvider(provider.id, price);
            router.push(asHref('/(tabs)/transport/negotiate'));
          }}
        />
      ))}
    </ScrollView>
  );
}
