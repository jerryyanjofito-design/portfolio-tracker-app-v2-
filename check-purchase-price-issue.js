// This script checks if purchase_price values in the database are already converted to IDR
// which would cause double conversion when currency is correctly set to USD

const path = require('path');
const fs = require('fs');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('=== CHECKING PURCHASE PRICE DOUBLE CONVERSION ISSUE ===\n');

  try {
    // Fetch crypto holdings
    const { data, error } = await client
      .from('holdings')
      .select('ticker, type, shares, purchase_price, current_price, currency')
      .eq('type', 'crypto');

    if (error) {
      console.error('Database error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No crypto holdings found');
      return;
    }

    console.log(`Found ${data.length} crypto holdings:\n`);

    for (const holding of data) {
      console.log(`=== ${holding.ticker} ===`);
      console.log(`  Type: ${holding.type}`);
      console.log(`  Currency in DB: ${holding.currency}`);
      console.log(`  Shares: ${holding.shares}`);
      console.log(`  Purchase Price: ${holding.purchase_price} (stored in DB)`);
      console.log(`  Current Price: ${holding.current_price} (stored in DB)`);

      // Calculate what the purchase price SHOULD be if converted to IDR
      const purchasePriceIDR = holding.purchase_price * 17124; // USD to IDR conversion
      const currentPriceIDR = holding.current_price * 17124; // USD to IDR conversion

      console.log(`\n  Expected conversion (USD → IDR):`);
      console.log(`    Purchase price should be: Rp ${purchasePriceIDR.toLocaleString('en-US')}`);
      console.log(`    Current price should be: Rp ${currentPriceIDR.toLocaleString('en-US')}`);

      // Check if the stored values are already huge (indicating they were already converted)
      if (holding.purchase_price > 100000 && holding.currency === 'USD') {
        console.log(`    ⚠️  WARNING: Purchase price (${holding.purchase_price}) is > 100,000`);
        console.log(`    This suggests the purchase_price field may already contain IDR values`);
        console.log(`    which would cause double conversion when currency is 'USD'`);
      }

      console.log('');
    }

    console.log('=== ANALYSIS ===');
    console.log('If purchase_price values are very large (like >100,000) but currency is "USD",');
    console.log('this indicates the values were already converted to IDR in the database.');
    console.log('When the UI applies convertToIDR() to these values with currency="USD",');
    console.log('it causes double conversion, resulting in excessively large IDR values.');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
})();
