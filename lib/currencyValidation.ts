import { Currency } from './types';
import { FX_RATES } from './fxRates';

/**
 * Currency Validation and Safety Guards
 * Prevents currency handling errors and provides early detection of issues
 */

/**
 * Validate price is appropriate for its currency
 * Prevents confusing IDR prices with USD prices
 */
export function validatePriceRange(price: number, currency: Currency): boolean {
  if (!price || isNaN(price) || price <= 0) {
    console.error('❌ Price validation failed: Invalid price value');
    return false;
  }

  const warnings: string[] = [];

  // Currency-specific range checks
  if (currency === 'USD' && price > 10000) {
    warnings.push('⚠️ Suspicious: USD price > $10,000 (might be stored as IDR)');
  }
  if (currency === 'USD' && price < 0.01) {
    warnings.push('⚠️ Suspicious: USD price < $0.01 (might be stored incorrectly)');
  }
  if (currency === 'IDR' && price < 1000) {
    warnings.push('⚠️ Suspicious: IDR price < Rp 1,000 (might be stored as USD)');
  }
  if (currency === 'IDR' && price > 100000000) {
    warnings.push('⚠️ Suspicious: IDR price > Rp 100,000,000 (might be stored incorrectly)');
  }
  if (currency === 'SGD' && price > 10000) {
    warnings.push('⚠️ Suspicious: SGD price > $10,000 (might be stored as IDR)');
  }
  if (currency === 'SGD' && price < 0.01) {
    warnings.push('⚠️ Suspicious: SGD price < $0.01 (might be stored incorrectly)');
  }

  if (warnings.length > 0) {
    console.warn('Currency Price Validation Warnings:');
    warnings.forEach(warning => console.warn('  ' + warning));
    return false;
  }

  console.log('✅ Price validation passed for', currency, price);
  return true;
}

/**
 * Detect double conversion issues
 * Checks if a converted value matches expected conversion rate
 */
export function detectDoubleConversion(
  original: number,
  converted: number,
  fromCurrency: Currency,
  toCurrency: 'IDR'
): boolean {
  if (fromCurrency === toCurrency) {
    console.warn('⚠️ No conversion needed - currencies are the same');
    return false;
  }

  // Calculate expected conversion
  let expected: number;
  if (fromCurrency === 'USD') {
    expected = original * FX_RATES.USD_TO_IDR;
  } else if (fromCurrency === 'SGD') {
    expected = original * FX_RATES.SGD_TO_IDR;
  } else if (fromCurrency === 'IDR') {
    // Reverse conversion check - this may indicate double conversion
    console.warn('⚠️ Reverse conversion detected - this may indicate double conversion');
    return true;
  } else {
    console.error('❌ Unsupported currency conversion:', fromCurrency, '→', toCurrency);
    return true;
  }

  // Check if converted value matches expected (allow small rounding errors)
  const tolerance = expected * 0.01; // 1% tolerance for rounding
  const diff = Math.abs(converted - expected);

  if (diff > tolerance) {
    console.error('🚨 DOUBLE CONVERSION DETECTED!');
    console.error('   Original:', original, fromCurrency);
    console.error('   Expected:', expected.toFixed(2), toCurrency);
    console.error('   Actual:', converted.toFixed(2), toCurrency);
    console.error('   Difference:', diff.toFixed(2), `(${((diff / expected) * 100).toFixed(2)}%)`);
    return true;
  }

  console.log('✅ Conversion validated:', original, fromCurrency, '→', converted.toFixed(2), toCurrency);
  return false;
}

/**
 * Validate currency consistency across holding data
 * Ensures prices make sense for their declared currency
 */
