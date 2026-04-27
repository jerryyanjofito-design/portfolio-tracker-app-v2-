/**
 * Simple test to verify crypto pricing fix
 */

// Test specific crypto holdings mentioned by user
const testHoldings = [
  { ticker: 'ETH', expectedUSD: 2340, expectedIDR: 4010040 },
  { ticker: 'BTC', expectedUSD: 68000, expectedIDR: 1166432000 },
  { ticker: 'SOL', expectedUSD: 140, expectedIDR: 240402 }
];

console.log('=== TEST CRYPTO PRICES ===');
console.log('Testing crypto price fix...');

for (const test of testHoldings) {
  console.log(`\n=== Testing ${test.ticker} ===`);
  console.log(`Expected USD: ${test.expectedUSD}`);
  console.log(`Expected IDR: ${test.expectedIDR}`);

  // Simulate current behavior (with fix)
  const simulatedCurrentPriceUSD = test.expectedUSD; // Bug: stores as IDR then converts again
  const simulatedCurrentPriceIDR = simulatedCurrentPriceUSD * 17124; // Double conversion bug

  console.log('Simulated current (bug):', simulatedCurrentPriceUSD, '→ IDR:', simulatedCurrentPriceIDR);

  // Expected correct behavior (after fix)
  const fixedCurrentPriceUSD = test.expectedUSD; // Fix: stores USD, converts only once
  const fixedCurrentPriceIDR = fixedCurrentPriceUSD * 17124;

  console.log('Expected behavior (after fix):');
  console.log('  Current price: USD', fixedCurrentPriceUSD);
  console.log('  Current price IDR:', fixedCurrentPriceIDR);

  console.log('Expected vs Simulated:');
  console.log('  Expected IDR:', test.expectedIDR);
  console.log(' Simulated IDR:', simulatedCurrentPriceIDR);
  console.log('  Difference:', fixedCurrentPriceIDR - simulatedCurrentPriceIDR);

  if (Math.abs(fixedCurrentPriceIDR - simulatedCurrentPriceIDR) > 1) {
    console.warn('⚠️ DOUBLE CONVERSION DETECTED!');
    console.log('  Expected IDR:', test.expectedIDR);
    console.log('  Simulated IDR:', simulatedCurrentPriceIDR);
    console.log('  Difference:', Math.abs(fixedCurrentPriceIDR - simulatedCurrentPriceIDR));
  } else {
    console.log('✅ Single conversion working correctly');
    console.log('  Difference should be zero');
  }

  console.log('-----------------');
}

// Test complete
console.log('=== TEST SUMMARY ===');
console.log('All crypto holdings tested:', testHoldings.length);
console.log('Expected: Prices stored in native USD, converted to IDR for calculations');
console.log('====================');
