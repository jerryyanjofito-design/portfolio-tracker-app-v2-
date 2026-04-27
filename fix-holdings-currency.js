// Load environment variables
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
  console.log('=== HOLDINGS CURRENCY FIX ===');
  console.log('Fetching all holdings to check currency values...');

  // Fetch all holdings
  const { data, error } = await client
    .from('holdings')
    .select('*');

  if (error) {
    console.error('Database error:', error);
    return;
  }

  console.log(`Found ${data.length} holdings total`);
  console.log('');

  let fixedCount = 0;
  let skippedCount = 0;

  for (const holding of data) {
    console.log(`\nChecking: ${holding.ticker} (${holding.type})`);
    console.log(`  Current price: ${holding.current_price}`);
    console.log(`  Current currency: ${holding.currency}`);

    const needsFix = shouldFixCurrency(holding);

    if (needsFix) {
      console.log('  ✗ NEEDS FIX: Incorrect currency detected');

      const correctCurrency = getCorrectCurrency(holding);
      console.log(`  → Fix: ${holding.currency} → ${correctCurrency}`);

      // Update holding with correct currency
      const { error: updateError } = await client
        .from('holdings')
        .update({
          currency: correctCurrency
        })
        .eq('id', holding.id);

      if (updateError) {
        console.error(`✗ Failed to update ${holding.ticker}:`, updateError);
      } else {
        console.log(`✓ Updated ${holding.ticker} currency to ${correctCurrency}`);
        fixedCount++;
      }
    } else {
      console.log('  ✓ SKIP: Currency is correct');
      skippedCount++;
    }
  }

  console.log('\n=== CURRENCY FIX SUMMARY ===');
  console.log(`Total holdings: ${data.length}`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log('================================');
}

function shouldFixCurrency(holding) {
  // Crypto should always be USD
  if (holding.type === 'crypto' && holding.currency !== 'USD') {
    return true;
  }

  // US stocks/ETFs should be USD
  if ((holding.type === 'stock' || holding.type === 'etf') &&
      holding.currency === 'USD' &&
      !holding.ticker.includes('.SI')) {
    return true;
  }

  // Singapore stocks/ETFs should be SGD
  if ((holding.type === 'stock' || holding.type === 'etf') &&
      holding.ticker.includes('.SI') &&
      holding.currency !== 'SGD') {
    return true;
  }

  // Indonesian stocks/ETFs should be IDR
  if ((holding.type === 'stock' || holding.type === 'etf') &&
      holding.ticker.includes('.JK') &&
      holding.currency !== 'IDR') {
    return true;
  }

  return false;
}

function getCorrectCurrency(holding) {
  if (holding.type === 'crypto') return 'USD';
  if (holding.ticker.includes('.JK')) return 'IDR';
  if (holding.ticker.includes('.SI')) return 'SGD';
  if (holding.type === 'stock' || holding.type === 'etf') {
    if (!holding.ticker.includes('.')) return 'USD';
    return holding.currency; // Keep existing if uncertain
  }
  return holding.currency;
}

main().catch(console.error);
