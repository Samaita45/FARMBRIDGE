import type { ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Colors from '@/constants/colors';
import { Radius, Shadows } from '@/constants/Spacing';
import Typography from '@/constants/Typography';

// ─── Base Card ───────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.base, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.base, style]}>{children}</View>;
}

// ─── Crop Trend Card (horizontal scroll) ─────────────────────
type DemandLevel = 'Very High' | 'High' | 'Medium' | 'Low';

interface CropTrendCardProps {
  emoji: string;
  name: string;
  priceUSD: number;
  demand: DemandLevel;
  changePercent: number;
  onPress?: () => void;
}

const DEMAND_COLORS: Record<DemandLevel, { bg: string; text: string }> = {
  'Very High': { bg: '#fee2e2', text: '#ef4444' },
  'High':      { bg: '#fef3c7', text: '#f59e0b' },
  'Medium':    { bg: '#f0fdf4', text: '#16a34a' },
  'Low':       { bg: '#f1f5f9', text: '#64748b' },
};

export function CropTrendCard({
  emoji,
  name,
  priceUSD,
  demand,
  changePercent,
  onPress,
}: CropTrendCardProps) {
  const demandStyle = DEMAND_COLORS[demand] ?? DEMAND_COLORS['Medium'];
  const isPositive = changePercent >= 0;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.cropCard}>
      {/* Emoji / image */}
      <View style={styles.cropEmojiWrapper}>
        <Text style={styles.cropEmoji}>{emoji}</Text>
      </View>

      {/* Name */}
      <Text style={styles.cropName} numberOfLines={1}>{name}</Text>

      {/* Price */}
      <Text style={styles.cropPrice}>${priceUSD.toFixed(2)}</Text>

      {/* Bottom row */}
      <View style={styles.cropBottom}>
        <View style={[styles.demandBadge, { backgroundColor: demandStyle.bg }]}>
          <Text style={[styles.demandText, { color: demandStyle.text }]}>{demand}</Text>
        </View>
        <Text style={[styles.changeText, { color: isPositive ? Colors.success : Colors.error }]}>
          {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Product Marketplace Card ─────────────────────────────────
interface ProductCardProps {
  image?: ImageSourcePropType;
  name: string;
  priceUSD: number;
  priceZWG: number;
  seller: string;
  location?: string;
  onAddToCart?: () => void;
  onPress?: () => void;
  cardWidth: number;
}

export function ProductCard({
  image,
  name,
  priceUSD,
  priceZWG,
  seller,
  location,
  onAddToCart,
  onPress,
  cardWidth,
}: ProductCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.productCard, { width: cardWidth }]}>
      {/* Image */}
      <View style={styles.productImageWrapper}>
        {image ? (
          <Image source={image} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Text style={styles.productImagePlaceholderText}>🌿</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={2}>{name}</Text>

        <Text style={styles.productPriceUSD}>USD ${priceUSD.toFixed(2)}</Text>
        <Text style={styles.productPriceZWG}>ZWG {priceZWG.toLocaleString()}</Text>

        <View style={styles.productFooter}>
          <View style={styles.productSeller}>
            <Text style={styles.productSellerText} numberOfLines={1}>
              📍 {seller}{location ? `, ${location}` : ''}
            </Text>
          </View>
          {onAddToCart ? (
            <TouchableOpacity onPress={onAddToCart} style={styles.addToCartBtn}>
              <Text style={styles.addToCartText}>+</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll ? (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.sectionViewAll}>View All</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Base card
  base: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: 16,
    marginBottom: 12,
    ...Shadows.card,
  },

  // Crop trend card
  cropCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: 12,
    marginRight: 12,
    ...Shadows.card,
  },
  cropEmojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cropEmoji: {
    fontSize: 28,
  },
  cropName: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cropPrice: {
    ...Typography.heading3,
    color: Colors.primary,
    marginBottom: 8,
  },
  cropBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  demandBadge: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  demandText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  changeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Product card
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: 12,
    ...Shadows.card,
  },
  productImageWrapper: {
    width: '100%',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
  },
  productImagePlaceholder: {
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 40,
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productPriceUSD: {
    ...Typography.heading3,
    color: Colors.primary,
    marginBottom: 2,
  },
  productPriceZWG: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productSeller: {
    flex: 1,
    marginRight: 8,
  },
  productSellerText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  addToCartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  sectionViewAll: {
    ...Typography.label,
    color: Colors.primary,
  },
});
