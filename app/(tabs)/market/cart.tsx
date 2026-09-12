import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { imageSourceFor } from '@/constants/produce-imagery';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { asHref } from '@/lib/href';
import { useCartStore, type CartItem, type CartState } from '@/stores/cartStore';

/**
 * The cart, following the reference layout: a photograph of each item, its
 * price, and a stepper — then a summary card and a single primary action.
 *
 * Quantity is changed in place rather than by opening the product, because the
 * only thing anyone does on this screen is adjust amounts and check the total.
 */
export default function CartScreen() {
  const items = useCartStore((s: CartState) => s.items);
  const updateQuantity = useCartStore((s: CartState) => s.updateQuantity);
  const removeItem = useCartStore((s: CartState) => s.removeItem);
  const totalUSD = useCartStore((s: CartState) => s.getTotalUSD());
  const { rate, isIndicative } = useExchangeRate();

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={styles.row}>
        <Image
          source={
            item.product.images[0]
              ? { uri: item.product.images[0] }
              : imageSourceFor(`${item.product.name} ${item.product.category}`)
          }
          style={styles.thumb}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />

        <View style={styles.rowBody}>
          <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {item.product.name}
          </Text>
          <Text style={styles.price} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            ${item.product.priceUSD.toFixed(2)}
            <Text style={styles.unit}> per {item.product.unit}</Text>
          </Text>

          <View style={styles.stepper}>
            <Pressable
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              accessibilityRole="button"
              accessibilityLabel={`Reduce ${item.product.name} quantity`}
              hitSlop={6}
              style={styles.stepBtn}>
              <Ionicons name="remove" size={15} color={DS.colors.text} />
            </Pressable>

            <Text style={styles.qty} accessibilityLabel={`Quantity ${item.quantity}`}>
              {item.quantity}
            </Text>

            <Pressable
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              accessibilityRole="button"
              accessibilityLabel={`Increase ${item.product.name} quantity`}
              hitSlop={6}
              style={styles.stepBtn}>
              <Ionicons name="add" size={15} color={DS.colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.rowRight}>
          <Pressable
            onPress={() => removeItem(item.product.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.product.name} from cart`}
            hitSlop={8}
            style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={16} color={DS.colors.textSoft} />
          </Pressable>
          <Text style={styles.lineTotal}>
            ${(item.product.priceUSD * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    ),
    [updateQuantity, removeItem]
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            description="Browse the marketplace and add what you need."
            actionLabel="Browse the marketplace"
            onAction={() => router.replace(asHref('/(tabs)/market'))}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.product.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.summary}>
        <SummaryRow label="Items" value={`${items.length}`} />
        <SummaryRow label="Delivery" value="Arranged separately" muted />

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <View style={styles.totalValues}>
            <Text style={styles.totalUSD}>${totalUSD.toFixed(2)}</Text>
            <Text style={styles.totalZWG}>
              ZWG {Math.round(totalUSD * rate.usdToZwg).toLocaleString()}
              {isIndicative ? ' · indicative' : ''}
            </Text>
          </View>
        </View>

        <Button
          title="Proceed to checkout"
          size="lg"
          onPress={() => router.push(asHref('/(tabs)/market/checkout'))}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, muted && styles.summaryValueMuted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  list: { padding: DS.spacing.md, gap: DS.spacing.sm + 4 },

  row: {
    flexDirection: 'row',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 2,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  rowBody: { flex: 1, gap: 3 },
  name: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 19,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  price: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  unit: { fontFamily: DS.fontFamily.regular, color: DS.colors.textMuted },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: DS.spacing.sm,
    marginTop: 4,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  rowRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  removeBtn: { padding: 2 },
  lineTotal: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  summary: {
    backgroundColor: DS.colors.surface,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
    padding: DS.spacing.md,
    gap: DS.spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  // The label takes the pressure so the figure never does: a truncated price
  // is worse than a truncated word.
  summaryLabel: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  summaryValue: {
    flexShrink: 0,
    textAlign: 'right',
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  summaryValueMuted: { fontFamily: DS.fontFamily.regular, color: DS.colors.textMuted },

  divider: { height: 1, backgroundColor: DS.colors.borderLight, marginVertical: 2 },

  totalRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  totalLabel: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  totalValues: { alignItems: 'flex-end' },
  totalUSD: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  totalZWG: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
