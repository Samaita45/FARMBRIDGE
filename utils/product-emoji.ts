const CATEGORY_EMOJI: Record<string, string> = {
  'Seeds & Seedlings': '🌱',
  'Harvested Crops': '🥬',
  'Animal Products': '🐄',
  'Honey & Bee Products': '🍯',
  'Farm Equipment': '🚜',
  Agrochemicals: '🧪',
  'Packaging & Storage': '📦',
};

const PRODUCT_EMOJI: Record<string, string> = {
  maize: '🌽',
  tomato: '🍅',
  honey: '🍯',
  hoe: '⛏️',
  eggs: '🥚',
  milk: '🥛',
  beef: '🥩',
  goat: '🐐',
  fertilizer: '🧪',
  pump: '💧',
  avocado: '🥑',
};

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? '🛒';
}

export function getProductEmoji(name: string, category: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(PRODUCT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return getCategoryEmoji(category);
}
