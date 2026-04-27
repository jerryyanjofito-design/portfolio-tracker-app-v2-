// Centralized FX Rates - Single Source of Truth
// This file provides consistent currency conversion rates across the entire application
// preventing inconsistencies between different files and components

export const FX_RATES = {
  USD_TO_IDR: 17124,
  SGD_TO_IDR: 12473,
  USD_TO_SGD: 1.37 // Derived: 17124 / 12473 ≈ 1.37
};

export type Currency = 'IDR' | 'SGD' | 'USD';

/**
 * Convert any currency to IDR (base currency)
 * All portfolio calculations use IDR as the base currency
 */
export function convertToIDR(amount: number, fromCurrency: Currency): number {
  switch (fromCurrency) {
    case 'IDR':
      return amount;
    case 'SGD':
      return amount * FX_RATES.SGD_TO_IDR;
    case 'USD':
      return amount * FX_RATES.USD_TO_IDR;
    default:
      throw new Error(`Unsupported currency: ${fromCurrency}`);
  }
}

/**
 * Convert IDR to any currency
 * Used for USD display calculations where needed
 */
export function convertFromIDR(amount: number, toCurrency: Currency): number {
  switch (toCurrency) {
    case 'IDR':
      return amount;
    case 'SGD':
      return amount / FX_RATES.SGD_TO_IDR;
    case 'USD':
      return amount / FX_RATES.USD_TO_IDR;
    default:
      throw new Error(`Unsupported currency: ${toCurrency}`);
  }
}

/**
 * Convert between any two currencies
 * Used for direct currency conversions when needed
 */
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) return amount;

  // Convert to IDR first, then to target currency
  const idrAmount = convertToIDR(amount, fromCurrency);
  return convertFromIDR(idrAmount, toCurrency);
}
