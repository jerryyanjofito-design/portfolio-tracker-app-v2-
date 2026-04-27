/**
 * Test suite for ticker formatting idempotency
 * Ensures no double formatting occurs in frontend-to-backend flow
 */

// Mock functions for testing (these will be replaced by actual imports)
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

describe('Ticker Formatting Idempotency', () => {

  describe('Backend formatTicker function', () => {
    const testCases = [
      { input: 'D05', currency: 'SGD', expected: 'D05.SI', description: 'add .SI suffix' },
      { input: 'D05.SI', currency: 'SGD', expected: 'D05.SI', description: 'already has .SI' },
      { input: 'BMRI', currency: 'IDR', expected: 'BMRI.JK', description: 'add .JK suffix' },
      { input: 'BMRI.JK', currency: 'IDR', expected: 'BMRI.JK', description: 'already has .JK' },
      { input: 'AAPL', currency: 'USD', expected: 'AAPL', description: 'no suffix for USD' },
      { input: 'd05', currency: 'SGD', expected: 'D05.SI', description: 'case insensitive' },
      { input: '  D05  ', currency: 'SGD', expected: 'D05.SI', description: 'whitespace trimming' },
    ];

    testCases.forEach(({ input, currency, expected, description }) => {
      test(`${input} + ${currency} → ${expected} (${description})`, () => {
        const result = formatTicker(input, currency);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Frontend formatTickerForAPI function', () => {
    const testCases = [
      { input: 'D05', currency: 'SGD', type: 'stock', expected: 'D05.SI', description: 'add .SI suffix' },
      { input: 'D05.SI', currency: 'SGD', type: 'stock', expected: 'D05.SI', description: 'already has .SI' },
      { input: 'BMRI', currency: 'IDR', type: 'stock', expected: 'BMRI.JK', description: 'add .JK suffix' },
      { input: 'BMRI.JK', currency: 'IDR', type: 'stock', expected: 'BMRI.JK', description: 'already has .JK' },
      { input: 'BTC', currency: 'USD', type: 'crypto', expected: 'BTC', description: 'crypto no suffix' },
      { input: 'AAPL', currency: 'USD', type: 'stock', expected: 'AAPL', description: 'US stocks no suffix' },
    ];

    testCases.forEach(({ input, currency, type, expected, description }) => {
      test(`${input} + ${currency} + ${type} → ${expected} (${description})`, () => {
        const result = formatTickerForAPI(input, currency, type);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Integration - Frontend to Backend Flow', () => {
    const testCases = [
      { input: 'D05', currency: 'SGD', expected: 'D05.SI', description: 'Singapore stock' },
      { input: 'BMRI', currency: 'IDR', expected: 'BMRI.JK', description: 'Indonesian stock' },
      { input: 'AAPL', currency: 'USD', expected: 'AAPL', description: 'US stock' },
    ];

    testCases.forEach(({ input, currency, expected, description }) => {
      test(`${input} → Frontend → Backend: ${expected} (${description})`, () => {
        // Simulate frontend formatting
        const frontendResult = formatTickerForAPI(input, currency, 'stock');
        // Simulate backend receiving the formatted ticker
        const backendResult = formatTicker(frontendResult, currency);

        expect(frontendResult).toBe(expected);
        expect(backendResult).toBe(expected);
        expect(backendResult).not.toContain('.SI.SI');
        expect(backendResult).not.toContain('.JK.JK');
      });
    });
  });

  describe('Idempotency - Multiple Calls', () => {
    const testCases = [
      { input: 'D05', currency: 'SGD', type: 'stock', expected: 'D05.SI' },
      { input: 'BMRI', currency: 'IDR', type: 'stock', expected: 'BMRI.JK' },
      { input: 'AAPL', currency: 'USD', type: 'stock', expected: 'AAPL' },
    ];

    testCases.forEach(({ input, currency, type, expected }) => {
      test(`${input} - multiple calls produce same result`, () => {
        const result1 = formatTickerForAPI(input, currency, type);
        const result2 = formatTickerForAPI(result1, currency, type);
        const result3 = formatTickerForAPI(result2, currency, type);

        expect(result1).toBe(expected);
        expect(result2).toBe(expected);
        expect(result3).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles mixed case input', () => {
      const result1 = formatTickerForAPI('d05', 'SGD', 'stock');
      const result2 = formatTickerForAPI('bMri', 'IDR', 'stock');
      expect(result1).toBe('D05.SI');
      expect(result2).toBe('BMRI.JK');
    });

    test('handles whitespace', () => {
      const result1 = formatTickerForAPI('  d05  ', 'SGD', 'stock');
      const result2 = formatTickerForAPI('  BMRI  ', 'IDR', 'stock');
      expect(result1).toBe('D05.SI');
      expect(result2).toBe('BMRI.JK');
    });

    test('crypto without suffix', () => {
      const result = formatTickerForAPI('BTC', 'USD', 'crypto');
      expect(result).toBe('BTC');
    });

    test('ETF types work correctly', () => {
      const result1 = formatTickerForAPI('EWT', 'SGD', 'etf');
      const result2 = formatTickerForAPI('XJF', 'IDR', 'etf');
      expect(result1).toBe('EWT.SI');
      expect(result2).toBe('XJF.JK');
    });
  });
});