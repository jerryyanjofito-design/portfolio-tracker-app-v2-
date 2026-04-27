import { Currency } from './types';

/**
 * Database Validation Layer
 * Ensures all database operations use valid prices and proper currency handling
 * Prevents invalid states that cause calculation errors
 */

/**
 * Validate price before database operations
 * Ensures prices are valid numbers and in reasonable ranges
 */
export function validatePrice(price: number, currency: Currency): boolean {
  if (price === null || price === undefined || isNaN(price)) {
    console.error('Price is null, undefined, or NaN');
    return false;
  }

  if (price <= 0) {
    console.error('Price must be positive:', price);
    return false;
  }

  // Currency-specific validation
  if (currency === 'USD' && price > 10000) {
    console.warn(`Unreasonably high USD price: ${price} (might be stored in IDR)`);
    return false;
  }

  if (currency === 'IDR' && price < 1000) {
    console.warn(`Unreasonably low IDR price: ${price} (might be stored in USD)`);
    return false;
  }

  return true;
}

/**
 * Validate holding data before database operations
 * Comprehensive validation to prevent invalid portfolio states
 */
export function validateHolding(holding: {
  ticker: string,
  type: string,
  shares: number,
  purchasePrice: number,
  currentPrice: number,
  currency: Currency
}): boolean {
  // Validate shares
  if (!holding.shares || holding.shares <= 0) {
    console.error('Invalid shares:', holding.shares);
    return false;
  }

  // Validate prices
  if (!validatePrice(holding.purchasePrice, holding.currency) ||
      !validatePrice(holding.currentPrice, holding.currency)) {
    console.error('Invalid prices:', {
      ticker: holding.ticker,
      purchase: holding.purchasePrice,
      current: holding.currentPrice,
      currency: holding.currency
    });
    return false;
  }

  return true;
}

/**
 * Ensure price is in valid IDR format for database storage
 * Database stores all prices as IDR for consistency
 */
export function ensureValidIDRPrice(price: number, currency: Currency): number {
  if (currency === 'IDR') {
    return price; // Already in IDR
  }

  // Convert other currencies to IDR
  if (currency === 'SGD') {
    return price * 17124; // Using centralized rate
  }

  if (currency === 'USD') {
    return price * 17124; // Using centralized rate
  }

  throw new Error(`Unsupported currency for IDR storage: ${currency}`);
}
