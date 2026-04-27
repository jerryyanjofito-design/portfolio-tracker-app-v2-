import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Log environment variable status
console.log('=== Supabase Client Initialization ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'UNDEFINED');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'UNDEFINED');
console.log('Supabase URL is valid:', !!supabaseUrl && supabaseUrl !== 'your_supabase_url_here');
console.log('Supabase Key is valid:', !!supabaseAnonKey);
console.log('=====================================');

// Only create client if both credentials are provided
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✓ Supabase client initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize Supabase client:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
} else {
  console.warn('✗ Supabase client not initialized - missing credentials');
  if (!supabaseUrl) console.warn('- Missing: NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.warn('- Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (supabaseUrl === 'your_supabase_url_here') console.warn('- Supabase URL not updated from placeholder');
}

export { supabase };
