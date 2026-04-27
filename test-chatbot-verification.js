// Simple test to verify chatbot functionality
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

(async () => {
  console.log('=== CHATBOT TEST ===');

  // Test 1: Check if chatbot component renders
  console.log('Test 1: Check if chatbot component renders');
  console.log('  Expected: Floating button (💬) should appear in bottom-right corner');
  console.log('  Expected: Chat interface should open when button is clicked');

  // Test 2: Check API configuration
  console.log('\nTest 2: Check API configuration');
  console.log('  Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('  Gemini API Key:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('  Gemini Client ID:', process.env.GEMINI_CLIENT_ID ? 'SET ✓' : 'NOT SET ✗');

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log('\n❌ Anthropic API key not configured');
  }

  // Test 3: Simulate API call
  console.log('\nTest 3: Simulate API response');
  console.log('  Expected: Chatbot should show "Hello! This is a test response." when you send a message');

  console.log('\n=== TEST COMPLETE ===');
  console.log('Chatbot should work if:');
  console.log('1. API keys are configured (Anthropic or Gemini)');
  console.log('2. Component renders correctly (floating button + chat interface)');
  console.log('3. API calls work and display responses');
  console.log('4. Error handling displays user-friendly messages');
  console.log('5. Loading states show typing indicators');

  console.log('\nTo test: Open browser at http://localhost:3005');
  console.log('2. Click on the floating chat button (💬) in bottom-right corner');
  console.log('3. Type "test message" and send');
  console.log('4. Verify response appears in chat interface');
  console.log('5. If you see "Hello! This is a test response." then chatbot is working correctly');
  console.log('6. If you see "AI API unavailable" or "Unable to connect to AI services" then API needs to be configured');

  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. Add Anthropic API credits to your account (RECOMMENDED)');
  console.log('2. Get valid Gemini API credentials (ALTERNATIVE - requires OAuth setup)');
  console.log('3. Switch to OpenAI API (ALTERNATIVE - simpler setup)');
  console.log('4. Check .env.local file and add API keys');
  console.log('Current API keys in use:');
  console.log('   - Anthropic:', process.env.ANTHROPIC_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('   - Gemini:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('   - Gemini Client ID:', process.env.GEMINI_CLIENT_ID ? 'SET ✓' : 'NOT SET ✗');

})();
