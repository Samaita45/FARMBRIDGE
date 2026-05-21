import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { asHref } from '@/lib/href';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { getProductEmoji } from '@/utils/product-emoji';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotalUSD, getTotalZWG, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-4">
        <Text className="text-5xl">🛒</Text>
        <Text className="mt-2 font-sans text-gray-500">Your cart is empty</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-sans-semibold text-primary">Browse marketplace</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
        {items.map(({ product, quantity }: CartItem) => (
          <View
            key={product.id}
            className="mb-3 flex-row gap-3 rounded-2xl bg-white p-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            <View className="h-16 w-16 items-center justify-center rounded-xl bg-surface">
              <Text className="text-2xl">{getProductEmoji(product.name, product.category)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-dark" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="font-sans text-sm text-primary">
                ${(product.priceUSD * quantity).toFixed(2)}
              </Text>
              <View className="mt-2 flex-row items-center gap-3">
                <Pressable onPress={() => updateQuantity(product.id, quantity - 1)}>
                  <Text className="font-sans-bold text-lg text-gray-500">−</Text>
                </Pressable>
                <Text className="font-sans-semibold">{quantity}</Text>
                <Pressable onPress={() => updateQuantity(product.id, quantity + 1)}>
                  <Text className="font-sans-bold text-lg text-primary">+</Text>
                </Pressable>
                <Pressable onPress={() => removeItem(product.id)} className="ml-auto">
                  <Text className="font-sans text-sm text-error">Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="border-t border-gray-100 bg-white px-4 py-4">
        <View className="flex-row justify-between">
          <Text className="font-sans text-gray-600">Subtotal (USD)</Text>
          <Text className="font-sans-bold text-dark">${getTotalUSD().toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-sans text-gray-600">Subtotal (ZWG)</Text>
          <Text className="font-sans-bold text-dark">ZWG {getTotalZWG()}</Text>
        </View>
        <PrimaryButton
          title="Proceed to Checkout"
          onPress={() => router.push(asHref('/(tabs)/market/checkout'))}
        />
        <Pressable onPress={clearCart} className="mt-2 py-2">
          <Text className="text-center font-sans text-sm text-gray-500">Clear cart</Text>
        </Pressable>
      </View>
    </View>
  );
}
