import { create } from 'zustand';

import type { TransportRequest } from '@/types/transport';

export interface TransportState {
  request: TransportRequest | null;
  distanceKm: number;
  selectedProviderId: string | null;
  askingPriceUSD: number;
  counterPriceUSD: number | null;
  /** What the farmer is willing to pay. Their number, not the estimator's. */
  offeredPriceUSD: number | null;
  /** Anything the transporter should know before they agree — access, timing, the load. */
  note: string;
  setRequest: (request: TransportRequest, distanceKm: number) => void;
  setOffer: (priceUSD: number | null, note?: string) => void;
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
  offeredPriceUSD: null,
  note: '',
  setRequest: (request, distanceKm) =>
    set({ request, distanceKm, selectedProviderId: null, counterPriceUSD: null }),
  setOffer: (offeredPriceUSD, note) =>
    set((s) => ({ offeredPriceUSD, note: note ?? s.note })),
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
      offeredPriceUSD: null,
      note: '',
    }),
}));

export { defaultRequest };
