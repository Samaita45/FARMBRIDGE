export type VehicleType = 'bakkie' | 'truck' | 'lorry' | 'tractor';
export type GoodsCategory = 'Fresh Produce' | 'Grain' | 'Equipment' | 'Livestock' | 'Other';
export type BookingStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
export type TransportStep = 'hub' | 'request' | 'providers' | 'negotiate' | 'confirm';

/**
 * Server lifecycle. Local SQLite still stores `BookingStatus`. Map at the
 * API boundary so existing trips are not rewritten.
 */
export type TransportLifecycleStatus =
  | 'REQUESTED'
  | 'BIDDING'
  | 'ACCEPTED'
  | 'DRIVER_ASSIGNED'
  | 'GOODS_COLLECTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export const LIFECYCLE_TO_BOOKING: Record<TransportLifecycleStatus, BookingStatus> = {
  REQUESTED: 'pending',
  BIDDING: 'pending',
  ACCEPTED: 'confirmed',
  DRIVER_ASSIGNED: 'confirmed',
  GOODS_COLLECTED: 'in_transit',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export interface TransportRequest {
  pickup: string;
  destination: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  durationSeconds?: number;
  routePolyline?: string;
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
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  durationSeconds?: number;
  routePolyline?: string;
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

/**
 * Vehicle glyphs live in `components/transport/vehicle-icon`, not here — they
 * are icons, not data. Import `VehicleIcon` instead of mapping a name yourself.
 */

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
