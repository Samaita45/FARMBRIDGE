import type { Province } from '@/types';

export const PROVINCES: Province[] = [
  { id: 'harare', name: 'Harare', capital: 'Harare', latitude: -17.8292, longitude: 31.0539 },
  { id: 'bulawayo', name: 'Bulawayo', capital: 'Bulawayo', latitude: -20.1325, longitude: 28.6265 },
  { id: 'manicaland', name: 'Manicaland', capital: 'Mutare', latitude: -18.9707, longitude: 32.6709 },
  { id: 'mashonaland-central', name: 'Mashonaland Central', capital: 'Bindura', latitude: -17.3019, longitude: 31.3306 },
  { id: 'mashonaland-east', name: 'Mashonaland East', capital: 'Marondera', latitude: -18.9667, longitude: 31.55 },
  { id: 'mashonaland-west', name: 'Mashonaland West', capital: 'Chinhoyi', latitude: -17.35, longitude: 30.2 },
  { id: 'masvingo', name: 'Masvingo', capital: 'Masvingo', latitude: -20.0744, longitude: 30.8328 },
  { id: 'matabeleland-north', name: 'Matabeleland North', capital: 'Lupane', latitude: -18.9317, longitude: 27.807 },
  { id: 'matabeleland-south', name: 'Matabeleland South', capital: 'Gwanda', latitude: -20.9333, longitude: 29 },
  { id: 'midlands', name: 'Midlands', capital: 'Gweru', latitude: -19.45, longitude: 29.8167 },
];

export const SEASONS = {
  rainy: {
    id: 'rainy',
    name: 'Rainy Season',
    months: [11, 12, 1, 2, 3],
    description: 'Main planting season with high rainfall. Ideal for maize, soyabeans, and groundnuts.',
    icon: '🌧️',
  },
  coolDry: {
    id: 'cool-dry',
    name: 'Cool Dry Season',
    months: [4, 5, 6, 7],
    description: 'Cooler temperatures, lower rainfall. Good for wheat, potatoes, and irrigated horticulture.',
    icon: '🌬️',
  },
  hotDry: {
    id: 'hot-dry',
    name: 'Hot Dry Season',
    months: [8, 9, 10],
    description: 'Hot and dry. Focus on irrigation, tobacco planting, and drought-tolerant crops.',
    icon: '☀️',
  },
} as const;

export const getCurrentSeason = (month: number) => {
  if ((SEASONS.rainy.months as readonly number[]).includes(month)) return SEASONS.rainy;
  if ((SEASONS.coolDry.months as readonly number[]).includes(month)) return SEASONS.coolDry;
  return SEASONS.hotDry;
};

export const USD_TO_ZWG_RATE = 100;
