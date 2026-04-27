// Test Gemini 2.5 Flash API
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
  console.log('=== GEMINI 2.5 FLASH API TEST ===\n');

  // Check API key
  console.log('Step 1: Checking Gemini API key...');
  console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');

  if (!process.env.GEMINI_API_KEY) {
    console.log('\n❌ Gemini API key not configured!');
    console.log('Please add GEMINI_API_KEY to your .env.local file');
    return;
  }

  // Validate key format
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('  Key format check:', apiKey.startsWith('AIza') ? 'VALID FORMAT ✓' : 'INVALID FORMAT ✗');

  // Test API call
  console.log('\nStep 2: Testing Gemini 2.5 Flash API...');
  console.log('  Model:', 'gemini-2.5-flash');
  console.log('  Endpoint:', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello! This is a test message.' }]
        }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.7
        }
      })
    });

    console.log('  Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('  ❌ Gemini Flash API failed!');
      console.log('  Error details:', JSON.stringify(errorData, null, 2));

      // Check for specific error types
      if (errorData.error) {
        const error = errorData.error;
        console.log('  Error code:', error.code);
        console.log('  Error message:', error.message);
        console.log('  Error status:', error.status);

        // Check for common errors
        if (error.code === 'API_KEY_INVALID' || error.message?.includes('API key not valid')) {
          console.log('  ⚠️  Invalid API key - check your key format');
        } else if (error.code === 'QUOTA_EXCEEDED' || error.message?.includes('quota')) {
          console.log('  ⚠️  Quota exceeded - check your Google Cloud billing');
        } else if (error.code === 'MODEL_NOT_FOUND') {
          console.log('  ⚠️  Model not found - gemini-2.0-flash-exp may not be available');
        } else if (error.status === 429) {
          console.log('  ⚠️  Rate limit exceeded - try again later');
        }
      }
    } else {
      const data = await response.json();
      console.log('  ✅ Gemini Flash API successful!');
      console.log('  Response structure:', JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts?.[0]?.text;
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