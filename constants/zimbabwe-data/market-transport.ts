import type { MarketProduct, PaymentMethod, SubscriptionPlan, TransportProvider } from '@/types';

import { EXTRA_MARKET_PRODUCTS } from './products-extra';
import { USD_TO_ZWG_RATE } from './provinces-seasons';

function product(
  partial: Omit<MarketProduct, 'priceZWG'> & { priceZWG?: number }
): MarketProduct {
  return {
    ...partial,
    priceZWG: partial.priceZWG ?? Math.round(partial.priceUSD * USD_TO_ZWG_RATE),
  };
}

export const MARKET_PRODUCTS: MarketProduct[] = [
  product({ id: 'seed-maize-sc', name: 'Maize Seed SC403 (25kg)', category: 'Seeds & Seedlings', priceUSD: 85, unit: 'bag', sellerId: 's1', sellerName: 'AgriSupplies Harare', location: 'Harare', rating: 4.8, reviewCount: 124, inStock: true, images: [], description: 'High-yield hybrid maize seed for rainy season.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-tomato', name: 'Tomato Seed Roma VF', category: 'Seeds & Seedlings', priceUSD: 8, unit: 'pack', sellerId: 's2', sellerName: 'GreenGrow Seeds', location: 'Marondera', rating: 4.6, reviewCount: 89, inStock: true, images: [], description: 'Determinate processing tomato variety.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-onion', name: 'Onion Seed Hybrid Red', category: 'Seeds & Seedlings', priceUSD: 12, unit: 'pack', sellerId: 's2', sellerName: 'GreenGrow Seeds', location: 'Marondera', rating: 4.5, reviewCount: 56, inStock: true, images: [], description: 'Red bulb onion for fresh markets.', isOrganic: false, isCertified: false }),
  product({ id: 'seed-cabbage', name: 'Cabbage Seed Gloria F1', category: 'Seeds & Seedlings', priceUSD: 15, unit: 'pack', sellerId: 's3', sellerName: 'FarmLink Bulawayo', location: 'Bulawayo', rating: 4.7, reviewCount: 42, inStock: true, images: [], description: 'F1 cabbage with uniform heads.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-soya', name: 'Soyabean Seed (20kg)', category: 'Seeds & Seedlings', priceUSD: 45, unit: 'bag', sellerId: 's1', sellerName: 'AgriSupplies Harare', location: 'Harare', rating: 4.4, reviewCount: 67, inStock: true, images: [], description: 'Certified soyabean seed.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-groundnut', name: 'Groundnut Seed Virginia (25kg)', category: 'Seeds & Seedlings', priceUSD: 55, unit: 'bag', sellerId: 's4', sellerName: 'Mashonaland Agro', location: 'Bindura', rating: 4.3, reviewCount: 38, inStock: true, images: [], description: 'Virginia type groundnut seed.', isOrganic: false, isCertified: false }),
  product({ id: 'seed-sunflower', name: 'Sunflower Seed PAN 7034', category: 'Seeds & Seedlings', priceUSD: 38, unit: 'bag', sellerId: 's1', sellerName: 'AgriSupplies Harare', location: 'Harare', rating: 4.5, reviewCount: 29, inStock: true, images: [], description: 'Oil-type sunflower hybrid.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-beans', name: 'Sugar Bean Seed (10kg)', category: 'Seeds & Seedlings', priceUSD: 32, unit: 'bag', sellerId: 's5', sellerName: 'Midlands Farm Store', location: 'Gweru', rating: 4.6, reviewCount: 51, inStock: true, images: [], description: 'Popular sugar bean variety.', isOrganic: false, isCertified: false }),
  product({ id: 'seed-tobacco', name: 'Tobacco Seedling Tray (200)', category: 'Seeds & Seedlings', priceUSD: 25, unit: 'tray', sellerId: 's6', sellerName: 'Tobacco Nurseries ZW', location: 'Karoi', rating: 4.2, reviewCount: 18, inStock: true, images: [], description: 'Contract tobacco seedlings.', isOrganic: false, isCertified: true }),
  product({ id: 'seed-cowpea', name: 'Cowpea Seed (15kg)', category: 'Seeds & Seedlings', priceUSD: 28, unit: 'bag', sellerId: 's4', sellerName: 'Mashonaland Agro', location: 'Bindura', rating: 4.1, reviewCount: 22, inStock: true, images: [], description: 'Drought-tolerant cowpea seed.', isOrganic: false, isCertified: false }),
  product({ id: 'equip-hoe', name: 'Heavy Duty Hoe', category: 'Farm Equipment', priceUSD: 12, unit: 'each', sellerId: 'e1', sellerName: 'ToolMaster ZW', location: 'Harare', rating: 4.5, reviewCount: 210, inStock: true, images: [], description: 'Forged steel hoe with hardwood handle.', isOrganic: false, isCertified: false }),
  product({ id: 'equip-sprayer', name: 'Knapsack Sprayer 16L', category: 'Farm Equipment', priceUSD: 35, unit: 'each', sellerId: 'e1', sellerName: 'ToolMaster ZW', location: 'Harare', rating: 4.4, reviewCount: 156, inStock: true, images: [], description: 'Manual sprayer for pesticides and foliar feed.', isOrganic: false, isCertified: false }),
  product({ id: 'equip-drip', name: 'Drip Irrigation Kit (1 acre)', category: 'Farm Equipment', priceUSD: 280, unit: 'kit', sellerId: 'e2', sellerName: 'IrriTech Zimbabwe', location: 'Mutare', rating: 4.7, reviewCount: 45, inStock: true, images: [], description: 'Complete drip kit with mainline and emitters.', isOrganic: false, isCertified: true }),
  product({ id: 'equip-pump', name: 'Solar Water Pump 1HP', category: 'Farm Equipment', priceUSD: 450, unit: 'each', sellerId: 'e2', sellerName: 'IrriTech Zimbabwe', location: 'Mutare', rating: 4.8, reviewCount: 32, inStock: true, images: [], description: 'Solar-powered borehole pump system.', isOrganic: false, isCertified: true }),
  product({ id: 'equip-tractor-hire', name: 'Tractor Hire (per hectare)', category: 'Farm Equipment', priceUSD: 45, unit: 'ha', sellerId: 'e3', sellerName: 'Mashonaland Mechanisation', location: 'Chinhoyi', rating: 4.3, reviewCount: 78, inStock: true, images: [], description: 'Ploughing and discing service.', isOrganic: false, isCertified: false }),
  product({ id: 'chem-compound-d', name: 'Compound D Fertilizer (50kg)', category: 'Agrochemicals', priceUSD: 32, unit: 'bag', sellerId: 'c1', sellerName: 'ChemCrop Ltd', location: 'Harare', rating: 4.6, reviewCount: 312, inStock: true, images: [], description: 'Basal fertilizer 7-14-7 for maize and tobacco.', isOrganic: false, isCertified: true }),
  product({ id: 'chem-an', name: 'Ammonium Nitrate AN (50kg)', category: 'Agrochemicals', priceUSD: 28, unit: 'bag', sellerId: 'c1', sellerName: 'ChemCrop Ltd', location: 'Harare', rating: 4.5, reviewCount: 289, inStock: true, images: [], description: 'Topdress nitrogen fertilizer.', isOrganic: false, isCertified: true }),
  product({ id: 'chem-urea', name: 'UREA (50kg)', category: 'Agrochemicals', priceUSD: 26, unit: 'bag', sellerId: 'c1', sellerName: 'ChemCrop Ltd', location: 'Harare', rating: 4.4, reviewCount: 201, inStock: true, images: [], description: 'High nitrogen fertilizer for topdressing.', isOrganic: false, isCertified: true }),
  product({ id: 'chem-compound-s', name: 'Compound S (50kg)', category: 'Agrochemicals', priceUSD: 30, unit: 'bag', sellerId: 'c2', sellerName: 'AgroChem Bulawayo', location: 'Bulawayo', rating: 4.5, reviewCount: 98, inStock: true, images: [], description: 'For horticultural and vegetable crops.', isOrganic: false, isCertified: true }),
  product({ id: 'chem-pesticide', name: 'Lambda Cyhalothrin 50ml', category: 'Agrochemicals', priceUSD: 8, unit: 'bottle', sellerId: 'c2', sellerName: 'AgroChem Bulawayo', location: 'Bulawayo', rating: 4.2, reviewCount: 145, inStock: true, images: [], description: 'Broad-spectrum insecticide.', isOrganic: false, isCertified: false }),
  product({ id: 'honey-raw-500', name: 'Raw Wildflower Honey 500g', category: 'Honey & Bee Products', priceUSD: 6, unit: 'jar', sellerId: 'h1', sellerName: 'Mazowe Valley Honey', location: 'Mazowe', rating: 4.9, reviewCount: 87, inStock: true, images: [], description: 'Pure raw honey from Mazowe Valley apiaries.', isOrganic: true, isCertified: false }),
  product({ id: 'honey-raw-1kg', name: 'Raw Wildflower Honey 1kg', category: 'Honey & Bee Products', priceUSD: 11, unit: 'jar', sellerId: 'h1', sellerName: 'Mazowe Valley Honey', location: 'Mazowe', rating: 4.9, reviewCount: 64, inStock: true, images: [], description: 'Unfiltered wildflower honey.', isOrganic: true, isCertified: false }),
  product({ id: 'honey-comb', name: 'Comb Honey 400g', category: 'Honey & Bee Products', priceUSD: 9, unit: 'pack', sellerId: 'h2', sellerName: 'BeeNatural ZW', location: 'Mutare', rating: 4.8, reviewCount: 41, inStock: true, images: [], description: 'Fresh cut comb honey.', isOrganic: true, isCertified: false }),
  product({ id: 'honey-beeswax', name: 'Beeswax Blocks (1kg)', category: 'Honey & Bee Products', priceUSD: 14, unit: 'kg', sellerId: 'h2', sellerName: 'BeeNatural ZW', location: 'Mutare', rating: 4.6, reviewCount: 28, inStock: true, images: [], description: 'Filtered beeswax for candles and cosmetics.', isOrganic: true, isCertified: false }),
  product({ id: 'honey-propolis', name: 'Propolis Tincture 30ml', category: 'Honey & Bee Products', priceUSD: 12, unit: 'bottle', sellerId: 'h1', sellerName: 'Mazowe Valley Honey', location: 'Mazowe', rating: 4.5, reviewCount: 19, inStock: true, images: [], description: 'Natural propolis extract.', isOrganic: true, isCertified: false }),
  product({ id: 'animal-eggs', name: 'Free Range Eggs (30 tray)', category: 'Animal Products', priceUSD: 5, unit: 'tray', sellerId: 'a1', sellerName: 'Sunrise Poultry Farm', location: 'Harare', rating: 4.7, reviewCount: 203, inStock: true, images: [], description: 'Fresh free-range eggs daily delivery.', isOrganic: false, isCertified: false }),
  product({ id: 'animal-milk', name: 'Fresh Milk (2L)', category: 'Animal Products', priceUSD: 2.5, unit: 'bottle', sellerId: 'a2', sellerName: 'DairyDale Midlands', location: 'Gweru', rating: 4.4, reviewCount: 76, inStock: true, images: [], description: 'Pasteurized fresh milk.', isOrganic: false, isCertified: true }),
  product({ id: 'animal-beef', name: 'Beef Quarter Pack (5kg)', category: 'Animal Products', priceUSD: 28, unit: 'pack', sellerId: 'a3', sellerName: 'Matabeleland Meats', location: 'Bulawayo', rating: 4.5, reviewCount: 34, inStock: true, images: [], description: 'Assorted beef cuts from local ranch.', isOrganic: false, isCertified: true }),
  product({ id: 'animal-goat', name: 'Live Goat (medium)', category: 'Animal Products', priceUSD: 65, unit: 'each', sellerId: 'a4', sellerName: 'Gwanda Livestock', location: 'Gwanda', rating: 4.3, reviewCount: 22, inStock: true, images: [], description: 'Medium-sized goat for slaughter or breeding.', isOrganic: false, isCertified: false }),
  product({ id: 'produce-tomatoes', name: 'Fresh Tomatoes (10kg crate)', category: 'Harvested Crops', priceUSD: 8, unit: 'crate', sellerId: 'f1', sellerName: 'Mbare Fresh Farms', location: 'Harare', rating: 4.2, reviewCount: 156, inStock: true, images: [], description: 'Grade A tomatoes from Mbare Musika suppliers.', isOrganic: false, isCertified: false }),
  product({ id: 'produce-onions', name: 'Onions (15kg pocket)', category: 'Harvested Crops', priceUSD: 9, unit: 'pocket', sellerId: 'f2', sellerName: 'Chipinge Growers', location: 'Manicaland', rating: 4.4, reviewCount: 89, inStock: true, images: [], description: 'Dry onions ready for market.', isOrganic: false, isCertified: false }),
  product({ id: 'produce-maize', name: 'Dry Maize Grain (50kg)', category: 'Harvested Crops', priceUSD: 14, unit: 'bag', sellerId: 'f3', sellerName: 'GrainCo Mash West', location: 'Chinhoyi', rating: 4.1, reviewCount: 67, inStock: true, images: [], description: 'Sun-dried maize grain.', isOrganic: false, isCertified: false }),
  product({ id: 'pack-grain-bag', name: 'Grain Storage Bag (50kg)', category: 'Packaging & Storage', priceUSD: 1.5, unit: 'each', sellerId: 'p1', sellerName: 'PackRight ZW', location: 'Harare', rating: 4.0, reviewCount: 45, inStock: true, images: [], description: 'Heavy-duty poly grain storage bag.', isOrganic: false, isCertified: false }),
  product({ id: 'pack-crate', name: 'Plastic Produce Crate', category: 'Packaging & Storage', priceUSD: 8, unit: 'each', sellerId: 'p1', sellerName: 'PackRight ZW', location: 'Harare', rating: 4.3, reviewCount: 38, inStock: true, images: [], description: 'Reusable ventilated crate.', isOrganic: false, isCertified: false }),
  ...EXTRA_MARKET_PRODUCTS,
];

