// Test AI API integration
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
  console.log('=== AI API INTEGRATION TEST ===\n');

  // Test 1: Check environment variables
  console.log('Step 1: Checking environment variables...');
  console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log('\n❌ Neither API key is configured!');
    console.log('Please add API keys to .env.local file:');
    console.log('  ANTHROPIC_API_KEY=your_anthropic_key_here');
    console.log('  GEMINI_API_KEY=your_gemini_key_here');
    return;
  }

  // Test 2: Try simple API call
  console.log('\nStep 2: Testing Anthropic API call...');

  const testMessages = [
    { role: 'user', content: 'Hello, this is a test message.' }
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: testMessages
      })
    });

    console.log('  Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('  ✗ Anthropic API failed!');
      console.log('  Error:', JSON.stringify(errorData, null, 2));
    } else {
      const data = await response.json();
      console.log('  ✓ Anthropic API successful!');
      console.log('  Response:', data.content[0]?.text?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('  ✗ API call failed with error:', error.message);
  }

  console.log('\n=== TEST COMPLETE ===');
})();
