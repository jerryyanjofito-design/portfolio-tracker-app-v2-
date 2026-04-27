const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('=== CHECKING CRYPTO DATA ===');
console.log('Connecting to database...');

async function checkCryptoHolding(ticker: string) {
  console.log(`\nChecking ${ticker}:`);

  const { data, error } = await supabase
    .from('holdings')
    .select('id, ticker, type, shares, purchase_price, current_price, currency')
    .eq('ticker', ticker)
    .single();

  if (error) {
    console.error('Database error:', error);
    return;
  }

  if (!data) {
    console.log('No holding found');
    return;
  }

  console.log('Holding found:');
  console.log('  Ticker:', data.ticker);
  console.log('  Type:', data.type);
  console.log('  Shares:', data.shares);
  console.log('  Purchase price:', data.purchase_price, data.currency);
  console.log('  Current price:', data.current_price, data.currency);
  console.log('  Currency:', data.currency);
  console.log('----------------');

  // Check for price anomalies
  if (data.type === 'crypto') {
    const purchasePrice = data.purchase_price;
    const currentPrice = data.current_price;
    const currency = data.currency;

    console.log('Price analysis:');

    // Check if purchase price is in suspicious range
    if (currency === 'USD') {
      if (purchasePrice < 0.01 || purchasePrice > 10000) {
        console.warn('⚠️ Suspicious USD purchase price:', purchasePrice);
      }
      if (currentPrice < 0.01 || currentPrice > 10000) {
        console.warn('⚠️ Suspicious USD current price:', currentPrice);
      }
    } else if (currency === 'IDR') {
      if (purchasePrice < 1000 || currentPrice > 100000000) {
        console.warn('⚠️ Suspicious IDR purchase price:', purchasePrice);
      }
      if (currentPrice < 1000 || currentPrice > 100000000) {
        console.warn('⚠️ Suspicious IDR current price:', currentPrice);
      }
    }

    // Check for decimal point issues
    const expectedPriceIDR = currency === 'USD' ? purchasePrice * 17124 : purchasePrice;
    const actualPriceIDR = currency === 'IDR' ? currentPrice : currentPrice * 17124;

    console.log('Expected IDR price:', expectedPriceIDR);
    console.log('Actual IDR price:', actualPriceIDR);

    if (Math.abs(actualPriceIDR - expectedPriceIDR) > 0.01) {
      console.warn('⚠️ Price mismatch detected!');
      console.warn('  Expected:', expectedPriceIDR, currency);
      console.warn('  Actual:', actualPriceIDR, currency);
    } else {
      console.log('✅ Price in correct range');
    }

    console.log('======================');
  }
}

// Check multiple crypto holdings
const cryptoTickers = ['ETH', 'BTC', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'MATIC', 'USDT', 'USDC', 'BNB', 'XLM', 'ALGO', 'UNI', 'VET', 'FIL', 'AAVE', 'ATOM', 'EOS', 'TRX', 'XTZ', 'BCH', 'NEO', 'ICP'];

async function checkAllCryptoHoldings() {
  console.log('\n=== CHECKING ALL CRYPTO HOLDINGS ===');

  for (const ticker of cryptoTickers) {
    await checkCryptoHolding(ticker);
  }

  console.log('\n=== CHECK COMPLETE ===');
  console.log('Checked', cryptoTickers.length, 'crypto holdings');
  console.log('=================');
}

// Run the check
checkAllCryptoHoldings().catch(error => {
  console.error('Error checking crypto data:', error);
  process.exit(1);
});
