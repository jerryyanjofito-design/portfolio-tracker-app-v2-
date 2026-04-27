import { Holding, CashAccount, PortfolioData, Currency } from './types';

// FX Rate: SGD to IDR (simplified constant for MVP)
const SGD_TO_IDR_RATE = 13471;

// Mock holdings data
export const mockHoldings: Holding[] = [
  {
    id: '1',
    ticker: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    shares: 0.5,
    purchasePrice: 65000000,
    currentPrice: 72000000,
    currency: 'IDR'
  },
  {
    id: '2',
    ticker: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    shares: 5,
    purchasePrice: 3200000,
    currentPrice: 3500000,
    currency: 'IDR'
  },
  {
    id: '3',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    shares: 10,
    purchasePrice: 185,
    currentPrice: 195,
    currency: 'USD'
  },
  {
    id: '4',
    ticker: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    type: 'etf',
    shares: 5,
    purchasePrice: 520,
    currentPrice: 560,
    currency: 'USD'
  }
];

// Mock cash accounts
export const mockCashAccounts: CashAccount[] = [
  {
    id: '1',
    name: 'Indodax',
    currency: 'IDR',
    amount: 25000000
  },
  {
    id: '2',
    name: 'DBS',
    currency: 'IDR',
    amount: 50000000
  },
  {
    id: '3',
    name: 'DBS',
    currency: 'SGD',
    amount: 2000
  },
  {
    id: '4',
    name: 'Studioverse',
    currency: 'IDR',
    amount: 10000000
  }
];

// USD to IDR conversion (simplified)
const USD_TO_IDR_RATE = 17137;

// Function to convert to IDR
export function convertToIDR(amount: number, currency: Currency): number {
  switch (currency) {
    case 'IDR':
      return amount;
    case 'SGD':
      return amount * SGD_TO_IDR_RATE;
    case 'USD':
      return amount * USD_TO_IDR_RATE;
    default:
      return amount;
  }
}

// Get portfolio data
export function getPortfolioData(): PortfolioData {
  return {
    holdings: mockHoldings,
    cashAccounts: mockCashAccounts
  };
}
