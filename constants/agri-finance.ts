export interface AgriFinanceOption {
  id: string;
  name: string;
  interestRate: string;
  maxAmountUSD: number;
  requirements: string[];
  applyUrl: string;
}

export const AGRI_FINANCE_OPTIONS: AgriFinanceOption[] = [
  {
    id: 'agribank',
    name: 'Agribank Zimbabwe',
    interestRate: '12–18% p.a.',
    maxAmountUSD: 25000,
    requirements: ['National ID', 'Farm proof / lease', 'Business plan', 'Collateral for large loans'],
    applyUrl: 'https://www.agribank.co.zw',
  },
  {
    id: 'cbz',
    name: 'CBZ Agri Loan',
    interestRate: '14–20% p.a.',
    maxAmountUSD: 15000,
    requirements: ['CBZ account 6+ months', 'Crop production records', 'Guarantor'],
    applyUrl: 'https://www.cbz.co.zw',
  },
  {
    id: 'afc',
    name: 'AFC (Agriculture Finance Corporation)',
    interestRate: '10–15% p.a.',
    maxAmountUSD: 50000,
    requirements: ['Registered farmer', 'Land tenure documents', 'Seasonal cash flow projection'],
    applyUrl: 'https://www.afc.co.zw',
  },
  {
    id: 'micro',
    name: 'Microfinance (CABS / local MFIs)',
    interestRate: '18–28% p.a.',
    maxAmountUSD: 3000,
    requirements: ['Group membership optional', 'Smaller collateral', 'Shorter repayment (3–12 months)'],
    applyUrl: 'https://www.cabs.co.zw',
  },
];
