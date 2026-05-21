import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import { VEHICLE_ICONS } from '@/types/transport';

export default function NegotiateScreen() {
  const selectedProviderId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const askingPriceUSD = useTransportStore((s: TransportState) => s.askingPriceUSD);
  const setCounterPrice = useTransportStore((s: TransportState) => s.setCounterPrice);
  const [counter, setCounter] = useState(String(Math.max(1, askingPriceUSD - 5)));
  const [transporterOffer, setTransporterOffer] = useState(askingPriceUSD);

  const provider = TRANSPORT_PROVIDERS.find((p) => p.id === selectedProviderId);

  if (!provider) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="font-sans text-gray-500">No transporter selected</Text>
      </View>
    );
  }

  const submitCounter = () => {
    const price = parseFloat(counter);
    if (isNaN(price)) return;
    setCounterPrice(price);
    setTransporterOffer(Math.round((askingPriceUSD + price) / 2));
  };

  const acceptDeal = () => {
    const finalPrice = transporterOffer;
    setCounterPrice(finalPrice);
    router.push(
      asHref({
        pathname: '/(tabs)/transport/confirm',
        params: { mode: 'negotiated', price: String(finalPrice) },
      })
    );
  };

  return (
    <View className="flex-1 bg-surface px-4 pt-4">
      <View className="rounded-2xl bg-white p-4">
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl">{VEHICLE_ICONS[provider.vehicleType]}</Text>
          <View>
            <Text className="font-sans-bold text-lg text-dark">{provider.name}</Text>
            <Text className="font-sans text-sm text-gray-500">Asking price</Text>
          </View>
        </View>
        <Text className="mt-4 font-display text-3xl text-dark">${askingPriceUSD}</Text>
      </View>

      <View className="mt-6 rounded-2xl bg-primary/10 p-4">
        <Text className="font-sans-semibold text-dark">Your counter-offer</Text>
        <TextInput
          className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-sans-bold text-xl text-dark"
          value={counter}
          onChangeText={setCounter}
          keyboardType="decimal-pad"
        />
        <Pressable onPress={submitCounter} className="mt-3 rounded-xl bg-white py-2">
          <Text className="text-center font-sans-semibold text-primary">Send Counter-Offer</Text>
        </Pressable>
      </View>

      {transporterOffer !== askingPriceUSD ? (
        <View className="mt-4 rounded-2xl border border-primary bg-white p-4">
          <Text className="font-sans text-sm text-gray-500">Transporter responds:</Text>
          <Text className="font-sans-bold text-2xl text-primary">${transporterOffer}</Text>
          <Text className="mt-1 font-sans text-xs text-gray-400">
            (Simulated midpoint between your offer and their ask)
          </Text>
        </View>
      ) : null}

      <View className="mt-auto gap-3 pb-8">
        <PrimaryButton title="Accept & Book" onPress={acceptDeal} />
        <Pressable
          onPress={() => router.back()}
          className="rounded-2xl border border-gray-200 py-3">
          <Text className="text-center font-sans-semibold text-gray-600">Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}
