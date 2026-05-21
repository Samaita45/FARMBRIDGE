import { create } from 'zustand';

import type { TransportRequest } from '@/types/transport';

export interface TransportState {
  request: TransportRequest | null;
  distanceKm: number;
  selectedProviderId: string | null;
  askingPriceUSD: number;
  counterPriceUSD: number | null;
  setRequest: (request: TransportRequest, distanceKm: number) => void;
  selectProvider: (providerId: string, askingPriceUSD: number) => void;
  setCounterPrice: (price: number) => void;
  clear: () => void;
}

const defaultRequest: TransportRequest = {
  pickup: '',
  destination: '',
  goodsDescription: '',
  weightKg: 500,
  category: 'Fresh Produce',
  preferredDate: new Date().toISOString().slice(0, 10),
  preferredTime: '08:00',
  loads: 1,
  specialRequirements: [],
};

export const useTransportStore = create<TransportState>((set) => ({
  request: null,
  distanceKm: 0,
  selectedProviderId: null,
  askingPriceUSD: 0,
  counterPriceUSD: null,
  setRequest: (request, distanceKm) =>
    set({ request, distanceKm, selectedProviderId: null, counterPriceUSD: null }),
  selectProvider: (providerId, askingPriceUSD) =>
    set({ selectedProviderId: providerId, askingPriceUSD, counterPriceUSD: null }),
  setCounterPrice: (counterPriceUSD) => set({ counterPriceUSD }),
  clear: () =>
    set({
      request: null,
      distanceKm: 0,
      selectedProviderId: null,
      askingPriceUSD: 0,
      counterPriceUSD: null,
    }),
}));

export { defaultRequest };