export function searchProducts(query: string): MarketProduct[] {
  const q = query.toLowerCase().trim();
  if (!q) return MARKET_PRODUCTS;
  return MARKET_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
  );
}

export function getFeaturedProducts(count = 5): MarketProduct[] {
  return [...MARKET_PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, count);
}

export function getFlashDealProducts(count = 4): MarketProduct[] {
  return [...MARKET_PRODUCTS]
    .filter((p) => p.inStock)
    .sort((a, b) => a.priceUSD - b.priceUSD)
    .slice(0, count)
    .map((p) => {
      const priceUSD = Math.round(p.priceUSD * 0.85 * 100) / 100;
      return { ...p, priceUSD, priceZWG: Math.round(priceUSD * USD_TO_ZWG_RATE) };
    });
}

export function getProductById(id: string): MarketProduct | undefined {
  return MARKET_PRODUCTS.find((p) => p.id === id);
}

export const TRANSPORT_PROVIDERS: TransportProvider[] = [
  { id: 't1', name: 'Tendai Moyo', phone: '+263771234567', vehicleType: 'bakkie', capacity: 1.5, pricePerKm: 0.45, basePrice: 5, rating: 4.7, totalTrips: 234, location: 'Harare', isAvailable: true, coverageAreas: ['Harare', 'Chitungwiza', 'Norton', 'Epworth'] },
  { id: 't2', name: 'Blessing Ncube', phone: '+263772345678', vehicleType: 'truck', capacity: 5, pricePerKm: 0.85, basePrice: 15, rating: 4.5, totalTrips: 189, location: 'Bulawayo', isAvailable: true, coverageAreas: ['Bulawayo', 'Gwanda', 'Plumtree'] },
  { id: 't3', name: 'Farai Chikomo', phone: '+263773456789', vehicleType: 'lorry', capacity: 15, pricePerKm: 1.2, basePrice: 30, rating: 4.6, totalTrips: 312, location: 'Mutare', isAvailable: true, coverageAreas: ['Manicaland', 'Harare', 'Rusape'] },
  { id: 't4', name: 'John Muzenda', phone: '+263774567890', vehicleType: 'tractor', capacity: 3, pricePerKm: 0.65, basePrice: 10, rating: 4.3, totalTrips: 98, location: 'Gweru', isAvailable: false, coverageAreas: ['Midlands', 'Masvingo'] },
  { id: 't5', name: 'Peter Dube', phone: '+263775678901', vehicleType: 'bakkie', capacity: 1.2, pricePerKm: 0.4, basePrice: 4, rating: 4.8, totalTrips: 421, location: 'Harare', isAvailable: true, coverageAreas: ['Harare', 'Marondera', 'Ruwa'] },
  { id: 't6', name: 'Grace Mhlanga', phone: '+263776789012', vehicleType: 'truck', capacity: 8, pricePerKm: 0.95, basePrice: 20, rating: 4.4, totalTrips: 156, location: 'Masvingo', isAvailable: true, coverageAreas: ['Masvingo', 'Chiredzi', 'Triangle'] },
  { id: 't7', name: 'Simbarashe Nyathi', phone: '+263777890123', vehicleType: 'lorry', capacity: 20, pricePerKm: 1.5, basePrice: 40, rating: 4.2, totalTrips: 267, location: 'Chinhoyi', isAvailable: true, coverageAreas: ['Mashonaland West', 'Harare', 'Kadoma'] },
  { id: 't8', name: 'Memory Sibanda', phone: '+263778901234', vehicleType: 'bakkie', capacity: 1.8, pricePerKm: 0.5, basePrice: 6, rating: 4.6, totalTrips: 178, location: 'Bulawayo', isAvailable: true, coverageAreas: ['Bulawayo', 'Victoria Falls', 'Hwange'] },
  { id: 't9', name: 'Tinashe Mapfumo', phone: '+263779012345', vehicleType: 'truck', capacity: 6, pricePerKm: 0.9, basePrice: 18, rating: 4.5, totalTrips: 203, location: 'Bindura', isAvailable: true, coverageAreas: ['Mashonaland Central', 'Harare', 'Mount Darwin'] },
  { id: 't10', name: 'Rudo Chiwara', phone: '+263780123456', vehicleType: 'bakkie', capacity: 1.5, pricePerKm: 0.42, basePrice: 5, rating: 4.9, totalTrips: 534, location: 'Harare', isAvailable: true, coverageAreas: ['Harare', 'Chitungwiza', 'Norton'] },
  { id: 't11', name: 'Kudzai Mupfumi', phone: '+263781234567', vehicleType: 'lorry', capacity: 12, pricePerKm: 1.1, basePrice: 28, rating: 4.3, totalTrips: 145, location: 'Kwekwe', isAvailable: false, coverageAreas: ['Midlands', 'Gweru', 'Kwekwe'] },
  { id: 't12', name: 'Amos Ndlovu', phone: '+263782345678', vehicleType: 'truck', capacity: 10, pricePerKm: 1.0, basePrice: 22, rating: 4.4, totalTrips: 198, location: 'Lupane', isAvailable: true, coverageAreas: ['Matabeleland North', 'Bulawayo'] },
  { id: 't13', name: 'Chipo Makoni', phone: '+263783456789', vehicleType: 'bakkie', capacity: 1.0, pricePerKm: 0.38, basePrice: 4, rating: 4.7, totalTrips: 312, location: 'Mutare', isAvailable: true, coverageAreas: ['Manicaland', 'Chipinge', 'Nyanga'] },
  { id: 't14', name: 'David Chigwada', phone: '+263784567890', vehicleType: 'tractor', capacity: 2.5, pricePerKm: 0.55, basePrice: 8, rating: 4.1, totalTrips: 76, location: 'Marondera', isAvailable: true, coverageAreas: ['Mashonaland East', 'Harare'] },
  { id: 't15', name: 'Patience Gumbo', phone: '+263785678901', vehicleType: 'truck', capacity: 7, pricePerKm: 0.88, basePrice: 16, rating: 4.6, totalTrips: 221, location: 'Gwanda', isAvailable: true, coverageAreas: ['Matabeleland South', 'Bulawayo', 'Beitbridge'] },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'ecocash', name: 'EcoCash', icon: 'ecocash', color: '#e30613', available: true },
  { id: 'onemoney', name: 'OneMoney', icon: 'onemoney', color: '#ff6600', available: true },
  { id: 'innbucks', name: 'InnBucks', icon: 'innbucks', color: '#00529b', available: true },
  { id: 'zipit', name: 'ZipIt', icon: 'zipit', color: '#1a237e', available: true },
  { id: 'cash_usd', name: 'USD Cash', icon: 'dollar', color: '#2e7d32', available: true },
  { id: 'zwg', name: 'ZiG (ZWG)', icon: 'zwg', color: '#d4af37', available: true },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceUSD: 0,
    priceZWG: 0,
    features: [
      'Crop trends & market data',
      'Weather forecast',
      'Community forum access',
      'Seasonal planting calendar',
    ],
  },
  {
    id: 'farmer',
    name: 'Farmer Pro',
    priceUSD: 3,
    priceZWG: 300,
    ecocashCode: '*151*2*52525*3#',
    features: [
      'Everything in Basic',
      'Full marketplace access',
      'Transport booking',
      'SMS reminders (50/month)',
      'Advanced crop planning',
      'Financial tools',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    priceUSD: 8,
    priceZWG: 800,
    ecocashCode: '*151*2*52525*8#',
    features: [
      'Everything in Farmer Pro',
      'Seller account — list products',
      'Priority support',
      'Bulk pricing tools',
      'Analytics dashboard',
      'Unlimited SMS reminders',
    ],
  },
];

export const getProductsByCategory = (category: string) =>
  MARKET_PRODUCTS.filter((p) => p.category === category);

export const MARKET_CATEGORIES = [
  'Seeds & Seedlings',
  'Harvested Crops',
  'Animal Products',
  'Honey & Bee Products',
  'Farm Equipment',
  'Agrochemicals',
  'Packaging & Storage',
] as const;
