// Test environment variables in Next.js API route context
const path = require('path');
const fs = require('fs');

// Read .env.local file (for reference)
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('=== .env.local FILE CONTENT ===');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      console.log(`${key.trim()} = ${value?.substring(0, 20)}...`);
    }
  });
  console.log('=== END .env.local FILE ===\n');
}

// Test process.env directly (no imports to avoid module issues)
console.log('=== RUNTIME ENV TEST ===');
console.log('process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('Key value:', process.env.GEMINI_API_KEY || 'UNDEFINED');
console.log('Key length:', process.env.GEMINI_API_KEY?.length || 0);

// Test other environment variables
console.log('process.env.OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('process.env.ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('process.env.NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✓' : 'NOT SET ✗');

console.log('\n=== CONCLUSION ===');
if (process.env.GEMINI_API_KEY) {
  console.log('✅ SUCCESS: Environment variables ARE being loaded at runtime!');
  console.log('Key length:', process.env.GEMINI_API_KEY.length);
  console.log('Key starts with AIza:', process.env.GEMINI_API_KEY.startsWith('AIza'));
} else {
  console.log('❌ FAILURE: Environment variables NOT loaded at runtime');
  console.log('Check: Next.js server restart or configuration');
}
