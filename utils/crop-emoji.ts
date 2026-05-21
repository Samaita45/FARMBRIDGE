import type { ImageSourcePropType } from 'react-native';

const UNSPLASH_PARAMS = '?auto=format&fit=crop&w=600&q=80';

const CROP_IMAGES: Record<string, string> = {
  tomatoes: `https://images.unsplash.com/photo-1592924357228-91a4daadcfea${UNSPLASH_PARAMS}`,
  maize: `https://images.unsplash.com/photo-1551754655-cd27e38d2076${UNSPLASH_PARAMS}`,
  tobacco: `https://images.unsplash.com/photo-1501004318641-b39e6451bec6${UNSPLASH_PARAMS}`,
  onions: `https://images.unsplash.com/photo-1508747703725-719777637510${UNSPLASH_PARAMS}`,
  potatoes: `https://images.unsplash.com/photo-1518977676601-b53f82aba655${UNSPLASH_PARAMS}`,
  cabbage: `https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f${UNSPLASH_PARAMS}`,
  peppers: `https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba${UNSPLASH_PARAMS}`,
  beans: `https://images.unsplash.com/photo-1564894809611-1742fc40ed80${UNSPLASH_PARAMS}`,
  groundnuts: `https://images.unsplash.com/photo-1600950246025-5af07814f0b6${UNSPLASH_PARAMS}`,
  soyabeans: `https://images.unsplash.com/photo-1592924357228-91a4daadcfea${UNSPLASH_PARAMS}`,
  wheat: `https://images.unsplash.com/photo-1500382017468-9049fed747ef${UNSPLASH_PARAMS}`,
  bananas: `https://images.unsplash.com/photo-1603833665858-e61d17a86224${UNSPLASH_PARAMS}`,
  mangoes: `https://images.unsplash.com/photo-1601493700631-2b16ec4b4716${UNSPLASH_PARAMS}`,
  avocado: `https://images.unsplash.com/photo-1523049673857-eb18f1d7b578${UNSPLASH_PARAMS}`,
  watermelon: `https://images.unsplash.com/photo-1589984662646-e7b2e4962f18${UNSPLASH_PARAMS}`,
  garlic: `https://images.unsplash.com/photo-1615477550927-6ec0f803f3e9${UNSPLASH_PARAMS}`,
  chillies: `https://images.unsplash.com/photo-1583119022894-919a68a3d0e3${UNSPLASH_PARAMS}`,
  mushrooms: `https://images.unsplash.com/photo-1504545102780-26774c1bb073${UNSPLASH_PARAMS}`,
  honey: `https://images.unsplash.com/photo-1587049352846-4a222e784d38${UNSPLASH_PARAMS}`,
};

const CATEGORY_IMAGES: Record<string, string> = {
  vegetable: `https://images.unsplash.com/photo-1542838132-92c53300491e${UNSPLASH_PARAMS}`,
  grain: `https://images.unsplash.com/photo-1500382017468-9049fed747ef${UNSPLASH_PARAMS}`,
  fruit: `https://images.unsplash.com/photo-1619566636858-adf3ef46400b${UNSPLASH_PARAMS}`,
  legume: `https://images.unsplash.com/photo-1564894809611-1742fc40ed80${UNSPLASH_PARAMS}`,
  'cash crop': `https://images.unsplash.com/photo-1501004318641-b39e6451bec6${UNSPLASH_PARAMS}`,
};

const CROP_ICONS: Record<string, string> = {
  vegetable: 'leaf-outline',
  grain: 'nutrition-outline',
  fruit: 'restaurant-outline',
  legume: 'flower-outline',
  'cash crop': 'trending-up-outline',
};

export function getCropImage(cropId: string, category?: string): ImageSourcePropType {
  return { uri: CROP_IMAGES[cropId] ?? CATEGORY_IMAGES[category ?? ''] ?? CATEGORY_IMAGES.vegetable };
}

export function getCropIcon(category?: string): string {
  return CROP_ICONS[category ?? ''] ?? 'leaf-outline';
}

export function getCropEmoji(cropId: string, category?: string): string {
  return CROP_ICONS[cropId] ?? getCropIcon(category);
}

export function getDemandBadge(level: string): { label: string; color: string; bg: string } {
  switch (level) {
    case 'very_high': return { label: 'Very High', color: '#ef4444', bg: '#fee2e2' };
    case 'high':      return { label: 'High',      color: '#f59e0b', bg: '#fef3c7' };
    case 'medium':    return { label: 'Medium',    color: '#eab308', bg: '#fefce8' };
    default:          return { label: 'Low',       color: '#94a3b8', bg: '#f1f5f9' };
  }
}
