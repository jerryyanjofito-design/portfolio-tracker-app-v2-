// Migration script to fix purchase_price values in database
// Problem: purchase_price values are already in IDR but currency is set to 'USD'
// Solution: Convert purchase_price values back to USD for crypto holdings

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

async function main() {
  console.log('=== FIXING PURCHASE PRICE VALUES IN DATABASE ===\n');

  try {
    // Fetch crypto holdings
    const { data, error } = await client
      .from('holdings')
      .select('id, ticker, type, shares, purchase_price, current_price, currency')
      .eq('type', 'crypto');

    if (error) {
      console.error('Database error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No crypto holdings found');
      return;
    }

    console.log(`Found ${data.length} crypto holdings\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const holding of data) {
      console.log(`=== ${holding.ticker} ===`);
      console.log(`  Current purchase_price: ${holding.purchase_price}`);
      console.log(`  Current currency: ${holding.currency}`);

      // Check if purchase_price needs fixing (already in IDR but currency is USD)
      const needsFix = holding.currency === 'USD' && holding.purchase_price > 100000;

      if (needsFix) {
        console.log(`  ✗ NEEDS FIX: purchase_price appears to be in IDR but currency is USD`);

        // Convert purchase_price from IDR back to USD
        const purchasePriceUSD = holding.purchase_price / 17124; // Divide by USD/IDR rate
        console.log(`  → Fix: ${holding.purchase_price} → ${purchasePriceUSD.toFixed(2)} (convert IDR → USD)`);

        // Update holding with corrected purchase_price
        const { error: updateError } = await client
          .from('holdings')
          .update({
            purchase_price: purchasePriceUSD
          })
          .eq('id', holding.id);

        if (updateError) {
          console.error(`✗ Failed to update ${holding.ticker}:`, updateError);
        } else {
          console.log(`✓ Updated ${holding.ticker} purchase_price to ${purchasePriceUSD.toFixed(2)} USD`);
          fixedCount++;
        }
      } else {
        console.log(`  ✓ SKIP: purchase_price value is correct`);
        skippedCount++;
      }

      console.log('');
    }

    console.log('=== PURCHASE PRICE FIX SUMMARY ===');
    console.log(`Total crypto holdings: ${data.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('==================================');

  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
