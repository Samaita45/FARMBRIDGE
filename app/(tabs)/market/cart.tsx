import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import Colors from '@/constants/colors';
import { cardShadow } from '@/lib/platform-ui';
import { asHref } from '@/lib/href';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { getProductImage } from '@/utils/product-emoji';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotalUSD, getTotalZWG, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={56} color={Colors.gray[400]} />
          <Text style={s.emptyText}>Your cart is empty</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.8 }]}>
            <Text style={s.emptyBtnText}>Browse marketplace</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {items.map(({ product, quantity }: CartItem) => (
          <View key={product.id} style={s.itemCard}>
            <View style={s.thumb}>
              <Image source={getProductImage(product)} style={s.thumbImg} resizeMode="cover" />
            </View>
            <View style={s.itemBody}>
              <Text style={s.itemName} numberOfLines={2}>{product.name}</Text>
              <Text style={s.itemPrice}>${(product.priceUSD * quantity).toFixed(2)}</Text>
              <View style={s.qtyRow}>
                <Pressable onPress={() => updateQuantity(product.id, quantity - 1)} style={s.qtyBtn}>
                  <Ionicons name="remove" size={18} color={Colors.gray[500]} />
                </Pressable>
                <Text style={s.qty}>{quantity}</Text>
                <Pressable onPress={() => updateQuantity(product.id, quantity + 1)} style={s.qtyBtn}>
                  <Ionicons name="add" size={18} color={Colors.primary} />
                </Pressable>
                <Pressable onPress={() => removeItem(product.id)} style={s.removeBtn}>
                  <Text style={s.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Subtotal (USD)</Text>
          <Text style={s.footerValue}>${getTotalUSD().toFixed(2)}</Text>
        </View>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Subtotal (ZWG)</Text>
          <Text style={s.footerValue}>ZWG {getTotalZWG()}</Text>
        </View>
        <PrimaryButton
          title="Proceed to Checkout"
          onPress={() => router.push(asHref('/(tabs)/market/checkout'))}
        />
        <Pressable onPress={clearCart} style={s.clearBtn}>
          <Text style={s.clearText}>Clear cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { marginTop: 12, fontSize: 15, color: Colors.textSecondary },
  emptyBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primaryMid },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    ...cardShadow(),
  },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.primaryBg },
  thumbImg: { width: '100%', height: '100%' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemPrice: { marginTop: 4, fontSize: 14, fontWeight: '700', color: Colors.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto' },
  removeText: { fontSize: 12, fontWeight: '600', color: Colors.error },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...cardShadow(true),
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  footerLabel: { fontSize: 14, color: Colors.textSecondary },
  footerValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  clearBtn: { marginTop: 8, paddingVertical: 10 },
  clearText: { textAlign: 'center', fontSize: 13, color: Colors.textSecondary },
});
