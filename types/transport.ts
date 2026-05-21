export type VehicleType = 'bakkie' | 'truck' | 'lorry' | 'tractor';
export type GoodsCategory = 'Fresh Produce' | 'Grain' | 'Equipment' | 'Livestock' | 'Other';
export type BookingStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
export type TransportStep = 'hub' | 'request' | 'providers' | 'negotiate' | 'confirm';

export interface TransportRequest {
  pickup: string;
  destination: string;
  goodsDescription: string;
  weightKg: number;
  category: GoodsCategory;
  preferredDate: string;
  preferredTime: string;
  loads: number;
  specialRequirements: string[];
}

export interface TransportBooking {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  vehicleType: VehicleType;
  pickup: string;
  destination: string;
  goodsDescription: string;
  weightKg: number;
  category: GoodsCategory;
  preferredDate: string;
  distanceKm: number;
  agreedPriceUSD: number;
  counterPriceUSD?: number;
  status: BookingStatus;
  paymentMethod: string;
  createdAt: string;
}

export interface TransporterProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  nationalId: string;
  vehicleType: VehicleType;
  regNumber: string;
  capacity: number;
  pricePerKm: number;
  coverageAreas: string[];
  verified: boolean;
  createdAt: string;
}

export const VEHICLE_ICONS: Record<VehicleType, string> = {
  bakkie: '🛻',
  truck: '🚛',
  lorry: '🏗️',
  tractor: '🚜',
};

export const GOODS_CATEGORIES: GoodsCategory[] = [
  'Fresh Produce',
  'Grain',
  'Equipment',
  'Livestock',
  'Other',
];

export const SPECIAL_REQUIREMENTS = [
  'Refrigerated',
  'Covered',
  'Open',
  'Livestock cage',
] as const;
