// Test environment variable reading at runtime
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

// Test actual runtime environment variable reading
console.log('=== RUNTIME ENV TEST ===');
console.log('process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('Key value:', process.env.GEMINI_API_KEY || 'UNDEFINED');

// Test if the AI function can read the variable
const aiAdvisor = require('./lib/aiAdvisor');

// Mock the function call to test environment access
console.log('\n=== TESTING AI ADVISOR ENV ACCESS ===');
console.log('Mocking callGeminiFlashAPI function...');

// Test environment variable reading in the context where it would be called
const mockContext = { holdings: [], cashAccounts: [], assetAccounts: [] };

// Try to call the Gemini Flash API function
(async () => {
  try {
    const result = await aiAdvisor.callGeminiFlashAPI(
      [{ role: 'user', content: 'test message', timestamp: new Date(), id: 'test1' }],
      mockContext
    );

    if (result.success) {
      console.log('✅ callGeminiFlashAPI CAN read process.env.GEMINI_API_KEY');
      console.log('API Response received successfully');
    } else {
      console.log('❌ callGeminiFlashAPI CANNOT read process.env.GEMINI_API_KEY');
      console.log('Error returned:', result.error);
    }
  } catch (error) {
    console.log('❌ Exception occurred:', error.message);
  }
})();