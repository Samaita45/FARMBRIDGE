import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { PAYMENT_METHODS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { insertOrder } from '@/services/orderService';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import type { MarketOrder } from '@/types/market';

export default function CheckoutScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const { items, getTotalUSD, getTotalZWG, clearCart } = useCartStore();
  const [address, setAddress] = useState(user?.province ? `${user.province}, Zimbabwe` : '');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState('ecocash');
  const [loading, setLoading] = useState(false);

  const totalUSD = getTotalUSD();
  const totalZWG = getTotalZWG();

  const placeOrder = async () => {
    if (!address.trim()) return;
    setLoading(true);
    try {
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const order: MarketOrder = {
        id: orderId,
        userId: user?.id ?? 'guest',
        items: items.map((i: CartItem) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          priceUSD: i.product.priceUSD,
          priceZWG: i.product.priceZWG,
        })),
        subtotalUSD: totalUSD,
        subtotalZWG: totalZWG,
        deliveryAddress: address.trim(),
        deliveryMethod,
        paymentMethod,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      await insertOrder(order);
      clearCart();
      router.replace(
        asHref({
          pathname: '/(tabs)/market/success',
          params: { orderId, total: String(totalUSD), payment: paymentMethod },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
      <Text className="font-sans-bold text-lg text-dark">Delivery address</Text>
      <TextInput
        className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-sans"
        value={address}
        onChangeText={setAddress}
        placeholder="Street, suburb, city"
        multiline
      />

      <Text className="mt-4 font-sans-bold text-dark">Delivery method</Text>
      <View className="mt-2 flex-row gap-2">
        {(['pickup', 'delivery'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setDeliveryMethod(m)}
            className={`flex-1 rounded-xl py-3 ${deliveryMethod === m ? 'bg-primary' : 'bg-white border border-gray-200'}`}>
            <Text className={`text-center font-sans-semibold capitalize ${deliveryMethod === m ? 'text-white' : 'text-dark'}`}>
              {m}
            </Text>
          </Pressable>
        ))}
      </View>
      {deliveryMethod === 'delivery' ? (
        <Pressable
          onPress={() => router.push(asHref('/(tabs)/transport/request'))}
          className="mt-2 rounded-xl bg-primary/10 py-2">
          <Text className="text-center font-sans text-sm text-primary">
            🚛 Book farm transport for delivery
          </Text>
        </Pressable>
      ) : null}

      <Text className="mt-4 font-sans-bold text-dark">Payment method</Text>
      <View className="mt-2 gap-2">
        {PAYMENT_METHODS.map((pm) => (
          <Pressable
            key={pm.id}
            onPress={() => setPaymentMethod(pm.id)}
            className={`flex-row items-center gap-3 rounded-xl p-3 ${paymentMethod === pm.id ? 'border-2 border-primary bg-primary/5' : 'bg-white'}`}>
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: pm.color }}>
              <Text className="font-sans text-xs text-white">{pm.name.slice(0, 2)}</Text>
            </View>
            <Text className="font-sans-semibold text-dark">{pm.name}</Text>
          </Pressable>
        ))}
      </View>

      {paymentMethod === 'ecocash' ? (
        <Text className="mt-2 font-sans text-xs text-gray-500">
          Dial *151*2*{totalUSD.toFixed(0)}*ZimFarm#
        </Text>
      ) : null}
      {paymentMethod === 'onemoney' ? (
        <Text className="mt-2 font-sans text-xs text-gray-500">Dial *111*2*ZimFarm*{totalUSD.toFixed(0)}#</Text>
      ) : null}
      {paymentMethod === 'cash_usd' || paymentMethod === 'zwg' ? (
        <Text className="mt-2 font-sans text-xs text-gray-500">Pay on delivery</Text>
      ) : null}

      <View className="mt-6 rounded-2xl bg-white p-4">
        <Text className="font-sans-bold text-dark">Order summary</Text>
        {items.map((i: CartItem) => (
          <View key={i.product.id} className="mt-2 flex-row justify-between">
            <Text className="font-sans text-sm text-gray-600" numberOfLines={1}>
              {i.product.name} ×{i.quantity}
            </Text>
            <Text className="font-sans text-sm text-dark">
              ${(i.product.priceUSD * i.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View className="mt-3 border-t border-gray-100 pt-2 flex-row justify-between">
          <Text className="font-sans-bold text-dark">Total</Text>
          <Text className="font-sans-bold text-primary">
            ${totalUSD.toFixed(2)} / ZWG {totalZWG}
          </Text>
        </View>
      </View>

      <View className="mt-6">
        <PrimaryButton title="Place Order" loading={loading} onPress={placeOrder} />
      </View>
    </ScrollView>
  );
}
