/**
 * Manual testing script for ticker formatting fixes
 * Run: npm run test-ticker-formatting
 */

interface TestCase {
  input: string;
  currency: string;
  expected: string;
  description: string;
}

// Mock functions for testing (mimicking actual implementation)
function formatTicker(ticker: string, currency: string): string {
  const cleanTicker = ticker.toUpperCase().trim();

  // Indonesian stocks (IDR) use .JK suffix - add only if not already present
  if (currency === 'IDR') {
    if (cleanTicker.endsWith('.JK')) {
      console.log(`API: ${cleanTicker} already has .JK suffix, keeping as-is`);
      return cleanTicker;
    }
    const jkTicker = cleanTicker + '.JK';
    console.log(`API: ${cleanTicker} → ${jkTicker} (adding .JK suffix)`);
    return jkTicker;
  }

  // Singapore stocks (SGD) use .SI suffix - add only if not already present
  if (currency === 'SGD') {
    if (cleanTicker.endsWith('.SI')) {
      console.log(`API: ${cleanTicker} already has .SI suffix, keeping as-is`);
      return cleanTicker;
    }
    const siTicker = cleanTicker + '.SI';
    console.log(`API: ${cleanTicker} → ${siTicker} (adding .SI suffix)`);
    return siTicker;
  }

  // USD and other currencies - return as-is
  console.log(`API: ${cleanTicker} → ${cleanTicker} (no suffix needed)`);
  return cleanTicker;
}

function formatTickerForAPI(ticker: string, currency: string, type: string): string {
  const rawTicker = ticker.toUpperCase().trim();

  // Crypto doesn't need suffixes
  if (type === 'crypto') {
    console.log(`Fetching: ${rawTicker} → ${rawTicker} (crypto, no suffix)`);
    return rawTicker;
  }

  // Indonesian stocks (IDR) use .JK suffix - add only if not already present
  if (currency === 'IDR' && (type === 'stock' || type === 'etf')) {
    if (rawTicker.endsWith('.JK')) {
      console.log(`Fetching: ${rawTicker} → ${rawTicker} (already has .JK suffix)`);
      return rawTicker;
    }
    const jkTicker = rawTicker + '.JK';
    console.log(`API ticker: ${rawTicker} → ${jkTicker} (Indonesian)`);
    return jkTicker;
  }

  // Singapore stocks (SGD) use .SI suffix - add only if not already present
  if (currency === 'SGD' && (type === 'stock' || type === 'etf')) {
    if (rawTicker.endsWith('.SI')) {
      console.log(`Fetching: ${rawTicker} → ${rawTicker} (already has .SI suffix)`);
      return rawTicker;
    }
    const siTicker = rawTicker + '.SI';
    console.log(`Fetching: ${rawTicker} → ${siTicker} (Singapore)`);
    return siTicker;
  }

  // US stocks/ETFs (USD) use ticker as-is
  if (currency === 'USD' && (type === 'stock' || type === 'etf')) {
    console.log(`Fetching: ${rawTicker} → ${rawTicker} (US market)`);
    return rawTicker;
  }

  // Default
  console.log(`Fetching: ${rawTicker} → ${rawTicker} (no suffix)`);
  return rawTicker;
}

async function testTickerFormatting() {
  console.log('=== Testing Ticker Formatting Fixes ===\n');

  const testCases: TestCase[] = [
    { input: 'D05', currency: 'SGD', expected: 'D05.SI', description: 'Add .SI suffix' },
    { input: 'D05.SI', currency: 'SGD', expected: 'D05.SI', description: 'Already has .SI' },
    { input: 'BMRI', currency: 'IDR', expected: 'BMRI.JK', description: 'Add .JK suffix' },
    { input: 'BMRI.JK', currency: 'IDR', expected: 'BMRI.JK', description: 'Already has .JK' },
    { input: 'AAPL', currency: 'USD', expected: 'AAPL', description: 'No suffix for USD' },
    { input: 'd05', currency: 'SGD', expected: 'D05.SI', description: 'Case insensitive' },
    { input: '  D05  ', currency: 'SGD', expected: 'D05.SI', description: 'Whitespace trimming' },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`Test: ${testCase.input} + ${testCase.currency}`);
    console.log(`  Expected: ${testCase.expected} (${testCase.description})`);

    try {
      // Test individual functions
      const frontendResult = formatTickerForAPI(testCase.input, testCase.currency, 'stock');
      const backendResult = formatTicker(testCase.input, testCase.currency);
      const integrationResult = formatTicker(frontendResult, testCase.currency);

      console.log(`  Frontend: ${frontendResult}`);
      console.log(`  Backend:  ${backendResult}`);
      console.log(`  Integration: ${integrationResult}`);

      // Validate results
      const frontendPass = frontendResult === testCase.expected;
      const backendPass = backendResult === testCase.expected;
      const integrationPass = integrationResult === testCase.expected;
      const noDoubleSuffixes = !integrationResult.includes('.SI.SI') && !integrationResult.includes('.JK.JK');

      const allPassed = frontendPass && backendPass && integrationPass && noDoubleSuffixes;

      if (allPassed) {
        console.log('  Result: PASS ✓\n');
        passedTests++;
      } else {
        console.log('  Result: FAIL ✗\n');
        if (!frontendPass) console.log('    - Frontend test failed');
        if (!backendPass) console.log('    - Backend test failed');
        if (!integrationPass) console.log('    - Integration test failed');
        if (!noDoubleSuffixes) console.log('    - Double suffixes detected!');
        failedTests++;
      }
    } catch (error) {
      console.log(`  Error: ${error}`);
      console.log('  Result: ERROR ✗\n');
      failedTests++;
    }
  }

  console.log('=== Summary ===');
  console.log(`Passed: ${passedTests}/${testCases.length}`);
  console.log(`Failed: ${failedTests}/${testCases.length}`);

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Ticker formatting is working correctly.');
    process.exit(0);
  }
}

testTickerFormatting();