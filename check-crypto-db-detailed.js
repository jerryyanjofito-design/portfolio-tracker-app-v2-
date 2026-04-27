const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://nibaainsfwccdjervro.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaWJhYWluc2Z3Y2NkamVydnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Mjg4NjcsImV4cCI6MjA5MTEwNDg2N30.zc4EN_XaYXMMMkMiDzQEBoUKHBX0jAtUvukd-9q-3MA'
);

(async () => {
  console.log('=== DETAILED DATABASE QUERY ===');
  console.log('Testing crypto holdings query with comprehensive logging...');

  try {
    console.log('Step 1: Connecting to Supabase...');
    const { data, error } = await client
      .from('holdings')
      .select('ticker, current_price, currency, shares')
      .eq('type', 'crypto')
      .limit(10);

    console.log('Step 2: Query result received');
    console.log('  Data object:', data);
    console.log('  Data type:', typeof data);
    console.log('  Data null?', data === null);
    console.log('  Data array?', Array.isArray(data));

    if (!data) {
      console.log('❌ Data is null - query may have failed');
      console.log('  This explains the "No crypto holdings found" result');
      return;
    }

    if (!Array.isArray(data)) {
      console.log('❌ Data is not an array - unexpected format');
      console.log('  Raw data:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`Step 3: Found ${data.length} holdings total`);
    console.log(`Step 4: Examining crypto holdings...`);

    let cryptoCount = 0;
    for (const holding of data) {
      if (holding.type === 'crypto') {
        cryptoCount++;
        console.log(`\n=== Crypto #${cryptoCount}: ${holding.ticker} ===`);
        console.log('  Raw data:', JSON.stringify(holding, null, 2));
        console.log('  ticker:', holding.ticker);
        console.log('  current_price:', holding.current_price);
        console.log('  currency:', holding.currency);
        console.log('  shares:', holding.shares);
        console.log('  avg_price:', holding.avg_price);

        // Check if data structure is correct
        if (!holding.ticker || !holding.current_price || !holding.currency || !holding.shares) {
          console.log('  ❌ Missing required fields');
        } else {
          console.log('  ✓ All required fields present');
        }

        // Calculate expected average price
        const avgPrice = holding.current_price;
        const expectedAvgIDR = avgPrice * 17124; // Convert USD to IDR
        console.log('  Average price in DB:', avgPrice, holding.currency);
        console.log('  Expected Avg IDR:', expectedAvgIDR);
        console.log('  Conversion math:', avgPrice, '×', 17124, '=', expectedAvgIDR);
      } else {
        console.log('  Skipping non-crypto holding');
      }
    }

    console.log(`Step 5: Summary ===`);
    console.log(`  Total crypto holdings found: ${cryptoCount}`);
    console.log(`  Database query appears to be working correctly`);

  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('   Error details:', error.message);
  }
})();
