import {
  Holding,
  CashAccount,
  PortfolioSummary,
  AssetAccount
} from './types';

import { convertToIDR } from './fxRates';

/* =========================
   HELPERS
========================= */

// Normalize cash amount (supports balance or amount)
function getCashAccountAmount(account: CashAccount): number {
  const raw = account.balance ?? account.amount ?? 0;
  console.log(`=== CURRENCY CONVERSION ===`);
  console.log(`Input: ${account.currency} ${raw}`);
  console.log(`Conversion: convertToIDR(${raw}, '${account.currency}')`);
  const result = convertToIDR(raw, account.currency);
  console.log(`Result: IDR ${result}`);
  console.log(`======================`);
  return result;
}

// Calculate holding value in IDR
function getHoldingValueIDR(holding: Holding): number {
  const value = holding.shares * holding.currentPrice;
  console.log(`=== CURRENCY CONVERSION ===`);
  console.log(`Holding: ${holding.ticker}`);
  console.log(`Input: ${holding.currency} ${holding.currentPrice} × ${holding.shares} shares = ${value}`);
  console.log(`Conversion: convertToIDR(${value}, '${holding.currency}')`);
  const result = convertToIDR(value, holding.currency);
  console.log(`Result: IDR ${result}`);
  console.log(`======================`);
  return result;
}

// Calculate holding cost in IDR
function getHoldingCostIDR(holding: Holding): number {
  const cost = holding.shares * holding.purchasePrice;
  console.log(`=== CURRENCY CONVERSION ===`);
  console.log(`Holding: ${holding.ticker}`);
  console.log(`Input: ${holding.currency} ${holding.purchasePrice} × ${holding.shares} shares = ${cost}`);
  console.log(`Conversion: convertToIDR(${cost}, '${holding.currency}')`);
  const result = convertToIDR(cost, holding.currency);
  console.log(`Result: IDR ${result}`);
  console.log(`======================`);
  return result;
}

/* =========================
   CORE CALCULATIONS
========================= */

export function calculatePortfolioSummary(
  holdings: Holding[],
  cashAccounts: CashAccount[],
  assetAccounts: AssetAccount[] = []
): PortfolioSummary {

  const totalHoldingsValue = holdings.reduce(
    (sum, h) => sum + getHoldingValueIDR(h),
    0
  );

  const totalCostBasis = holdings.reduce(
    (sum, h) => sum + getHoldingCostIDR(h),
    0
  );

  const totalCashValue = cashAccounts.reduce(
    (sum, c) => sum + getCashAccountAmount(c),
    0
  );

  const totalAssetValue = assetAccounts.reduce(
    (sum, a) => sum + a.value,
    0
  );

  const netWorth = totalHoldingsValue + totalCashValue + totalAssetValue;

  const unrealizedPL = totalHoldingsValue - totalCostBasis;

  const unrealizedPLPercent =
    totalCostBasis > 0
      ? (unrealizedPL / totalCostBasis) * 100
      : 0;

  return {
    totalHoldingsValue,
    totalCashValue,
    netWorth,
    totalCostBasis,
    unrealizedPL,
    unrealizedPLPercent
  };
}

/* =========================
   ALLOCATION
========================= */

// Portfolio allocation by asset type (stocks, crypto, etc.)
export function calculatePortfolioAllocation(
  holdings: Holding[]
): { name: string; value: number }[] {

  const grouped: Record<string, number> = {};

  for (const h of holdings) {
    const value = getHoldingValueIDR(h);

    grouped[h.type] = (grouped[h.type] || 0) + value;
  }

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value
  }));
}

// Net worth allocation (Investments vs Cash vs Assets)
export function calculateNetWorthAllocation(
  holdings: Holding[],
  cashAccounts: CashAccount[],
  assetAccounts: AssetAccount[] = []
): {
  investmentsTotal: number;
  cashTotal: number;
  assetsTotal: number;
} {

  const investmentsTotal = holdings.reduce(
    (sum, h) => sum + getHoldingValueIDR(h),
    0
  );

  const cashTotal = cashAccounts.reduce(
    (sum, c) => sum + getCashAccountAmount(c),
    0
  );

  const assetsTotal = assetAccounts.reduce(
    (sum, a) => sum + a.value,
    0
  );

  return {
    investmentsTotal,
    cashTotal,
    assetsTotal
  };
}

/* =========================
   FORMATTERS
========================= */

export function formatIDR(amount: number): string {
  // Handle null, undefined, and NaN values
  if (!amount || isNaN(amount)) {
    return 'Rp0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(amount: number): string {
  // Handle null, undefined, and NaN values
  if (!amount || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPercent(value: number): string {
  // Handle null, undefined, and NaN values
  if (!value || isNaN(value)) {
    return '0.00%';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}