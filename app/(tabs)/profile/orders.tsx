import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useToast } from '@/components/ui/toast-provider';
import { MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { getOrders } from '@/services/orderService';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import type { MarketOrder } from '@/types/market';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600',
  confirmed: 'text-primary',
  shipped: 'text-blue-600',
  delivered: 'text-primary',
  cancelled: 'text-error',
};

export default function OrdersScreen() {
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const [orders, setOrders] = useState<MarketOrder[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setOrders(await getOrders(user.id));
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const reorder = (order: MarketOrder) => {
    let added = 0;
    for (const item of order.items) {
      const product = MARKET_PRODUCTS.find((p) => p.id === item.productId);
      if (product) {
        addItem(product, item.quantity);
        added += 1;
      }
    }
    showToast(added > 0 ? 'Items added to cart' : 'Products unavailable for reorder', added > 0 ? 'success' : 'info');
  };

  if (orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-8">
        <Text className="text-4xl">📦</Text>
        <Text className="mt-2 font-sans text-gray-500">No orders yet</Text>
        <Text className="mt-1 text-center font-sans text-sm text-gray-400">
          Browse the marketplace to place your first order
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface p-4">
      {orders.map((order) => (
        <View
          key={order.id}
          className="mb-3 rounded-2xl bg-white p-4"
          style={{ shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-dark">#{order.id.slice(-8)}</Text>
            <Text className={`font-sans-semibold text-sm capitalize ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </Text>
          </View>
          <Text className="mt-1 font-sans text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
          {order.items.map((item) => (
            <Text key={item.productId} className="mt-1 font-sans text-sm text-gray-600">
              {item.quantity}× {item.productName}
            </Text>
          ))}
          <Text className="mt-2 font-sans-semibold text-primary">
            ${order.subtotalUSD.toFixed(2)} · ZWG {order.subtotalZWG.toLocaleString()}
          </Text>
          <Pressable onPress={() => reorder(order)} className="mt-3 rounded-xl bg-surface py-2">
            <Text className="text-center font-sans-semibold text-sm text-primary">Reorder</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
