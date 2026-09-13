import type { ProductDto } from '@/services/api/products.api';
import type { MarketProduct } from '@/types';

/**
 * A server listing in the shape the marketplace screens already speak.
 *
 * The cart, the product page and the shelf are all built around MarketProduct,
 * and rewriting them to carry two product shapes would be a large change for no
 * gain. Mapping at the boundary keeps one shape inland.
 *
 * WHAT IT REFUSES TO INVENT. MarketProduct carries a rating, a review count and
 * organic and certified flags. The server has none of those, because FarmBridge
 * does not collect reviews and does not verify certification. They come back
 * zero and false rather than plausible — a listing that claims 4.6 from 89
 * reviews that were never left is a lie told to a buyer deciding who to trust.
 * The screens already hide the rating when the count is zero.
 */
export function toMarketProduct(dto: ProductDto, zwgRate: number): MarketProduct {
  const priceUSD = dto.priceUsdCents / 100;
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    priceUSD,
    priceZWG: Math.round(priceUSD * zwgRate),
    unit: dto.unit,
    sellerId: dto.sellerId,
    sellerName: dto.sellerName,
    location: dto.province ?? 'Zimbabwe',
    rating: 0,
    reviewCount: 0,
    inStock: dto.status === 'ACTIVE' && dto.quantity > 0,
    images: dto.imageUrls,
    description: dto.description ?? '',
    isOrganic: false,
    isCertified: false,
  };
}
