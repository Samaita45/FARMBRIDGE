export interface CropDisease {
  id: string;
  name: string;
  affectedCrops: string[];
  symptoms: string[];
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

export const CROP_DISEASES: CropDisease[] = [
  { id: 'tomato-late-blight', name: 'Late Blight', affectedCrops: ['tomatoes', 'potatoes'], symptoms: ['Water-soaked leaf spots', 'White mold in humid weather', 'Fruit rot'], treatment: 'Apply copper-based fungicide; remove infected plants.', prevention: 'Improve airflow; avoid overhead irrigation.', severity: 'high' },
  { id: 'maize-fall-armyworm', name: 'Fall Armyworm', affectedCrops: ['maize', 'sorghum'], symptoms: ['Window-pane leaf damage', 'Frass in whorl', 'Stunted plants'], treatment: 'Use recommended insecticides per Agritex guidelines.', prevention: 'Early scouting; plant early with rains.', severity: 'high' },
  { id: 'cabbage-diamondback', name: 'Diamondback Moth', affectedCrops: ['cabbage', 'spinach'], symptoms: ['Small holes in leaves', 'Larvae on undersides'], treatment: 'Bt-based biopesticides or spinosad.', prevention: 'Net houses; crop rotation.', severity: 'medium' },
  { id: 'tobacco-blue-mold', name: 'Blue Mold', affectedCrops: ['tobacco'], symptoms: ['Yellow spots on leaves', 'Blue-gray mold underside'], treatment: 'Systemic fungicides under extension advice.', prevention: 'Resistant varieties; field hygiene.', severity: 'high' },
  { id: 'citrus-greening', name: 'Citrus Greening', affectedCrops: ['citrus'], symptoms: ['Yellow mottled leaves', 'Small bitter fruit'], treatment: 'No cure; remove infected trees.', prevention: 'Use certified disease-free nursery stock.', severity: 'high' },
  { id: 'bean-rust', name: 'Bean Rust', affectedCrops: ['beans', 'cowpeas'], symptoms: ['Reddish-brown pustules on leaves'], treatment: 'Fungicide spray at first sign.', prevention: 'Resistant varieties; avoid dense planting.', severity: 'medium' },
  { id: 'onion-purple-blotch', name: 'Purple Blotch', affectedCrops: ['onions', 'garlic'], symptoms: ['Purple lesions on leaves', 'Yellowing'], treatment: 'Mancozeb or copper sprays.', prevention: 'Crop rotation; balanced fertility.', severity: 'medium' },
  { id: 'banana-bunchy-top', name: 'Banana Bunchy Top', affectedCrops: ['bananas'], symptoms: ['Upright narrow leaves', 'Dark green streaks'], treatment: 'Destroy infected mats; control aphids.', prevention: 'Use tissue culture plants.', severity: 'high' },
  { id: 'avocado-root-rot', name: 'Phytophthora Root Rot', affectedCrops: ['avocado'], symptoms: ['Wilting', 'Crown dieback', 'Root decay'], treatment: 'Improve drainage; phosphonate drenches.', prevention: 'Plant on mounds; avoid waterlogging.', severity: 'high' },
  { id: 'maize-streak-virus', name: 'Maize Streak Virus', affectedCrops: ['maize'], symptoms: ['Yellow streaks parallel to veins', 'Stunted growth'], treatment: 'No chemical cure; rogue infected plants.', prevention: 'Plant resistant hybrids; control leafhoppers.', severity: 'medium' },
];

export const FERTILIZER_RECOMMENDATIONS: Record<
  string,
  Record<string, { npk: string; products: string[]; ratePerHa: string; schedule: string; costUSD: number; costZWG: number }>
> = {
  maize: {
    Loam: { npk: '7-14-7', products: ['Compound D', 'AN', 'UREA'], ratePerHa: '400kg Compound D at planting + 200kg AN topdress', schedule: 'Basal at planting; AN at knee-high', costUSD: 180, costZWG: 18000 },
    Sandy: { npk: '7-14-7', products: ['Compound D', 'AN'], ratePerHa: '350kg Compound D + 150kg AN', schedule: 'Split AN applications', costUSD: 160, costZWG: 16000 },
  },
  tomatoes: {
    Loam: { npk: '5-10-10', products: ['Compound S', 'AN', 'Calcium nitrate'], ratePerHa: '300kg Compound S + weekly fertigation', schedule: 'Basal + weekly liquid feed', costUSD: 220, costZWG: 22000 },
    'Sandy-Loam': { npk: '5-10-10', products: ['Compound S', 'AN'], ratePerHa: '250kg Compound S + fertigation', schedule: 'Every 7-10 days after transplant', costUSD: 200, costZWG: 20000 },
  },
  tobacco: {
    'Sandy-Loam': { npk: 'Variable', products: ['Tobacco fertilizer blend', 'AN'], ratePerHa: 'Per contractor specification', schedule: 'Band placement per protocol', costUSD: 350, costZWG: 35000 },
    Loam: { npk: 'Variable', products: ['Tobacco blend', 'AN', 'Potassium sulfate'], ratePerHa: 'Contractor schedule', schedule: 'Split applications', costUSD: 380, costZWG: 38000 },
  },
  beans: {
    Loam: { npk: 'Low N', products: ['Compound L', 'Rhizobium inoculant'], ratePerHa: '150kg Compound L', schedule: 'At planting only', costUSD: 90, costZWG: 9000 },
    Sandy: { npk: 'Low N', products: ['Compound L'], ratePerHa: '120kg Compound L', schedule: 'At planting', costUSD: 75, costZWG: 7500 },
  },
};
