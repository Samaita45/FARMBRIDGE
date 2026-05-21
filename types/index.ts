export type DemandLevel = 'very_high' | 'high' | 'medium' | 'low';

export type CropCategory =
  | 'vegetable'
  | 'grain'
  | 'fruit'
  | 'legume'
  | 'cash crop';

export type UserRole = 'farmer' | 'buyer' | 'both';

export interface Crop {
  id: string;
  name: string;
  localName: string;
  category: CropCategory;
  currentPriceUSD: number;
  currentPriceZWG: number;
  priceChangePercent: number;
  demandLevel: DemandLevel;
  bestPlantingMonths: number[];
  harvestDays: number;
  waterRequirements: 'low' | 'medium' | 'high';
  soilType: string[];
  monthlyDemandData: number[];
  region: string[];
  description: string;
  tips: string;
}

export interface Province {
  id: string;
  name: string;
  capital: string;
  latitude: number;
  longitude: number;
}

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  priceZWG: number;
  unit: string;
  sellerId: string;
  sellerName: string;
  location: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images: string[];
  description: string;
  isOrganic: boolean;
  isCertified: boolean;
}

export interface TransportProvider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'bakkie' | 'truck' | 'lorry' | 'tractor';
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  rating: number;
  totalTrips: number;
  location: string;
  isAvailable: boolean;
  coverageAreas: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceUSD: number;
  priceZWG: number;
  features: string[];
  ecocashCode?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  province: string;
  subscription: {
    planId: string;
    isActive: boolean;
    expiresAt?: string;
  };
  createdAt: string;
}
