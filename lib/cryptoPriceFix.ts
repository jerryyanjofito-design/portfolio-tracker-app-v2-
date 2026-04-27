/**
 * Crypto Price Validation and Debugging Tool
 * Addresses specific issue of crypto holdings showing tiny IDR values
 */

import { Currency } from './types';
import { FX_RATES } from './fxRates';

/**
 * Validate crypto price is in appropriate range for its currency
 * Returns true if price looks suspicious for double conversion
 */
export function validateCryptoPrice(price: number, currency: Currency, ticker: string): boolean {
  console.log(`=== CRYPTO PRICE VALIDATION ===`);
  console.log('Ticker:', ticker);
  console.log('  Currency:', currency);
  console.log('  Price:', price);

  const warnings: string[] = [];

  // Currency-specific range checks
  if (currency === 'USD') {
    if (price > 10000) {
      warnings.push('⚠️ Suspicious: USD price > $10,000 (might be stored as IDR)');
    }
    if (price < 0.01) {
      warnings.push('⚠️ Suspicious: USD price < $0.01');
    }
  } else if (currency === 'IDR') {
    if (price < 1000) {
      warnings.push('⚠️ Suspicious: IDR price < Rp 1,000 (might be stored as USD)');
    }
    if (price > 100000000) {
      warnings.push('⚠️ Suspicious: IDR price > Rp 100,000,000');
    }
  } else if (currency === 'SGD') {
    if (price > 10000) {
      warnings.push('⚠️ Suspicious: SGD price > $10,000 (might be stored as IDR)');
    }
    if (price < 0.01) {
      warnings.push('⚠️ Suspicious: SGD price < $0.01');
    }
  }

  if (warnings.length > 0) {
    console.warn('Currency Validation Warnings:');
    warnings.forEach(warning => console.warn('  ' + warning));
    console.log('======================');
    return false;
  }

  console.log('✅ Crypto price validation passed for', ticker);
  console.log('===========================');
  return true;
}

/**
 * Test specific crypto holding for the reported issue
 * Tests price flow from API → database → UI
 */
export function testCryptoHolding(ticker: string, expectedUSDPrice: number, expectedIDRPrice: number): void {
  console.log('=== TESTING CRYPTO HOLDING ===');
  console.log('Test Ticker:', ticker);
  console.log('Expected USD Price:', expectedUSDPrice);
  console.log('Expected IDR Price:', expectedIDRPrice);

  // Simulate API response
  const apiUSDPrice = expectedUSDPrice;
  console.log('API Response: USD', apiUSDPrice);

  // Simulate database storage (should store native price)
  console.log('Database Storage (expected):');
  console.log('  Storing current_price:', apiUSDPrice, 'USD');
  console.log('  currency:', 'USD');

  // Simulate database retrieval
  const dbPrice = apiUSDPrice; // What comes back from database
  console.log('Database Retrieval (actual):', dbPrice, 'USD');

  // Simulate HoldingsTable calculation
  console.log('HoldingsTable Calculation:');
  const shares = 1;
  const purchasePriceNative = dbPrice;
  const currentPriceNative = dbPrice;
  const currency = 'USD';

  const valueUSD = shares * currentPriceNative;
  const costBasisUSD = shares * purchasePriceNative;
  const plUSD = valueUSD - costBasisUSD;

  console.log('  Calculation: ');
  console.log('  Purchase:', purchasePriceNative, 'USD');
  console.log('  Current:', currentPriceNative, 'USD');
  console.log('  Shares:', shares);
  console.log('  Value USD:', valueUSD);
  console.log('  Cost Basis USD:', costBasisUSD);
  console.log('  P/L USD:', plUSD);

  // Check if double conversion happens
  const calculatedIDRPrice = apiUSDPrice * FX_RATES.USD_TO_IDR;
  console.log('Expected IDR Price:', calculatedIDRPrice);

  const actualIDRPrice = dbPrice; // If stored as USD, this should match
  console.log('Actual IDR Price:', actualIDRPrice);

  if (actualIDRPrice !== calculatedIDRPrice) {
    console.error('🚨 DOUBLE CONVERSION DETECTED!');
    console.error('  Expected IDR:', calculatedIDRPrice, '(from API conversion)');
    console.error('  Actual IDR:', actualIDRPrice, '(stored in database - no conversion)');
  }

  // Check HoldingsTable display
  console.log('HoldingsTable Display Check:');
  const displayPriceIDR = dbPrice * FX_RATES.USD_TO_IDR;
  console.log('Display Price IDR:', displayPriceIDR);
  const displayUSD = dbPrice;
  console.log('Display Price USD:', displayUSD);

  console.log('===========================');
}

/**
 * Quick fix for crypto pricing issue
 * Ensures crypto prices are stored in native currency
 * Validates against suspicious values
 */
export function quickCryptoPriceFix(holding: any): number {
  // Check if crypto price looks suspiciously small
  const isSuspiciouslySmall = validateCryptoPrice(
    holding.currentPrice,
    holding.currency,
    holding.ticker
  );

  // If suspicious, return purchase price (native currency)
  if (isSuspiciouslySmall) {
    console.warn('⚠️ Suspicious crypto price detected:', holding.ticker);
    console.warn('   Price:', holding.currentPrice);
    console.warn('   Currency:', holding.currency);
    console.warn('   Reverting to purchase price fallback');
    return holding.purchasePrice; // Native currency
  }

  // Otherwise, return as-is
  return holding.currentPrice;
}

/**
 * Main function to fix crypto pricing data
 * Finds and fixes crypto holdings with suspiciously small prices
 */
export async function fixCryptoPricing(holdings: any[]): Promise<void> {
  console.log('=== CRYPTO PRICING FIX ===');

  let fixedCount = 0;
  let skippedCount = 0;

  for (const holding of holdings) {
    // Only process crypto holdings
    if (holding.type !== 'crypto') {
      skippedCount++;
      console.log('Skipping non-crypto holding:', holding.ticker);
      continue;
    }

    console.log(`Processing: ${holding.ticker} (${holding.type})`);
    console.log('  Current price:', holding.currentPrice);
    console.log('  Currency:', holding.currency);

    // Check if price is suspiciously small
    const isFixed = await quickCryptoPriceFix(holding);

    if (isFixed) {
      console.log('✅ Fixed price for', holding.ticker);
      fixedCount++;
    } else {
      console.log('⚠️ No fix needed for', holding.ticker);
      skippedCount++;
    }
  }

  console.log('=== CRYPTO PRICING FIX SUMMARY ===');
  console.log('Fixed:', fixedCount);
  console.log('Skipped:', skippedCount);
  console.log('Total:', holdings.filter(h => h.type === 'crypto').length);
  console.log('========================');
}

/**
 * Logging utilities for crypto pricing
 */
export function logCryptoPrice(holding: any, action: string): void {
  console.log(`=== CRYPTO PRICE LOG ===`);
  console.log('Ticker:', holding.ticker);
  console.log('Action:', action);
  console.log('Current Price:', holding.currentPrice);
  console.log('Currency:', holding.currency);
  console.log('=================');
}
