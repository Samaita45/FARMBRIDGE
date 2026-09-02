/**
 * @deprecated Import from `@/constants/produce-imagery`.
 *
 * Compatibility shim; see the note in product-emoji.
 */
import type { ImageSourcePropType } from 'react-native';

import { categoryIconFor, imageSourceFor } from '@/constants/produce-imagery';
import type { IconName } from '@/types/icons';

export function getCropImage(cropId: string, category?: string): ImageSourcePropType {
  return imageSourceFor(`${cropId} ${category ?? ''}`);
}

export function getCropIcon(category?: string): IconName {
  return categoryIconFor(category);
}

export function getDemandBadge(level: string): { label: string; color: string; bg: string } {
  switch (level) {
    case 'very_high':
      return { label: 'Very high', color: '#991B1B', bg: '#FEF2F2' };
    case 'high':
      return { label: 'High', color: '#92400E', bg: '#FFFBEB' };
    case 'medium':
      return { label: 'Medium', color: '#1E40AF', bg: '#EFF6FF' };
    default:
      return { label: 'Low', color: '#334155', bg: '#F1F5F9' };
  }
}
