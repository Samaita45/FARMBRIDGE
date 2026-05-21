import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, GlassCard } from '@/components/design-system';
import { Button } from '@/components/ui/Button';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { getProductImage } from '@/utils/product-emoji';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotalUSD, getTotalZWG, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          description="Browse the marketplace and add fresh produce from local farmers."
          actionLabel="Browse marketplace"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {items.map(({ product, quantity }: CartItem) => (
          <GlassCard key={product.id} style={s.itemCard}>
            <View style={s.thumb}>
              <Image source={getProductImage(product)} style={s.thumbImg} resizeMode="cover" />
            </View>
            <View style={s.itemBody}>
              <Text style={s.itemName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={s.itemPrice}>${(product.priceUSD * quantity).toFixed(2)}</Text>
              <View style={s.qtyRow}>
                <Pressable onPress={() => updateQuantity(product.id, quantity - 1)} style={s.qtyBtn}>
                  <Ionicons name="remove" size={18} color={DS.colors.textMuted} />
                </Pressable>
                <Text style={s.qty}>{quantity}</Text>
                <Pressable onPress={() => updateQuantity(product.id, quantity + 1)} style={s.qtyBtn}>
                  <Ionicons name="add" size={18} color={DS.colors.primary} />
                </Pressable>
                <Pressable onPress={() => removeItem(product.id)} style={s.removeBtn}>
                  <Text style={s.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      <GlassCard elevated style={s.footer}>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Subtotal (USD)</Text>
          <Text style={s.footerValue}>${getTotalUSD().toFixed(2)}</Text>
        </View>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Subtotal (ZWG)</Text>
          <Text style={s.footerValue}>ZWG {getTotalZWG()}</Text>
        </View>
        <Button
          title="Proceed to checkout"
          onPress={() => router.push(asHref('/(tabs)/market/checkout'))}
        />
        <Pressable onPress={clearCart} style={s.clearBtn}>
          <Text style={s.clearText}>Clear cart</Text>
        </Pressable>
      </GlassCard>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  scroll: { padding: DS.spacing.md, paddingBottom: 200 },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: DS.spacing.sm,
    padding: DS.spacing.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: DS.radius.md,
    overflow: 'hidden',
    backgroundColor: DS.colors.primaryBg,
  },
  thumbImg: { width: '100%', height: '100%' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: DS.colors.text },
  itemPrice: { fontSize: 16, fontWeight: '800', color: DS.colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto' },
  removeText: { fontSize: 13, fontWeight: '600', color: DS.colors.red },
  footer: {
    position: 'absolute',
    left: DS.spacing.md,
    right: DS.spacing.md,
    bottom: DS.spacing.md,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footerLabel: { fontSize: 14, color: DS.colors.textMuted },
  footerValue: { fontSize: 16, fontWeight: '800', color: DS.colors.text },
  clearBtn: { alignItems: 'center', marginTop: 12 },
  clearText: { fontSize: 14, fontWeight: '600', color: DS.colors.textMuted },
});
