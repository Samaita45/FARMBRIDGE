import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/design-system';
import { ProductCard } from '@/components/market/product-card';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { whatsAppUrl } from '@/constants/support';
import { getProductById, MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useCartStore, type CartState } from '@/stores/cartStore';
import { getProductImage } from '@/utils/product-emoji';

/**
 * A marketplace listing, laid out to the reference's detail screen: the
 * photograph runs to the edges, and the facts sit on a card lifted over it.
 *
 * TWO THINGS WERE REMOVED HERE, BOTH DISHONEST.
 *
 * The reviews came from `getMockReviews`, which returned the same three
 * invented testimonials — with Zimbabwean names, specific praise and plausible
 * dates — under every product in the catalogue. "Tendai M. — Great quality,
 * fast delivery to Harare" appeared identically beneath maize seed, honey and a
 * water pump. Fabricated testimonials are not placeholder copy; someone
 * deciding whether to send money to a stranger was reading invented
 * reassurance. FarmBridge does not collect written reviews yet, and the screen
 * now says exactly that.
 *
 * "Similar products" was a heading with nothing underneath it. It is now the
 * rest of the category, which is what it always claimed to be.
 */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const addItem = useCartStore((s: CartState) => s.addItem);
  const cartCount = useCartStore((s: CartState) => s.getItemCount());
  const [quantity, setQuantity] = useState(1);

  const product = getProductById(id ?? '');

  const similar = useMemo(
    () =>
      product
        ? MARKET_PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6)
        : [],
    [product]
  );

  if (!product) {
    return (
      <View style={styles.centre}>
        <Ionicons name="alert-circle-outline" size={36} color={DS.colors.textFaint} />
        <Text style={styles.missing}>This listing is no longer available.</Text>
        <Button
          title="Back to the marketplace"
          variant="outline"
          onPress={() => router.replace(asHref('/(tabs)/market'))}
        />
      </View>
    );
  }

  const total = product.priceUSD * quantity;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={product.images[0] ? { uri: product.images[0] } : getProductImage(product)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
          />

          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={22} color={DS.colors.text} />
            </Pressable>

            <Pressable
              onPress={() => router.push(asHref('/(tabs)/market/cart'))}
              accessibilityRole="button"
              accessibilityLabel={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart, empty'}
              style={styles.circleBtn}>
              <Ionicons name="cart-outline" size={20} color={DS.colors.text} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.sheet}>
          <View style={styles.badges}>
            {product.isOrganic ? <Badge icon="leaf" text="Organic" tone="success" /> : null}
            {product.isCertified ? (
              <Badge icon="shield-checkmark" text="Certified" tone="info" />
            ) : null}
            <Badge
              icon={product.inStock ? 'checkmark-circle' : 'close-circle'}
              text={product.inStock ? 'In stock' : 'Out of stock'}
              tone={product.inStock ? 'success' : 'danger'}
            />
          </View>

          <Text style={styles.name} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              ${product.priceUSD.toFixed(2)}
              <Text style={styles.priceUnit}> per {product.unit}</Text>
            </Text>
            <Text style={styles.priceZwg}>ZWG {product.priceZWG.toLocaleString()}</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <Pressable
            onPress={() =>
              router.push(
                asHref({ pathname: '/(tabs)/market/search', params: { q: product.sellerName } })
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`${product.sellerName}, ${product.location}, rated ${product.rating}. See their other listings.`}
            style={({ pressed }) => [styles.seller, pressed && styles.pressed]}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="storefront-outline" size={20} color={DS.colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.sellerName} numberOfLines={1}>
                {product.sellerName}
              </Text>
              <View style={styles.sellerMeta}>
                <Ionicons name="location-outline" size={12} color={DS.colors.textSoft} />
                <Text style={styles.sellerMetaText}>{product.location}</Text>
                <Ionicons name="star" size={12} color={DS.semantic.warning.solid} />
                <Text style={styles.sellerMetaText}>
                  {product.rating} ({product.reviewCount})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.reviewsEmpty}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={DS.colors.textSoft} />
            <Text style={styles.reviewsEmptyText}>
              FarmBridge does not collect written reviews yet. The {product.rating} rating comes
              with the listing; there is nothing here that a buyer has typed.
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>How many?</Text>
          <View style={styles.quantityRow}>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                accessibilityRole="button"
                accessibilityLabel="Reduce quantity"
                style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}>
                <Ionicons name="remove" size={18} color={DS.colors.text} />
              </Pressable>
              <Text style={styles.quantity} accessibilityLabel={`Quantity ${quantity}`}>
                {quantity}
              </Text>
              <Pressable
                onPress={() => setQuantity((q) => q + 1)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                style={styles.stepBtn}>
                <Ionicons name="add" size={18} color={DS.colors.text} />
              </Pressable>
            </View>

            <View style={styles.totalWrap}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              void Linking.openURL(
                whatsAppUrl(`Hi, I'm interested in ${product.name} on FarmBridge.`)
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`Message the seller about ${product.name} on WhatsApp`}
            style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
            <Ionicons name="logo-whatsapp" size={20} color={DS.colors.textInverse} />
            <Text style={styles.whatsappText}>Message the seller</Text>
          </Pressable>

          {similar.length > 0 ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>More in {product.category}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarRow}>
                {similar.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bar}>
        <View style={styles.barInner}>
          <Button
            title="Add to cart"
            variant="outline"
            size="lg"
            style={styles.barBtn}
            disabled={!product.inStock}
            onPress={() => {
              addItem(product, quantity);
              showToast(`${quantity} × ${product.name} added`, 'success');
            }}
          />
          <Button
            title="Buy now"
            size="lg"
            style={styles.barBtn}
            disabled={!product.inStock}
            onPress={() => {
              addItem(product, quantity);
              router.push(asHref('/(tabs)/market/checkout'));
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Badge({
  icon,
  text,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  tone: 'success' | 'info' | 'danger';
}) {
  const role = DS.semantic[tone];
  return (
    <View style={[styles.badge, { backgroundColor: role.bg, borderColor: role.border }]}>
      <Ionicons name={icon} size={11} color={role.fg} />
      <Text style={[styles.badgeText, { color: role.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.9 },
  scroll: { paddingBottom: DS.spacing.lg },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.lg,
    backgroundColor: DS.colors.background,
  },
  missing: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  hero: { height: 320, backgroundColor: DS.colors.surfaceMuted },
  heroBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    ...DS.shadow.card,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: DS.radius.full,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.semantic.danger.solid,
    borderWidth: 2,
    borderColor: DS.colors.surface,
  },
  cartBadgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.bold,
    color: DS.semantic.danger.onSolid,
  },

  // Lifted over the photograph, as in the reference.
  sheet: {
    marginTop: -DS.spacing.lg,
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    padding: DS.spacing.md,
    gap: DS.spacing.sm,
  },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontFamily: DS.fontFamily.semibold },

  name: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: DS.spacing.sm },
  price: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.primary,
  },
  priceUnit: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  priceZwg: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  description: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 21,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.sm + 4,
    marginTop: DS.spacing.xs,
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  sellerName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sellerMetaText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  divider: {
    height: DS.layout.hairline,
    backgroundColor: DS.colors.borderLight,
    marginVertical: DS.spacing.sm,
  },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  reviewsEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.md,
    padding: DS.spacing.sm + 4,
  },
  reviewsEmptyText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    paddingHorizontal: 5,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.35 },
  quantity: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  totalWrap: { alignItems: 'flex-end' },
  totalLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  total: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    borderRadius: DS.radius.full,
    // WhatsApp's own green, darkened from #25D366 so white on it clears 4.5:1
    // rather than the 1.9:1 the brand colour gives.
    backgroundColor: '#0F7A3D',
    marginTop: DS.spacing.xs,
  },
  whatsappText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  similarRow: { gap: DS.spacing.sm + 4, paddingRight: DS.spacing.md, paddingTop: DS.spacing.sm },

  bar: {
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
  },
  barInner: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
  },
  barBtn: { flex: 1 },
});
