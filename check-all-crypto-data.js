// Simple check of all crypto data in database

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
  console.log('=== ALL CRYPTO DATA IN DATABASE ===\n');

  try {
    // Fetch all holdings data
    const { data, error } = await client
      .from('holdings')
      .select('*')
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
      console.log('Full data:', JSON.stringify(holding, null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();
