// Verification script to check if average price calculations would be correct
// after fixing the purchase_price values in the database

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

// Simulate the HoldingsTable conversion logic
const FX_RATES = {
  USD_TO_IDR: 17124,
  SGD_TO_IDR: 12473
};

function convertToIDR(amount, fromCurrency) {
  switch (fromCurrency) {
    case 'IDR':
      return amount;
    case 'SGD':
      return amount * FX_RATES.SGD_TO_IDR;
    case 'USD':
      return amount * FX_RATES.USD_TO_IDR;
    default:
      throw new Error(`Unsupported currency: ${fromCurrency}`);
  }
}

function formatIDR(amount) {
  return 'Rp ' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

(async () => {
  console.log('=== VERIFYING AVERAGE PRICE CALCULATION FIX ===\n');

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

    console.log(`=== ${data.length} Crypto Holdings - Average Price Display Test ===\n`);

    for (const holding of data) {
      console.log(`=== ${holding.ticker} ===`);

      // Simulate HoldingsTable calculation
      const purchasePriceNative = holding.purchase_price;
      const currentPriceNative = holding.current_price;
      const currency = holding.currency;

      // Convert to IDR for display (this is what HoldingsTable does)
      const purchasePriceIDR = convertToIDR(purchasePriceNative, currency);
      const currentPriceIDR = convertToIDR(currentPriceNative, currency);

      console.log(`Database values:`);
      console.log(`  purchase_price: ${holding.purchase_price} ${currency}`);
      console.log(`  current_price: ${holding.currentPrice} ${currency}`);

      console.log(`UI Display (what will be shown):`);
      console.log(`  Avg Price (IDR): ${formatIDR(purchasePriceIDR)}`);
      console.log(`  Current Price (IDR): ${formatIDR(currentPriceIDR)}`);

      // Check if values are reasonable
      const isAvgPriceReasonable = purchasePriceIDR > 1000 && purchasePriceIDR < 1000000000000;

      if (isAvgPriceReasonable) {
        console.log(`  ✅ Average price is within reasonable range`);
      } else {
        console.log(`  ❌ Average price is NOT within reasonable range - still broken!`);
      }

      console.log('');
    }

    console.log('=== SUMMARY ===');
    console.log('The HoldingsTable will display the average prices shown above.');
    console.log('If all values show ✅ (reasonable range), the issue is fixed.');
    console.log('If any show ❌ (unreasonable range), there may still be issues.');

  } catch (error) {
    console.error('Error:', error);
  }
})();
