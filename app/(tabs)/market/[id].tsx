import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { getMockReviews } from '@/constants/mock-reviews';
import { getProductById } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useCartStore, type CartState } from '@/stores/cartStore';
import { getProductEmoji } from '@/utils/product-emoji';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const addItem = useCartStore((s: CartState) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const product = getProductById(id ?? '');
  const reviews = getMockReviews(id ?? '');

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="font-sans text-gray-500">Product not found</Text>
      </View>
    );
  }

  const whatsappSeller = () => {
    const msg = encodeURIComponent(`Hi, I'm interested in ${product.name} on ZimFarm.`);
    Linking.openURL(`https://wa.me/263771234567?text=${msg}`);
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="h-56 items-center justify-center bg-primary/10">
        <Text className="text-7xl">{getProductEmoji(product.name, product.category)}</Text>
      </View>

      <View className="px-4 pt-4">
        <Text className="font-display text-2xl text-dark">{product.name}</Text>
        <Text className="mt-1 font-sans-bold text-2xl text-primary">
          ${product.priceUSD} <Text className="text-base text-gray-500">/ {product.unit}</Text>
        </Text>
        <Text className="font-sans text-gray-500">ZWG {product.priceZWG}</Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {product.isOrganic ? (
            <Badge text="Organic" color="#22c55e" />
          ) : null}
          {product.isCertified ? <Badge text="Certified ✓" color="#16a34a" /> : null}
          <Badge
            text={product.inStock ? 'In Stock' : 'Out of Stock'}
            color={product.inStock ? '#22c55e' : '#ef4444'}
          />
        </View>

        <Text className="mt-4 font-sans text-gray-600">{product.description}</Text>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <Text className="font-sans-bold text-dark">Seller</Text>
          <Text className="font-sans text-dark">{product.sellerName}</Text>
          <Text className="font-sans text-sm text-gray-500">📍 {product.location}</Text>
          <Text className="font-sans text-sm text-amber-500">
            ⭐ {product.rating} ({product.reviewCount} reviews)
          </Text>
        </View>

        <Text className="mt-4 font-sans-bold text-dark">Reviews</Text>
        {reviews.map((r) => (
          <View key={r.id} className="mt-2 rounded-xl bg-white p-3">
            <Text className="font-sans-semibold text-dark">{r.author}</Text>
            <Text className="font-sans text-xs text-amber-500">{'⭐'.repeat(r.rating)}</Text>
            <Text className="mt-1 font-sans text-sm text-gray-600">{r.comment}</Text>
          </View>
        ))}

        <View className="mt-4 flex-row items-center justify-center gap-4">
          <Pressable
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Text className="font-sans-bold text-lg">−</Text>
          </Pressable>
          <Text className="font-sans-bold text-xl text-dark">{quantity}</Text>
          <Pressable
            onPress={() => setQuantity((q) => q + 1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Text className="font-sans-bold text-lg">+</Text>
          </Pressable>
        </View>

        <View className="mt-4 gap-3">
          <PrimaryButton
            title="Add to Cart"
            onPress={() => {
              addItem(product, quantity);
              showToast(`Added ${quantity} to cart`, 'success');
            }}
          />
          <PrimaryButton
            title="Buy Now"
            variant="outline"
            onPress={() => {
              addItem(product, quantity);
              router.push(asHref('/(tabs)/market/checkout'));
            }}
          />
          <Pressable
            onPress={whatsappSeller}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3">
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text className="font-sans-semibold text-white">Message Seller</Text>
          </Pressable>
        </View>

        <Text className="mt-6 font-sans-bold text-dark">Similar products</Text>
        <Text className="font-sans text-sm text-gray-500">More in {product.category}</Text>
      </View>
    </ScrollView>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}22` }}>
      <Text className="font-sans text-xs" style={{ color }}>
        {text}
      </Text>
    </View>
  );
}
