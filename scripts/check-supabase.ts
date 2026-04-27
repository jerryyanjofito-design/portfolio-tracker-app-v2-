import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Supabase Connection Test ===\n');
console.log('Supabase URL:', supabaseUrl ? '✓ Configured' : '✗ Missing');
console.log('Anon Key:', supabaseAnonKey ? '✓ Configured' : '✗ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n✗ ERROR: Supabase credentials not configured in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  try {
    console.log('\n🔍 Checking Supabase connection...');

    // Test connection by checking tables
    const { data: holdingsData, error: holdingsError } = await supabase
      .from('holdings')
      .select('*')
      .limit(1);

    const { data: cashData, error: cashError } = await supabase
      .from('cash_accounts')
      .select('*')
      .limit(1);

    console.log('\n📊 Holdings Table:');
    if (holdingsError) {
      console.log('  ✗ Error:', holdingsError.message);
      console.log('  💡 This likely means the table doesn\'t exist');
    } else {
      console.log('  ✓ Table exists');
      console.log('  📋 Sample data:', holdingsData);
    }

    console.log('\n💰 Cash Accounts Table:');
    if (cashError) {
      console.log('  ✗ Error:', cashError.message);
      console.log('  💡 This likely means the table doesn\'t exist');
    } else {
      console.log('  ✓ Table exists');
      console.log('  📋 Sample data:', cashData);
    }

    // Get table counts
    const { count: holdingsCount } = await supabase
      .from('holdings')
      .select('*', { count: 'exact', head: true });

    const { count: cashCount } = await supabase
      .from('cash_accounts')
      .select('*', { count: 'exact', head: true });

    console.log('\n📈 Data Summary:');
    console.log(`  Holdings: ${holdingsCount} records`);
    console.log(`  Cash Accounts: ${cashCount} records`);

    if (holdingsCount === 0 && cashCount === 0) {
      console.log('\n💡 Tables exist but are empty. Add some data in the app!');
    }

  } catch (error: any) {
    console.log('\n✗ Connection failed:', error.message);
    if (error.message && error.message.includes('Invalid supabaseUrl')) {
      console.log('  💡 Check your NEXT_PUBLIC_SUPABASE_URL in .env.local');
    }
    if (error.message && error.message.includes('JWT')) {
      console.log('  💡 Check your NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    }
  }
}

checkSupabase();
