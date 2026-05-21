import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { PAYMENT_METHODS, TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { insertBooking } from '@/services/transportDb';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import type { TransportBooking } from '@/types/transport';
import { VEHICLE_ICONS } from '@/types/transport';

export default function ConfirmScreen() {
  const { price: priceParam } = useLocalSearchParams<{ price?: string; mode?: string }>();
  const { showToast } = useToast();
  const user = useAuthStore((s: AuthState) => s.user);
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectedProviderId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const counterPriceUSD = useTransportStore((s: TransportState) => s.counterPriceUSD);
  const clear = useTransportStore((s: TransportState) => s.clear);

  const [paymentMethod, setPaymentMethod] = useState('ecocash');
  const [booked, setBooked] = useState(false);
  const [orderId, setOrderId] = useState('');

  const provider = TRANSPORT_PROVIDERS.find((p) => p.id === selectedProviderId);
  const askingPrice = useTransportStore((s: TransportState) => s.askingPriceUSD);
  const agreedPrice =
    counterPriceUSD ?? (priceParam ? parseFloat(priceParam) : askingPrice);

  if (!request || !provider) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-4">
        <Text className="font-sans text-gray-500">Booking data missing</Text>
      </View>
    );
  }

  const placeBooking = async () => {
    const id = `TRP-${Date.now().toString(36).toUpperCase()}`;
    const booking: TransportBooking = {
      id,
      userId: user?.id ?? 'guest',
      providerId: provider.id,
      providerName: provider.name,
      providerPhone: provider.phone,
      vehicleType: provider.vehicleType,
      pickup: request.pickup,
      destination: request.destination,
      goodsDescription: request.goodsDescription,
      weightKg: request.weightKg,
      category: request.category,
      preferredDate: request.preferredDate,
      distanceKm,
      agreedPriceUSD: agreedPrice,
      counterPriceUSD: counterPriceUSD ?? undefined,
      status: 'confirmed',
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
    await insertBooking(booking);
    setOrderId(id);
    setBooked(true);
    showToast('Transport booked successfully!', 'success');
  };

  const callDriver = () => Linking.openURL(`tel:${provider.phone}`);
  const whatsappDriver = () =>
    Linking.openURL(
      `https://wa.me/${provider.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi ${provider.name}, I booked transport ${orderId} from ${request.pickup} to ${request.destination}.`
      )}`
    );

  if (booked) {
    return (
      <ScrollView className="flex-1 bg-surface px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-center text-5xl">✅</Text>
        <Text className="mt-4 text-center font-display text-2xl text-dark">Booking Confirmed!</Text>
        <Text className="mt-2 text-center font-sans text-gray-500">Order #{orderId}</Text>

        <View className="mt-6 rounded-2xl bg-white p-4">
          <Text className="font-sans-bold text-dark">{provider.name}</Text>
          <Text className="font-sans text-sm text-gray-500">
            {VEHICLE_ICONS[provider.vehicleType]} {provider.vehicleType} · ${agreedPrice}
          </Text>
          <Text className="mt-2 font-sans text-sm text-dark">
            {request.pickup} → {request.destination}
          </Text>
          <Text className="font-sans text-sm text-gray-500">{request.preferredDate}</Text>
        </View>

        <View className="mt-4 gap-3">
          <Pressable onPress={callDriver} className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3">
            <Ionicons name="call" size={20} color="#fff" />
            <Text className="font-sans-semibold text-white">Call Transporter</Text>
          </Pressable>
          <Pressable onPress={whatsappDriver} className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3">
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text className="font-sans-semibold text-white">WhatsApp Transporter</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            clear();
            router.replace(asHref('/(tabs)/transport'));
          }}
          className="mt-6 py-3">
          <Text className="text-center font-sans-semibold text-primary">Back to Transport Home</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
      <Text className="font-sans text-sm text-gray-500">Step 3 — Confirm booking</Text>

      <View className="mt-4 rounded-2xl bg-white p-4">
        <Text className="font-sans-bold text-lg text-dark">Booking Summary</Text>
        <Row label="Driver" value={provider.name} />
        <Row label="Vehicle" value={`${VEHICLE_ICONS[provider.vehicleType]} ${provider.vehicleType}`} />
        <Row label="Route" value={`${request.pickup} → ${request.destination}`} />
        <Row label="Distance" value={`${distanceKm} km`} />
        <Row label="Goods" value={request.goodsDescription} />
        <Row label="Date" value={request.preferredDate} />
        <Row label="Total" value={`$${agreedPrice} USD`} highlight />
      </View>

      <Text className="mt-4 font-sans-semibold text-dark">Payment method</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {PAYMENT_METHODS.filter((p) => ['ecocash', 'onemoney', 'cash_usd', 'zwg'].includes(p.id)).map((pm) => (
          <Pressable
            key={pm.id}
            onPress={() => setPaymentMethod(pm.id)}
            className={`rounded-full px-4 py-2 ${paymentMethod === pm.id ? 'bg-primary' : 'bg-white border border-gray-200'}`}>
            <Text className={`font-sans text-sm ${paymentMethod === pm.id ? 'text-white' : 'text-dark'}`}>
              {pm.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {paymentMethod === 'ecocash' ? (
        <Text className="mt-2 font-sans text-xs text-gray-500">
          Dial *151*2*{agreedPrice}*ZimFarm# to pay via EcoCash
        </Text>
      ) : null}

      <View className="mt-6">
        <PrimaryButton title="Place Order" onPress={placeBooking} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="mt-2 flex-row justify-between border-b border-gray-50 py-1">
      <Text className="font-sans text-sm text-gray-500">{label}</Text>
      <Text className={`font-sans text-sm ${highlight ? 'font-bold text-primary' : 'text-dark'}`}>
        {value}
      </Text>
    </View>
  );
}
