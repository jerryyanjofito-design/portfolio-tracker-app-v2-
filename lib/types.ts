export type AssetType = 'stock' | 'crypto' | 'etf' | 'bond' | 'gold';
export type Currency = 'IDR' | 'SGD' | 'USD';

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  currency: Currency;
}

export interface CashAccount {
  id: string;
  accountName?: string; // Alternative column name from existing database
  name?: string; // Standard column name
  currency: Currency;
  balance?: number; // Alternative column name from existing database
  amount?: number; // Standard column name
  created_at?: string;
  updated_at?: string;
}

export interface Snapshot {
  id: string;
  total_value_idr: number;
  snapshot_date?: string;
  created_at: string;
}

export interface PortfolioData {
  holdings: Holding[];
  cashAccounts: CashAccount[];
}

export interface PortfolioSummary {
  totalHoldingsValue: number;
  totalCashValue: number;
  netWorth: number;
  totalCostBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface AssetAllocation {
  type: string;
  value: number;
  idr: number;
  percentage: number;
}

export interface Transaction {
  id: string;
  holding_id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  created_at: string;
}

export interface TransactionInput {
  holdingId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
}

export interface AssetAccount {
  id: string;
  name: string;
  type: 'business' | 'asset';
  value: number;
  created_at?: string;
}
