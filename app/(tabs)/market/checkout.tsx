import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/Typography';
import { PAYMENT_METHODS } from '@/constants/zimbabwe-data';
import { cardShadow } from '@/lib/platform-ui';
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
    <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>Delivery address</Text>
        <TextInput
          style={s.textArea}
          value={address}
          onChangeText={setAddress}
          placeholder="Street, suburb, city"
          placeholderTextColor={Colors.placeholder}
          multiline
        />

        <Text style={s.sectionLabel}>Delivery method</Text>
        <View style={s.methodRow}>
          {(['pickup', 'delivery'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setDeliveryMethod(m)}
              style={[s.methodBtn, deliveryMethod === m && s.methodBtnActive]}>
              <Text style={[s.methodText, deliveryMethod === m && s.methodTextActive]}>{m}</Text>
            </Pressable>
          ))}
        </View>
        {deliveryMethod === 'delivery' ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            style={({ pressed }) => [s.transportLink, pressed && { opacity: 0.85 }]}>
            <Ionicons name="bus-outline" size={16} color={Colors.primary} />
            <Text style={s.transportLinkText}>Book farm transport for delivery</Text>
          </Pressable>
        ) : null}

        <Text style={s.sectionLabel}>Payment method</Text>
        <View style={s.payList}>
          {PAYMENT_METHODS.map((pm) => {
            const active = paymentMethod === pm.id;
            return (
              <Pressable
                key={pm.id}
                onPress={() => setPaymentMethod(pm.id)}
                style={[s.payRow, active && s.payRowActive]}>
                <View style={[s.payIcon, { backgroundColor: pm.color }]}>
                  <Text style={s.payIconText}>{pm.name.slice(0, 2)}</Text>
                </View>
                <Text style={s.payName}>{pm.name}</Text>
                {active ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        {paymentMethod === 'ecocash' ? (
          <Text style={s.hint}>Dial *151*2*{totalUSD.toFixed(0)}*ZimFarm#</Text>
        ) : null}
        {paymentMethod === 'onemoney' ? (
          <Text style={s.hint}>Dial *111*2*ZimFarm*{totalUSD.toFixed(0)}#</Text>
        ) : null}
        {paymentMethod === 'cash_usd' || paymentMethod === 'zwg' ? (
          <Text style={s.hint}>Pay on delivery</Text>
        ) : null}

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order summary</Text>
          {items.map((i: CartItem) => (
            <View key={i.product.id} style={s.summaryRow}>
              <Text style={s.summaryItem} numberOfLines={1}>
                {i.product.name} ×{i.quantity}
              </Text>
              <Text style={s.summaryPrice}>${(i.product.priceUSD * i.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>
              ${totalUSD.toFixed(2)} / ZWG {totalZWG}
            </Text>
          </View>
        </View>

        <PrimaryButton title="Place Order" loading={loading} onPress={placeOrder} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  sectionLabel: { ...Typography.heading3, color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  methodTextActive: { color: Colors.white },
  transportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryMid,
  },
  transportLinkText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  payList: { gap: 10 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...cardShadow(),
  },
  payRowActive: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primaryBg },
  payIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payIconText: { fontSize: 11, fontWeight: '800', color: Colors.white },
  payName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  hint: { marginTop: 8, fontSize: 12, color: Colors.textSecondary },
  summaryCard: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...cardShadow(),
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  summaryItem: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  summaryPrice: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  totalValue: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});
