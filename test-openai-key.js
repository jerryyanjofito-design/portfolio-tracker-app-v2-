// Test OpenAI API key configuration
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
  console.log('=== OPENAI API KEY TEST ===\n');

  // Check API key
  console.log('Step 1: Checking OpenAI API key...');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET ✓' : 'NOT SET ✗');

  if (!process.env.OPENAI_API_KEY) {
    console.log('\n❌ OpenAI API key not configured!');
    return;
  }

  // Validate key format
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('  Key format check:', apiKey.startsWith('sk-') ? 'VALID FORMAT ✓' : 'INVALID FORMAT ✗');
  console.log('  Key type:', apiKey.startsWith('sk-proj-') ? 'Project Key (Recommended)' : 'Standard Key');

  // Test API call
  console.log('\nStep 2: Testing OpenAI API connection...');
  console.log('  Model:', 'gpt-3.5-turbo');
  console.log('  Endpoint:', 'https://api.openai.com/v1/chat/completions');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello! This is a test message.' }
        ],
        max_tokens: 50
      })
    });

    console.log('  Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('  ❌ OpenAI API failed!');
      console.log('  Error details:', JSON.stringify(errorData, null, 2));

      // Check for specific error types
      if (errorData.error) {
        const error = errorData.error;
        console.log('  Error code:', error.code);
        console.log('  Error message:', error.message);
        console.log('  Error type:', error.type);

        // Check for common errors
        if (error.code === 'invalid_api_key') {
          console.log('  ⚠️  Invalid API key - check your key format');
        } else if (error.code === 'insufficient_quota') {
          console.log('  ⚠️  Insufficient quota - add credits to your OpenAI account');
        } else if (error.code === 'model_not_found') {
          console.log('  ⚠️  Model not found - gpt-4 may not be available with your plan');
        } else if (error.code === 'rate_limit_exceeded') {
          console.log('  ⚠️  Rate limit exceeded - try again later');
        }
      }
    } else {
      const data = await response.json();
      console.log('  ✅ OpenAI API successful!');
      console.log('  Response structure:', JSON.stringify(data, null, 2));

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        console.log('  AI Response:', content?.substring(0, 100) + '...');
      } else {
        console.log('  ⚠️  No content in response');
      }
    }
  } catch (error) {
    console.log('  ❌ Network or parsing error:', error.message);
  }

  console.log('\n=== TEST COMPLETE ===\n');
})();