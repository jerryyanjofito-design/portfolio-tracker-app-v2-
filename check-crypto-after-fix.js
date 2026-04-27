const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://nibaainsfwccdjervro.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaWJhYWluc2Z3Y2NkamVydnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Mjg4NjcsImV4cCI6MjA5MTEwNDg2N30.zc4EN_XaYXMMMkMiDzQEBoUKHBX0jAtUvukd-9q-3MA'
);

(async () => {
  console.log('=== CRYPTO HOLDINGS AFTER FIX ===');

  try {
    const { data } = await client
      .from('holdings')
      .select('ticker, current_price, currency, shares')
      .eq('type', 'crypto')
      .limit(5);

    if (!data || data.length === 0) {
      console.log('No crypto holdings found');
      return;
    }

    console.log(`Found ${data.length} crypto holdings`);

    for (const holding of data) {
      console.log(`\n${holding.ticker}:`);
      console.log(`  Price: ${holding.current_price}`);
      console.log(`  Currency: ${holding.currency}`);
      console.log(`  Shares: ${holding.shares}`);

      // Calculate what average price SHOULD be
      const avgPrice = holding.current_price;
      const expectedAvgIDR = avgPrice * 17124; // Convert USD to IDR
      console.log(`  Expected Avg IDR: ${expectedAvgIDR}`);
      console.log(`  (calculation: ${holding.current_price} × 17124)`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();
