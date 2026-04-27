const { createClient } = require('@supabase/supabase-js');
const client = createClient('https://nibaainsfwccdjervro.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaWJhYWluc2Z3Y2NkamVydnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Mjg4NjcsImV4cCI6MjA5MTEwNDg2N30.zc4EN_XaYXMMMkMiDzQEBoUKHBX0jAtUvukd-9q-3MA');

async function main() {
  const { data, error } = await client.from('holdings').select('ticker, current_price, currency').eq('type', 'crypto').limit(5);
  if (error) {
    console.error('Database error:', error);
    return;
  }
  console.log('CRYPTO HOLDINGS:');
  for (const h of data) {
    console.log(`${h.ticker}: price=${h.current_price}, currency=${h.currency}`);
  }
}

main().catch(console.error);
