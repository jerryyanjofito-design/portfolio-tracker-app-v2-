// Test environment variable loading with dotenv
const path = require('path');
require('dotenv').config();

console.log('=== DOTENV LOADING TEST ===');
console.log('Working directory:', __dirname);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('Key value:', process.env.GEMINI_API_KEY || 'UNDEFINED');
console.log('Key length:', process.env.GEMINI_API_KEY?.length || 0);

if (process.env.GEMINI_API_KEY) {
  console.log('✅ SUCCESS: Environment variables loaded with dotenv!');
  console.log('Key starts with AIza:', process.env.GEMINI_API_KEY.startsWith('AIza'));
  console.log('API Key:', process.env.GEMINI_API_KEY);
} else {
  console.log('❌ FAILURE: Environment variables not loaded');
}
