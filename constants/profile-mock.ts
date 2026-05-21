import type { EarningsTransaction } from '@/types/profile';

export const MOCK_EARNINGS: EarningsTransaction[] = [
  {
    id: 'e1',
    description: 'Tomatoes — 120kg to Harare buyer',
    amountUSD: 96,
    amountZWG: 26880,
    date: '2026-05-15T10:00:00Z',
    type: 'sale',
  },
  {
    id: 'e2',
    description: 'Onions — 80kg Mbare market',
    amountUSD: 44,
    amountZWG: 12320,
    date: '2026-05-12T14:00:00Z',
    type: 'sale',
  },
  {
    id: 'e3',
    description: 'EcoCash withdrawal',
    amountUSD: -50,
    amountZWG: -14000,
    date: '2026-05-10T09:00:00Z',
    type: 'withdrawal',
  },
  {
    id: 'e4',
    description: 'Maize — 2 tonnes contract',
    amountUSD: 440,
    amountZWG: 123200,
    date: '2026-05-05T11:00:00Z',
    type: 'sale',
  },
];
