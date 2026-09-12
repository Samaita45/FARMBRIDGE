import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { imageSourceFor } from '@/constants/produce-imagery';
import { asHref } from '@/lib/href';
import { useCartStore, type CartState } from '@/stores/cartStore';
import type { MarketProduct } from '@/types';

interface ProductCardProps {
  product: MarketProduct;
  /** Fixed-width card for a horizontal row. Default is a flexible grid tile. */
  compact?: boolean;
}

/**
 * A marketplace listing.
 *
 * Follows the reference layout: photograph on top, then name, then price with
 * its unit, then where it is coming from. The picture does the identifying
 * work, so it gets the space — and it is now a photograph of the actual
 * product rather than a generic category image.
 */
export function ProductCard({ product, compact }: ProductCardProps) {
  const addItem = useCartStore((s: CartState) => s.addItem);
  const inCart = useCartStore((s: CartState) => s.items.some((i) => i.product.id === product.id));

  const source = product.images[0]
    ? { uri: product.images[0] }
    : imageSourceFor(`${product.name} ${product.category}`);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Link href={asHref(`/(tabs)/market/${product.id}`)} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${product.name}, $${product.priceUSD.toFixed(2)} per ${product.unit}, from ${product.sellerName} in ${product.location}`}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
          <View style={styles.imageWrap}>
            <Image
              source={source}
              style={styles.image}
              contentFit="cover"
              transition={200}
              // Remote imagery on a metered connection: cache it hard.
              cachePolicy="memory-disk"
            />

            {product.isOrganic ? (
              <View style={styles.organic}>
                <Ionicons name="leaf" size={9} color={DS.semantic.success.fg} />
                <Text style={styles.organicText}>Organic</Text>
              </View>
            ) : null}

            {!product.inStock ? (
              <View style={styles.soldOut}>
                <Text style={styles.soldOutText}>Sold out</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <Text
              style={styles.name}
              numberOfLines={2}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {product.name}
            </Text>

            <Text style={styles.price} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              ${product.priceUSD.toFixed(2)}
              <Text style={styles.unit}> per {product.unit}</Text>
            </Text>

            <View style={styles.metaRow}>
              <Ionicons name="star" size={10} color={DS.semantic.warning.solid} />
              <Text style={styles.meta} numberOfLines={1}>
                {product.rating} · {product.location}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <Pressable
        onPress={() => addItem(product)}
        disabled={!product.inStock}
        accessibilityRole="button"
        accessibilityLabel={
          inCart ? `${product.name} is in your cart` : `Add ${product.name} to cart`
        }
        accessibilityState={{ disabled: !product.inStock }}
        style={({ pressed }) => [
          styles.addBtn,
          inCart && styles.addBtnInCart,
          !product.inStock && styles.addBtnDisabled,
          pressed && styles.pressed,
        ]}>
        <Ionicons
          name={inCart ? 'checkmark' : 'add'}
          size={16}
          color={DS.colors.textInverse}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  cardCompact: { width: 168, flex: 0 },
  pressable: { flex: 1 },
  pressed: { opacity: 0.9 },

  imageWrap: {
    width: '100%',
    aspectRatio: 1.25,
    backgroundColor: DS.colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },

  organic: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DS.semantic.success.bg,
    borderRadius: DS.radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organicText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.success.fg,
  },

  soldOut: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  soldOutText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  body: { padding: DS.spacing.sm + 2, gap: 3 },
  name: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    minHeight: 34,
  },
  price: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  unit: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: {
    flex: 1,
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  addBtn: {
    position: 'absolute',
    right: DS.spacing.sm,
    // Sits on the seam between image and body, as in the reference.
    top: '46%',
    width: 32,
    height: 32,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primary,
    ...DS.shadow.card,
  },
  addBtnInCart: { backgroundColor: DS.semantic.success.solid },
  addBtnDisabled: { backgroundColor: DS.colors.textFaint },
});