export function validateCurrencyConsistency(holding: {
  ticker: string;
  purchasePrice: number;
  currentPrice: number;
  currency: Currency;
}): boolean {
  const { purchasePrice, currentPrice, currency, ticker } = holding;

  console.log('=== CURRENCY CONSISTENCY CHECK ===');
  console.log('Holding:', ticker);
  console.log('  purchasePrice:', purchasePrice, currency);
  console.log('  currentPrice:', currentPrice, currency);

  const warnings: string[] = [];

  // Check for suspicious price ranges
  if (currency === 'USD') {
    if (purchasePrice > 10000 || currentPrice > 10000) {
      warnings.push('⚠️ USD prices look like IDR (values > $10,000)');
    }
    if (purchasePrice < 0.01 || currentPrice < 0.01) {
      warnings.push('⚠️ USD prices too low (< $0.01)');
    }
  } else if (currency === 'IDR') {
    if (purchasePrice < 1000 || currentPrice < 1000) {
      warnings.push('⚠️ IDR prices look like USD (values < Rp 1,000)');
    }
    if (purchasePrice > 100000000 || currentPrice > 100000000) {
      warnings.push('⚠️ IDR prices too high (> Rp 100,000,000)');
    }
  } else if (currency === 'SGD') {
    if (purchasePrice > 10000 || currentPrice > 10000) {
      warnings.push('⚠️ SGD prices look like IDR (values > $10,000)');
    }
    if (purchasePrice < 0.01 || currentPrice < 0.01) {
      warnings.push('⚠️ SGD prices too low (< $0.01)');
    }
  }

  // Check for reasonable price changes
  const priceChangeRatio = Math.abs(currentPrice / purchasePrice);
  if (priceChangeRatio > 100) {
    warnings.push(`⚠️ Price change suspicious: ${priceChangeRatio.toFixed(0)}x (potential data error)`);
  }
  if (priceChangeRatio < 0.01) {
    warnings.push(`⚠️ Price change suspicious: ${(priceChangeRatio * 100).toFixed(1)}% (potential data error)`);
  }

  if (warnings.length > 0) {
    console.warn('Currency Consistency Warnings:');
    warnings.forEach(warning => console.warn('  ' + warning));
    console.log('================================');
    return false;
  }

  console.log('✅ Currency consistency validated');
  console.log('================================');
  return true;
}

/**
 * Comprehensive holding validation before storage or calculation
 * Combines all validation checks
 */
export function validateHoldingComplete(holding: {
  ticker: string;
  purchasePrice: number;
  currentPrice: number;
  currency: Currency;
  shares: number;
}): boolean {
  const { ticker, shares } = holding;

  console.log('=== COMPREHENSIVE HOLDING VALIDATION ===');
  console.log('Holding:', ticker);
  console.log('  shares:', shares);

  // Validate shares
  if (!shares || shares <= 0 || isNaN(shares)) {
    console.error('❌ Invalid shares:', shares);
    console.log('===========================================');
    return false;
  }

  // Validate currency consistency
  const consistencyValid = validateCurrencyConsistency(holding);
  if (!consistencyValid) {
    console.log('===========================================');
    return false;
  }

  console.log('✅ All validations passed for', ticker);
  console.log('===========================================');
  return true;
}

/**
 * Detect if convertToIDR is being called inappropriately
 * This should only be called in the calculation layer
 */
export function validateConversionContext(
  callingFunction: string,
  callingFile: string
): boolean {
  const allowedFiles = ['calculations.ts', 'fxRates.ts', 'priceFetcher.ts'];
  const allowedFunctions = ['convertToIDR', 'getHoldingValueIDR', 'getHoldingCostIDR', 'getCashAccountAmount'];

  const isAllowedFile = allowedFiles.some(file => callingFile.includes(file));
  const isAllowedFunction = allowedFunctions.includes(callingFunction);

  if (!isAllowedFile || !isAllowedFunction) {
    console.warn('⚠️ CURRENCY CONVERSION IN INAPPROPRIATE CONTEXT!');
    console.warn('   Called from:', callingFile, '::', callingFunction);
    console.warn('   Currency conversion should ONLY happen in calculation layer');
    console.warn('   Allowed files:', allowedFiles.join(', '));
    console.warn('   Allowed functions:', allowedFunctions.join(', '));
    return false;
  }

  return true;
}
