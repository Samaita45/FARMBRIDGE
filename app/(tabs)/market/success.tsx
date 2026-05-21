import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { asHref } from '@/lib/href';
export default function OrderSuccessScreen() {
  const { orderId, total, payment } = useLocalSearchParams<{
    orderId: string;
    total: string;
    payment: string;
  }>();

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-surface px-6">
      <Text className="text-6xl">✅</Text>
      <Text className="mt-4 font-display text-2xl text-dark">Order Confirmed!</Text>
      <Text className="mt-2 font-sans text-gray-500">Order #{orderId}</Text>
      <Text className="mt-1 font-sans-bold text-primary">${total} via {payment}</Text>
      <Text className="mt-4 text-center font-sans text-sm text-gray-600">
        The seller will contact you to arrange {payment === 'cash_usd' || payment === 'zwg' ? 'payment on delivery' : 'payment confirmation'}.
      </Text>
      <Pressable
        onPress={() => router.replace(asHref('/(tabs)/market'))}
        className="mt-8 rounded-2xl bg-primary px-8 py-3">
        <Text className="font-sans-semibold text-white">Continue Shopping</Text>
      </Pressable>
    </SafeAreaView>
  );
}
