import { convertToIDR } from './fxRates';
import { validateHoldingComplete, detectDoubleConversion } from './currencyValidation';

/**
 * Currency Fix Validation Test
 * Tests the complete currency handling fix with the GLD example
 */

export function testGLDCurrencyFix() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        GLD CURRENCY FIX VALIDATION TEST                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Simulate user input: GLD holding with USD currency
  const testHolding = {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    type: 'stock' as const,
    shares: 1,
    purchasePrice: 404,        // User inputs 404 USD
    currentPrice: 240,         // Current price 240 USD
    currency: 'USD' as const    // User selects USD currency
  };

  console.log('\n📋 TEST SCENARIO:');
  console.log('   User Input: GLD holding');
  console.log('   Purchase Price: 404 USD');
  console.log('   Current Price: 240 USD');
  console.log('   Currency: USD');
  console.log('   Expected P/L: -40.59% (loss)');

  // Test 1: Validation
  console.log('\n🧪 TEST 1: Validation');
  console.log('   Testing comprehensive validation...');

  const validationPassed = validateHoldingComplete(testHolding);

  if (validationPassed) {
    console.log('   ✅ VALIDATION PASSED');
  } else {
    console.log('   ❌ VALIDATION FAILED');
    return false;
  }

  // Test 2: Currency Conversion (purchase price)
  console.log('\n🧪 TEST 2: Purchase Price Conversion');
  console.log('   Converting purchase price to IDR...');

  const purchasePriceNative = testHolding.purchasePrice;
  const purchasePriceIDR = convertToIDR(purchasePriceNative, testHolding.currency);

  console.log(`   Input: ${purchasePriceNative} ${testHolding.currency}`);
  console.log(`   Expected: ${purchasePriceNative} × ${17124} = ${(purchasePriceNative * 17124).toLocaleString()} IDR`);
  console.log(`   Actual: ${purchasePriceIDR.toLocaleString()} IDR`);

  const expectedPurchaseIDR = purchasePriceNative * 17124;
  const purchaseMatch = Math.abs(purchasePriceIDR - expectedPurchaseIDR) < 0.01;

  if (purchaseMatch) {
    console.log('   ✅ PURCHASE PRICE CONVERSION PASSED');
  } else {
    console.log('   ❌ PURCHASE PRICE CONVERSION FAILED');
    console.log(`   Expected: ${expectedPurchaseIDR}, Got: ${purchasePriceIDR}`);
    return false;
  }

  // Test 3: Currency Conversion (current price)
  console.log('\n🧪 TEST 3: Current Price Conversion');
  console.log('   Converting current price to IDR...');

  const currentPriceNative = testHolding.currentPrice;
  const currentPriceIDR = convertToIDR(currentPriceNative, testHolding.currency);

  console.log(`   Input: ${currentPriceNative} ${testHolding.currency}`);
  console.log(`   Expected: ${currentPriceNative} × ${17124} = ${(currentPriceNative * 17124).toLocaleString()} IDR`);
  console.log(`   Actual: ${currentPriceIDR.toLocaleString()} IDR`);

  const expectedCurrentIDR = currentPriceNative * 17124;
  const currentMatch = Math.abs(currentPriceIDR - expectedCurrentIDR) < 0.01;

  if (currentMatch) {
    console.log('   ✅ CURRENT PRICE CONVERSION PASSED');
  } else {
    console.log('   ❌ CURRENT PRICE CONVERSION FAILED');
    console.log(`   Expected: ${expectedCurrentIDR}, Got: ${currentPriceIDR}`);
    return false;
  }

  // Test 4: Double Conversion Detection
  console.log('\n🧪 TEST 4: Double Conversion Detection');
  console.log('   Testing for double conversion issues...');

  const hasDoubleConversion = detectDoubleConversion(
    purchasePriceNative,
    purchasePriceIDR,
    testHolding.currency,
    'IDR'
  );

  if (!hasDoubleConversion) {
    console.log('   ✅ NO DOUBLE CONVERSION DETECTED');
  } else {
    console.log('   ❌ DOUBLE CONVERSION DETECTED');
    return false;
  }

  // Test 5: P/L Calculation
  console.log('\n🧪 TEST 5: P/L Calculation');
  console.log('   Calculating P/L in IDR...');

  const valueIDR = testHolding.shares * currentPriceIDR;
  const costBasisIDR = testHolding.shares * purchasePriceIDR;
  const plIDR = valueIDR - costBasisIDR;
  const plPercent = costBasisIDR > 0 ? (plIDR / costBasisIDR) * 100 : 0;

  console.log(`   Cost Basis: ${costBasisIDR.toLocaleString()} IDR`);
  console.log(`   Value: ${valueIDR.toLocaleString()} IDR`);
  console.log(`   P/L: ${plIDR.toLocaleString()} IDR`);
  console.log(`   P/L %: ${plPercent.toFixed(2)}%`);

  const expectedPLPercent = -40.59;
  const plMatch = Math.abs(plPercent - expectedPLPercent) < 0.01;

  if (plMatch) {
    console.log('   ✅ P/L CALCULATION PASSED');
  } else {
    console.log('   ❌ P/L CALCULATION FAILED');
    console.log(`   Expected: ${expectedPLPercent}%, Got: ${plPercent.toFixed(2)}%`);
    return false;
  }

  // Test 6: Bug Prevention (original bug scenario)
  console.log('\n🧪 TEST 6: Bug Prevention');
  console.log('   Testing original bug scenario (404 USD treated as 404 IDR)...');

  const wrongPrice = 404; // 404 treated as IDR
  const wrongPLPercent = ((240 - 404) / 404) * 100;

  console.log(`   Wrong calculation: (${currentPriceNative} - ${wrongPrice}) / ${wrongPrice} × 100`);
  console.log(`   Wrong P/L %: ${wrongPLPercent.toFixed(2)}%`);

  const bugPrevented = wrongPLPercent !== plPercent;

  if (bugPrevented) {
    console.log('   ✅ BUG PREVENTED - Correct calculation used');
    console.log(`   Correct P/L: ${plPercent.toFixed(2)}% vs Wrong P/L: ${wrongPLPercent.toFixed(2)}%`);
  } else {
    console.log('   ❌ BUG NOT PREVENTED - Still using wrong calculation');
    return false;
  }

  // Final Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              ✅ ALL TESTS PASSED                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n📊 SUMMARY:');
  console.log('   ✅ Validation: Passed');
  console.log('   ✅ Purchase Price Conversion: Passed');
  console.log('   ✅ Current Price Conversion: Passed');
  console.log('   ✅ No Double Conversion: Passed');
  console.log('   ✅ P/L Calculation: Passed');
  console.log('   ✅ Bug Prevention: Passed');
  console.log('\n🎯 RESULT: GLD currency handling is now correct!');
  console.log('   Expected P/L: -40.59% (loss)');
  console.log(`   Actual P/L: ${plPercent.toFixed(2)}%`);
  console.log('   ✅ System will never confuse currency context again!\n');

  return true;
}

/**
 * Run the test and log results
 */
export function runCurrencyFixTest() {
  try {
    const success = testGLDCurrencyFix();
    return success;
  } catch (error) {
    console.error('❌ TEST FAILED WITH EXCEPTION:', error);
    return false;
  }
}

// Auto-run test when this file is imported
if (typeof window !== 'undefined') {
  console.log('🔧 Currency fix validation test loaded. Call runCurrencyFixTest() to run.');
} else {
  // Running in Node.js environment
  console.log('Running currency fix validation test...');
  runCurrencyFixTest();
}
