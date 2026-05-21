import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import { useCartStore, type CartState } from '@/stores/cartStore';
import type { MarketProduct } from '@/types';
import { getCategoryIcon, getProductImage } from '@/utils/product-emoji';

interface ProductCardProps {
  product: MarketProduct;
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  const addItem = useCartStore((s: CartState) => s.addItem);
  const inCart = useCartStore((s: CartState) => s.items.some((i) => i.product.id === product.id));

  return (
    <View style={[s.card, compact && s.cardCompact]}>
      <Link href={asHref(`/(tabs)/market/${product.id}`)} asChild>
        <Pressable style={({ pressed }) => pressed && { opacity: 0.9 }}>
          {/* Product image area */}
          <View style={[s.imageArea, compact && s.imageAreaCompact]}>
            <Image source={getProductImage(product)} style={s.productImage} resizeMode="cover" />
            <View style={s.imageShade} />
            <View style={s.categoryIcon}>
              <Ionicons name={getCategoryIcon(product.category) as keyof typeof Ionicons.glyphMap} size={14} color={DS.colors.primary} />
            </View>
            {product.isOrganic && (
              <View style={s.organicBadge}>
                <Ionicons name="leaf" size={8} color={DS.colors.success} />
                <Text style={s.organicText}>Organic</Text>
              </View>
            )}
            {product.isCertified && (
              <View style={s.certifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color={DS.colors.accent} />
              </View>
            )}
          </View>

          {/* Info area */}
          <View style={s.info}>
            <Text style={s.name} numberOfLines={2}>{product.name}</Text>

            {/* Rating row */}
            <View style={s.ratingRow}>
              <Ionicons name="star" size={11} color="#F9A825" />
              <Text style={s.rating}>{product.rating}</Text>
              <Text style={s.reviewCount}>({product.reviewCount})</Text>
            </View>

            {/* Seller */}
            <View style={s.sellerRow}>
              <Ionicons name="person-circle-outline" size={11} color={DS.colors.textMuted} />
              <Text style={s.seller} numberOfLines={1}>{product.sellerName}</Text>
            </View>

            {/* Price */}
            <View style={s.priceRow}>
              <Text style={s.priceUSD}>${product.priceUSD}</Text>
              <Text style={s.priceUnit}> / {product.unit}</Text>
            </View>
            <Text style={s.priceZWG}>ZWG {product.priceZWG}</Text>
          </View>
        </Pressable>
      </Link>

      {/* Footer */}
      <View style={s.footer}>
        <View style={[s.stockPill, !product.inStock && s.stockPillOut]}>
          <View style={[s.stockDot, !product.inStock && s.stockDotOut]} />
          <Text style={[s.stockText, !product.inStock && s.stockTextOut]}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
        <Pressable
          disabled={!product.inStock}
          onPress={() => addItem(product)}
          style={({ pressed }) => [
            s.cartBtn,
            !product.inStock && s.cartBtnDisabled,
            inCart && s.cartBtnInCart,
            pressed && { opacity: 0.8 },
          ]}>
          <Ionicons
            name={inCart ? 'checkmark' : 'cart'}
            size={12}
            color={inCart ? DS.colors.success : '#fff'}
          />
          <Text style={[s.cartBtnText, inCart && { color: DS.colors.success }]}>
            {inCart ? 'Added' : '+ Cart'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    ...DS.shadow.card,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  cardCompact: { width: 150, marginRight: 12, marginBottom: 0 },

  // Image
  imageArea: {
    height: 120, backgroundColor: DS.colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  imageAreaCompact: { height: 96 },
  productImage: { width: '100%', height: '100%' },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  categoryIcon: {
    position: 'absolute', right: 8, bottom: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  organicBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: DS.colors.accentLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  organicText: { fontSize: 9, fontWeight: '700', color: DS.colors.success },
  certifiedBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: DS.colors.accentLight, borderRadius: 6,
    padding: 4,
  },

  // Info
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '700', color: DS.colors.text, lineHeight: 17, marginBottom: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  rating: { fontSize: 11, fontWeight: '700', color: DS.colors.text },
  reviewCount: { fontSize: 10, color: DS.colors.textMuted },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  seller: { fontSize: 10, color: DS.colors.textMuted, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceUSD: { fontSize: 16, fontWeight: '900', color: DS.colors.primary },
  priceUnit: { fontSize: 11, color: DS.colors.textMuted, fontWeight: '400' },
  priceZWG: { fontSize: 10, color: DS.colors.textMuted, marginTop: 1 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2,
  },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockPillOut: {},
  stockDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DS.colors.success },
  stockDotOut: { backgroundColor: DS.colors.red },
  stockText: { fontSize: 11, fontWeight: '600', color: DS.colors.success },
  stockTextOut: { color: DS.colors.red },
  cartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: DS.colors.primary, borderRadius: DS.radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  cartBtnDisabled: { backgroundColor: DS.colors.gray[300] },
  cartBtnInCart: { backgroundColor: DS.colors.accentLight, borderWidth: 1, borderColor: DS.colors.success },
  cartBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
