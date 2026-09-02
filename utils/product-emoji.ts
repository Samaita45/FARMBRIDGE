/**
 * @deprecated Import from `@/constants/produce-imagery`.
 *
 * Compatibility shim. The name is a leftover from when these returned emoji;
 * they return photographs and icon names now, and the verified image table
 * lives in constants/produce-imagery.
 */
import type { ImageSourcePropType } from 'react-native';

import { categoryIconFor, imageSourceFor } from '@/constants/produce-imagery';
import type { MarketProduct } from '@/types';
import type { IconName } from '@/types/icons';

export function getCategoryIcon(category: string): IconName {
  return categoryIconFor(category);
}

export function getProductImage(
  product: Pick<MarketProduct, 'name' | 'category' | 'images'>
): ImageSourcePropType {
  // A seller's own photograph always wins over the stock library.
  if (product.images[0]) return { uri: product.images[0] };
  return imageSourceFor(`${product.name} ${product.category}`);
}
