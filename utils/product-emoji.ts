import type { ImageSourcePropType } from 'react-native';

import type { MarketProduct } from '@/types';

const UNSPLASH_PARAMS = '?auto=format&fit=crop&w=700&q=80';

const CATEGORY_ICONS: Record<string, string> = {
  'Seeds & Seedlings': 'leaf-outline',
  'Harvested Crops': 'basket-outline',
  'Animal Products': 'paw-outline',
  'Honey & Bee Products': 'flower-outline',
  'Farm Equipment': 'construct-outline',
  Agrochemicals: 'flask-outline',
  'Packaging & Storage': 'cube-outline',
};

const CATEGORY_IMAGES: Record<string, string> = {
  'Seeds & Seedlings': `https://images.unsplash.com/photo-1416879595882-3373a0480b5b${UNSPLASH_PARAMS}`,
  'Harvested Crops': `https://images.unsplash.com/photo-1542838132-92c53300491e${UNSPLASH_PARAMS}`,
  'Animal Products': `https://images.unsplash.com/photo-1516467508483-a7212febe31a${UNSPLASH_PARAMS}`,
  'Honey & Bee Products': `https://images.unsplash.com/photo-1587049352846-4a222e784d38${UNSPLASH_PARAMS}`,
  'Farm Equipment': `https://images.unsplash.com/photo-1529511582893-2d7e684dd128${UNSPLASH_PARAMS}`,
  Agrochemicals: `https://images.unsplash.com/photo-1581093458791-9d15482442f6${UNSPLASH_PARAMS}`,
  'Packaging & Storage': `https://images.unsplash.com/photo-1607344645866-009c7dca0ec2${UNSPLASH_PARAMS}`,
};

const PRODUCT_IMAGES: Record<string, string> = {
  maize: `https://images.unsplash.com/photo-1551754655-cd27e38d2076${UNSPLASH_PARAMS}`,
  tomato: `https://images.unsplash.com/photo-1592924357228-91a4daadcfea${UNSPLASH_PARAMS}`,
  honey: `https://images.unsplash.com/photo-1587049352846-4a222e784d38${UNSPLASH_PARAMS}`,
  hoe: `https://images.unsplash.com/photo-1416879595882-3373a0480b5b${UNSPLASH_PARAMS}`,
  eggs: `https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f${UNSPLASH_PARAMS}`,
  milk: `https://images.unsplash.com/photo-1563636619-e9143da7973b${UNSPLASH_PARAMS}`,
  beef: `https://images.unsplash.com/photo-1607623814075-e51df1bdc82f${UNSPLASH_PARAMS}`,
  goat: `https://images.unsplash.com/photo-1524024973431-2ad916746881${UNSPLASH_PARAMS}`,
  fertilizer: `https://images.unsplash.com/photo-1581093458791-9d15482442f6${UNSPLASH_PARAMS}`,
  pump: `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee${UNSPLASH_PARAMS}`,
  avocado: `https://images.unsplash.com/photo-1523049673857-eb18f1d7b578${UNSPLASH_PARAMS}`,
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? 'storefront-outline';
}

export function getProductImage(product: Pick<MarketProduct, 'name' | 'category' | 'images'>): ImageSourcePropType {
  if (product.images[0]) return { uri: product.images[0] };

  const lower = product.name.toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (lower.includes(key)) return { uri: url };
  }

  return { uri: CATEGORY_IMAGES[product.category] ?? CATEGORY_IMAGES['Harvested Crops'] };
}

export function getProductEmoji(name: string, category: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(PRODUCT_IMAGES)) {
    if (lower.includes(key)) return getCategoryIcon(category);
  }
  return getCategoryIcon(category);
}
