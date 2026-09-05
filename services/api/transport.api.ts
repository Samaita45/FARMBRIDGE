import { IS_API_ENABLED } from '@/services/api/config';
import { api } from '@/services/api/client';
import type { TransportLifecycleStatus } from '@/types/transport';

export interface ServerTransportRequest {
  id: string;
  status: TransportLifecycleStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  distanceMeters: number;
  durationSeconds: number;
  routePolyline?: string | null;
  estimatedPriceUsdCents: number;
  goodsDescription: string;
  goodsType: string;
  weightKg: number;
}

export interface NearbyTransportRequest extends ServerTransportRequest {
  distanceFromYouKm?: number;
}

export interface TransportBidDto {
  id: string;
  requestId: string;
  amountUsdCents: number;
  note?: string | null;
  status: 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  etaMinutes?: number | null;
}

export interface TransportBookingDto {
  id: string;
  requestId: string;
  status: TransportLifecycleStatus;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceMeters: number;
  durationSeconds: number;
  agreedPriceUsdCents: number;
}

export interface CreateTransportRequestInput {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  goodsDescription: string;
  goodsType: string;
  weightKg: number;
  vehicleType?: 'BAKKIE' | 'TRUCK' | 'LORRY' | 'TRACTOR';
  urgency?: 'STANDARD' | 'SAME_DAY' | 'EXPRESS';
  extras?: string[];
  preferredAt?: string;
}

/**
 * Transport REST client.
 *
 * Used only when the API is on. Local SQLite bookings continue to work
 * without these calls.
 */
export interface PricingQuoteInput {
  distanceKm: number;
  weightKg: number;
  goodsType: string;
  vehicleType?: 'BAKKIE' | 'TRUCK' | 'LORRY' | 'TRACTOR';
  urgency?: 'STANDARD' | 'SAME_DAY' | 'EXPRESS';
  extras?: string[];
}

export interface PricingQuote {
  estimatedPriceUsdCents: number;
  breakdown: {
    vehicleType: string;
    baseUsdCents: number;
    distanceUsdCents: number;
    weightUsdCents: number;
    extrasUsdCents: number;
    goodsMultiplierBps: number;
    urgencyMultiplierBps: number;
    distanceKm: number;
  };
}

export const transportApi = {
  /**
   * What the backend thinks this load should cost.
   *
   * The rate table lives on the server, so it can be changed for a season or a
   * corridor without shipping an app update — which is the whole reason not to
   * price on the device. Returns null when the API is off, and the caller falls
   * back to the on-device estimator rather than showing nothing.
   */
  async quote(input: PricingQuoteInput): Promise<PricingQuote | null> {
    if (!IS_API_ENABLED) return null;
    try {
      // Wrapped as { quote }, like every other endpoint here. Reading the body
      // as the quote itself yields undefined cents and a NaN price on screen.
      const data = await api.post<{ quote: PricingQuote }>(
        '/transport/pricing/quote',
        input
      );
      return data.quote ?? null;
    } catch {
      return null;
    }
  },

  async createRequest(input: CreateTransportRequestInput): Promise<ServerTransportRequest | null> {
    if (!IS_API_ENABLED) return null;
    const data = await api.post<{ request: ServerTransportRequest }>('/transport/requests', input);
    return data.request ?? null;
  },

  async listMine(): Promise<ServerTransportRequest[]> {
    if (!IS_API_ENABLED) return [];
    const data = await api.get<{ requests: ServerTransportRequest[] }>('/transport/requests');
    return data.requests ?? [];
  },

  async nearby(lat: number, lng: number, radiusKm = 50): Promise<NearbyTransportRequest[]> {
    if (!IS_API_ENABLED) return [];
    const data = await api.get<{ requests: NearbyTransportRequest[] }>(
      `/transport/requests/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
    );
    return data.requests ?? [];
  },

  async bid(
    requestId: string,
    amountUsdCents: number,
    note?: string,
    etaMinutes?: number
  ): Promise<TransportBidDto | null> {
    if (!IS_API_ENABLED) return null;
    const data = await api.post<{ bid: TransportBidDto }>(`/transport/requests/${requestId}/bids`, {
      amountUsdCents,
      note,
      etaMinutes,
    });
    return data.bid ?? null;
  },

  async acceptBid(bidId: string): Promise<TransportBookingDto | null> {
    if (!IS_API_ENABLED) return null;
    const data = await api.post<{ booking: TransportBookingDto }>(`/transport/bids/${bidId}/accept`);
    return data.booking ?? null;
  },

  async updateStatus(
    bookingId: string,
    status: TransportLifecycleStatus
  ): Promise<TransportBookingDto | null> {
    if (!IS_API_ENABLED) return null;
    const data = await api.patch<{ booking: TransportBookingDto }>(
      `/transport/bookings/${bookingId}/status`,
      { status }
    );
    return data.booking ?? null;
  },

  async updateDriverLocation(
    bookingId: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    if (!IS_API_ENABLED) return false;
    await api.post(`/transport/bookings/${bookingId}/location`, { latitude, longitude });
    return true;
  },

  async activeBookings(): Promise<TransportBookingDto[]> {
    if (!IS_API_ENABLED) return [];
    const data = await api.get<{ bookings: TransportBookingDto[] }>('/transport/bookings/active');
    return data.bookings ?? [];
  },
};
