// Test Gemini API specifically
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
  console.log('=== GEMINI API TEST ===\n');

  // Check API key
  console.log('Step 1: Checking API key...');
  console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');

  if (!process.env.GEMINI_API_KEY) {
    console.log('\n❌ API key not configured!');
    return;
  }

  // Test simple API call
  console.log('\nStep 2: Testing Gemini API call...');
  console.log('  Model:', 'gemini-pro');
  console.log('  Endpoint:', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-pro',
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello, this is a test message.' }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7
        }
      })
    });

    console.log('  Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('  ❌ Gemini API failed!');
      console.log('  Error details:', JSON.stringify(errorData, null, 2));

      // Check for specific error types
      if (errorData.error) {
        const error = errorData.error;
        console.log('  Error code:', error.code);
        console.log('  Error message:', error.message);
        console.log('  Error status:', error.status);

        // Check for quota errors
        if (error.code === 429 || error.status === 'RESOURCE_EXHAUSTED') {
          console.log('  ⚠️  This might be a quota/rate limit issue');
        }
      }
    } else {
      const data = await response.json();
      console.log('  ✅ Gemini API successful!');
      console.log('  Response structure:', JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts?.[0]?.text;
        console.log('  AI Response:', content?.substring(0, 200) + '...');
      } else {
        console.log('  ⚠️  No content in response');
        console.log('  Full response:', JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.log('  ❌ Network or parsing error:', error.message);
  }

  console.log('\n=== TEST COMPLETE ===\n');
})();
