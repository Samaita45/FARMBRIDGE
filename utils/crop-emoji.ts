const CROP_EMOJI: Record<string, string> = {
  tomatoes: '🍅',
  maize: '🌽',
  tobacco: '🍃',
  onions: '🧅',
  potatoes: '🥔',
  cabbage: '🥬',
  peppers: '🌶️',
  beans: '🫘',
  groundnuts: '🥜',
  soyabeans: '🫛',
  wheat: '🌾',
  bananas: '🍌',
  mangoes: '🥭',
  avocado: '🥑',
  watermelon: '🍉',
  garlic: '🧄',
  chillies: '🌶️',
  mushrooms: '🍄',
  honey: '🍯',
};

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '🥬',
  grain: '🌾',
  fruit: '🍎',
  legume: '🫘',
  'cash crop': '💵',
};

export function getCropEmoji(cropId: string, category?: string): string {
  return CROP_EMOJI[cropId] ?? CATEGORY_EMOJI[category ?? ''] ?? '🌱';
}

export function getDemandBadge(level: string): { label: string; color: string } {
  switch (level) {
    case 'very_high':
      return { label: '🔴 Very High', color: '#ef4444' };
    case 'high':
      return { label: '🟠 High', color: '#f59e0b' };
    case 'medium':
      return { label: '🟡 Medium', color: '#eab308' };
    default:
      return { label: '⚪ Low', color: '#94a3b8' };
  }
}
