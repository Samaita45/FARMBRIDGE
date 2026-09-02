import type { ImageSourcePropType } from 'react-native';

import type { IconName } from '@/types/icons';

/**
 * Photographs for crops and marketplace products.
 *
 * WHY THIS FILE EXISTS. The catalogue holds 87 products but the old map had 11
 * image keys, so most listings fell through to a generic category photo:
 * "Onion Seed Hybrid Red", "Cabbage Seed Gloria F1" and "Sunflower Seed PAN
 * 7034" all showed the same anonymous pile of seed. A farmer choosing what to
 * buy was looking at a picture of something else.
 *
 * EVERY IMAGE BELOW WAS OPENED AND LOOKED AT. That is not pedantry — the search
 * descriptions were wrong in both directions. One result described as "bell
 * peppers" was a mixed vegetable assortment; one described as "brown potato"
 * was in fact the butternut squash we wanted; and a search for "mushrooms"
 * returned fly agaric, a poisonous toadstool, which would have shipped as farm
 * produce. Do not add an entry here from a search description alone.
 *
 * Matching is ordered and specific-first, so "Maize Seed SC403" resolves to
 * maize rather than to a generic bag of seed.
 */

const PARAMS = '?auto=format&fit=crop&w=800&q=75';
const url = (id: string) => `https://images.unsplash.com/${id}${PARAMS}`;

/**
 * Ordered keyword table. The first entry whose keywords appear in the product
 * or crop name wins, so more specific rows sit above more general ones.
 */
const IMAGERY: { keys: string[]; id: string }[] = [
  // ─── Field crops ──────────────────────────────────────────────────────────
  { keys: ['maize', 'mealie', 'corn'], id: 'photo-1634467524884-897d0af5e104' },
  { keys: ['tomato'], id: 'photo-1592924357228-91a4daadcfea' },
  { keys: ['onion'], id: 'photo-1618512496248-a07fe83aa8cb' },
  { keys: ['cabbage'], id: 'photo-1611105637889-3afd7295bdbf' },
  { keys: ['broccoli'], id: 'photo-1685504445355-0e7bdf90d415' },
  { keys: ['pepper', 'capsicum'], id: 'photo-1525607551316-4a8e16d1f9ba' },
  { keys: ['chilli', 'chili'], id: 'photo-1583119022894-919a68a3d0e3' },
  { keys: ['spinach'], id: 'photo-1576045057995-568f588f82fb' },
  { keys: ['sunflower'], id: 'photo-1598920710727-e6c74781538c' },
  { keys: ['soyabean', 'soybean', 'soya'], id: 'photo-1630097000556-e842ad79625b' },
  { keys: ['groundnut', 'peanut'], id: 'photo-1549978113-29eb25c8177f' },
  { keys: ['tobacco'], id: 'photo-1634922951968-11ca107aa6e3' },
  { keys: ['butternut', 'squash', 'pumpkin'], id: 'photo-1583260142340-1569bcfeb39c' },
  { keys: ['watermelon'], id: 'photo-1587049352846-4a222e784d38' },
  { keys: ['potato'], id: 'photo-1518977676601-b53f82aba655' },
  { keys: ['wheat'], id: 'photo-1687704488747-69d5fd913282' },
  { keys: ['garlic'], id: 'photo-1540148426945-6cf22a6b2383' },
  { keys: ['mushroom'], id: 'photo-1552825897-bb5efa86eab1' },
  { keys: ['avocado'], id: 'photo-1523049673857-eb18f1d7b578' },
  { keys: ['banana'], id: 'photo-1603833665858-e61d17a86224' },
  { keys: ['mango'], id: 'photo-1732472581875-89ff83f18439' },
  // Legumes last among crops, so "sugar bean", "cowpea" and "sugar bean seed"
  // land here rather than on a seed-bag photo.
  { keys: ['bean', 'cowpea', 'legume'], id: 'photo-1564894809611-1742fc40ed80' },

  // ─── Bee products ─────────────────────────────────────────────────────────
  {
    keys: ['honey', 'beeswax', 'propolis', 'royal jelly', 'bee pollen', 'comb'],
    id: 'photo-1587049352851-8d4e89133924',
  },

  // ─── Animal products ──────────────────────────────────────────────────────
  { keys: ['egg'], id: 'photo-1639194335563-d56b83f0060c' },
  { keys: ['milk', 'cheese', 'butter', 'dairy'], id: 'photo-1634141510639-d691d86f47be' },
  { keys: ['beef', 'steak'], id: 'photo-1723893905879-0e309c2a8e06' },
  { keys: ['goat'], id: 'photo-1524024973431-2ad916746881' },
  { keys: ['chicken', 'poultry'], id: 'photo-1587593810167-a84920ea0781' },

  // ─── Equipment ────────────────────────────────────────────────────────────
  { keys: ['tractor', 'plow', 'plough', 'planter'], id: 'photo-1594771804886-a933bb2d609b' },
  { keys: ['sprayer', 'knapsack'], id: 'photo-1709532390940-5c09fcdf098d' },
  { keys: ['irrigation', 'pump', 'drip'], id: 'photo-1738598665698-7fd7af4b5e0c' },
  { keys: ['wheelbarrow'], id: 'photo-1715274036728-4385d95a5e9f' },
  { keys: ['hoe', 'tool', 'scale', 'greenhouse', 'tunnel'], id: 'photo-1780359398039-cfbe87cbea57' },

  // ─── Inputs ───────────────────────────────────────────────────────────────
  {
    keys: [
      'fertilizer',
      'compound',
      'urea',
      'ammonium',
      'nitrate',
      'lime',
      'glyphosate',
      'mancozeb',
      'lambda',
      'cyhalothrin',
    ],
    id: 'photo-1710223221719-6251cb1b5c5b',
  },

  // ─── Packaging ────────────────────────────────────────────────────────────
  { keys: ['crate', 'cold box', 'polystyrene'], id: 'photo-1780401573423-8ed2d8e469d8' },
  { keys: ['bag', 'sack', 'jute', 'storage'], id: 'photo-1465176728568-7da7e336b1e9' },
];

/** Used only when nothing above matches — a generic market scene. */
const FALLBACK_ID = 'photo-1542838132-92c53300491e';

const CATEGORY_ICONS: Record<string, IconName> = {
  'Seeds & Seedlings': 'leaf-outline',
  'Harvested Crops': 'basket-outline',
  'Animal Products': 'paw-outline',
  'Honey & Bee Products': 'flower-outline',
  'Farm Equipment': 'construct-outline',
  Agrochemicals: 'flask-outline',
  'Packaging & Storage': 'cube-outline',
  vegetable: 'nutrition-outline',
  grain: 'nutrition-outline',
  fruit: 'nutrition-outline',
  legume: 'flower-outline',
  'cash crop': 'trending-up-outline',
};

/** Resolves any crop or product name to a photograph of that thing. */
export function imageUrlFor(name: string): string {
  const lower = name.toLowerCase();
  for (const entry of IMAGERY) {
    if (entry.keys.some((key) => lower.includes(key))) return url(entry.id);
  }
  return url(FALLBACK_ID);
}

export function imageSourceFor(name: string): ImageSourcePropType {
  return { uri: imageUrlFor(name) };
}

export function categoryIconFor(category?: string): IconName {
  return CATEGORY_ICONS[category ?? ''] ?? 'storefront-outline';
}

/** True when a name matched a real photograph rather than the fallback. */
export function hasSpecificImage(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGERY.some((entry) => entry.keys.some((key) => lower.includes(key)));
}
