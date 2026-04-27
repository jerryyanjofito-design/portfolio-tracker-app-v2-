import { Holding, CashAccount, AssetAccount } from './types';
import { FX_RATES, convertToIDR } from './fxRates';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
  usedGemini?: boolean;
  needsAuth?: boolean;
  retryWithOpenAI?: boolean;
  retryWithAnthropic?: boolean;
  retryWithGemini?: boolean;
}

const GEMINI_FLASH_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_MODEL = 'gemini-pro';
const GEMINI_CLIENT_ID = process.env.GEMINI_CLIENT_ID || '';
const GEMINI_CLIENT_SECRET = process.env.GEMINI_CLIENT_SECRET || '';
const GEMINI_PROJECT_ID = process.env.GEMINI_PROJECT_ID || '';

// OAuth token storage (localStorage)
const TOKEN_STORAGE_KEY = 'gemini_oauth_token';
const TOKEN_EXPIRY_KEY = 'gemini_token_expiry';

// System prompt for portfolio advisor
const SYSTEM_PROMPT = `You are a professional portfolio advisor with access to the user's current holdings. Your role is to provide data-driven, analytical investment insights.

You have full context of the user's portfolio including:
- Asset names, tickers, types (stock/crypto/etf)
- Shares held
- Average buy prices (IDR and USD)
- Current prices (IDR and USD)
- Total values (IDR and USD)
- Profit/Loss amounts and percentages
- Overall portfolio composition

Your capabilities:
1. Analyze portfolio performance and identify best/worst performers
2. Provide allocation breakdowns and risk assessments
3. Give professional commentary on existing positions
4. Compare and discuss other investment options when asked
5. Explain financial concepts clearly
6. Maintain professional, concise, data-driven tone
7. Base all advice on the provided portfolio data
8. Avoid generic advice - make recommendations specific to their holdings

Style guidelines:
- Be direct and analytical
- Use concrete numbers from the portfolio data
- Avoid fluff and overly enthusiastic language
- When uncertain, acknowledge it
- Maintain professional objectivity
- Provide actionable insights`;

// OAuth token storage (localStorage)

// OAuth helper functions
function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const now = Date.now();
      if (data.expiry && data.expiry > now) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        return null;
      }
      return data.token;
    }
  }
  return null;
}

function setStoredToken(token: string, expiryInMinutes: number = 60): void {
  if (typeof window !== 'undefined') {
    const expiry = Date.now() + (expiryInMinutes * 60 * 1000);
    const data = {
      token: token,
      expiry: expiry
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }
}

function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

async function getAccessToken(): Promise<string> {
  const existingToken = getStoredToken();
  if (existingToken) {
    return existingToken;
  }

  if (!GEMINI_CLIENT_ID || !GEMINI_CLIENT_SECRET || !GEMINI_PROJECT_ID) {
    throw new Error('Gemini OAuth credentials not configured');
  }

  try {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/oauth2.0/token`;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: '4/0AfFfZKq7QhEJMUA4BtsgdkIVgcAIKa5UqwgYpuJujGOBECCc2VLv_7pIuvG95IyyoWpahajIC4n6ZQB_g-tqP8agAA',
        client_id: GEMINI_CLIENT_ID,
        client_secret: GEMINI_CLIENT_SECRET,
        redirect_uri: window.location.origin
      }).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini OAuth token request failed:', errorData);
      throw new Error(`OAuth failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;

    setStoredToken(accessToken, 60);
    return accessToken;

  } catch (error) {
    console.error('Gemini OAuth authentication failed:', error);
    throw new Error('Failed to get Gemini access token');
  }
}

// Client-side OAuth flow
function triggerOAuthFlow(): void {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: GEMINI_CLIENT_ID,
    redirect_uri: window.location.origin,
    scope: 'https://www.googleapis.com/auth/generative-language',
    state: crypto.getRandomValues(new Uint8Array(16))[0].toString()
  });

  window.location.href = `${authUrl}?${params.toString()}`;
}

function createPortfolioContext(
  holdings: Holding[],
  cashAccounts?: CashAccount[],
  assetAccounts?: AssetAccount[]
): string {
  const formattedHoldings = holdings.map(h => {
    const avgPriceIDR = convertToIDR(h.purchasePrice, h.currency);
    const avgPriceUSD = h.currency === 'USD' ? h.purchasePrice : avgPriceIDR / FX_RATES.USD_TO_IDR;
    const currentPriceIDR = convertToIDR(h.currentPrice, h.currency);
    const currentPriceUSD = h.currency === 'USD' ? h.currentPrice : currentPriceIDR / FX_RATES.USD_TO_IDR;
    const totalValueIDR = h.shares * currentPriceIDR;
    const totalValueUSD = h.shares * currentPriceUSD;
    const costBasisIDR = h.shares * avgPriceIDR;
    const costBasisUSD = h.shares * avgPriceUSD;
    const plIDR = totalValueIDR - costBasisIDR;
    const plUSD = totalValueUSD - costBasisUSD;
    const plPercent = costBasisUSD > 0 ? (plUSD / costBasisUSD) * 100 : 0;

    return {
      ticker: h.ticker,
      name: h.name,
      type: h.type,
      shares: h.shares,
      avgPriceIDR: Math.round(avgPriceIDR),
      avgPriceUSD: parseFloat(avgPriceUSD.toFixed(2)),
      currentPriceIDR: Math.round(currentPriceIDR),
      currentPriceUSD: parseFloat(currentPriceUSD.toFixed(2)),
      totalValueIDR: Math.round(totalValueIDR),
      totalValueUSD: parseFloat(totalValueUSD.toFixed(2)),
      plIDR: Math.round(plIDR),
      plUSD: parseFloat(plUSD.toFixed(2)),
      plPercent: parseFloat(plPercent.toFixed(2))
    };
  });

  const totalPortfolioValueIDR = formattedHoldings.reduce((sum, h) => sum + h.totalValueIDR, 0);
  const totalPortfolioValueUSD = totalPortfolioValueIDR / FX_RATES.USD_TO_IDR;

  let totalCashIDR = 0;
  let totalCashUSD = 0;

  if (cashAccounts && cashAccounts.length > 0) {
    cashAccounts.forEach(account => {
      const cashValue = account.balance ?? account.amount ?? 0;
      if (account.currency === 'IDR') {
        totalCashIDR += cashValue;
        totalCashUSD += cashValue / FX_RATES.USD_TO_IDR;
      } else if (account.currency === 'USD') {
        totalCashUSD += cashValue;
        totalCashIDR += cashValue * FX_RATES.USD_TO_IDR;
      } else if (account.currency === 'SGD') {
        const cashIDR = cashValue * FX_RATES.SGD_TO_IDR;
        totalCashIDR += cashIDR;
        totalCashUSD += cashIDR / FX_RATES.USD_TO_IDR;
      }
    });
  }

  let totalAssetValueIDR = 0;
  if (assetAccounts && assetAccounts.length > 0) {
    assetAccounts.forEach(asset => {
      const assetIDR = convertToIDR(asset.value, 'USD');
      totalAssetValueIDR += assetIDR;
    });
  }

  const totalNetWorthIDR = totalPortfolioValueIDR + totalCashIDR + totalAssetValueIDR;
  const totalNetWorthUSD = totalNetWorthIDR / FX_RATES.USD_TO_IDR;

  return JSON.stringify({
    totalHoldings: formattedHoldings.length,
    totalPortfolioValueIDR: Math.round(totalPortfolioValueIDR),
    totalPortfolioValueUSD: parseFloat(totalPortfolioValueUSD.toFixed(2)),
    totalCashIDR: Math.round(totalCashIDR),
    totalCashUSD: parseFloat(totalCashUSD.toFixed(2)),
    totalAssetValueIDR: Math.round(totalAssetValueIDR),
    totalNetWorthIDR: Math.round(totalNetWorthIDR),
    totalNetWorthUSD: parseFloat(totalNetWorthUSD.toFixed(2)),
    holdings: formattedHoldings,
    lastUpdated: new Date().toISOString()
  }, null, 2);
}

async function callGeminiFlashAPI(
  messages: ChatMessage[],
  portfolioContext: string
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  console.log('Gemini API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWithAIza: apiKey?.startsWith('AIza') || false
  });

  if (!apiKey) {
    return {
      success: false,
      message: '',
      error: 'GEMINI_API_KEY not configured'
    };
  }

  try {
    const conversationText = messages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n');

    const prompt = `${SYSTEM_PROMPT}\n\nHere is my current portfolio data:\n\n${portfolioContext}\n\nConversation history:\n${conversationText}`;

    const response = await fetch(`${GEMINI_FLASH_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini Flash API error:', response.status, errorData);

      if (response.status === 429 || response.status >= 500) {
        return { success: false, message: '', error: 'Rate limited or service unavailable', retryWithOpenAI: true };
      }

      return {
        success: false,
        message: '',
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts?.[0]?.text || '';

      return {
        success: true,
        message: content,
        usedGemini: true
      };
    }

    return {
      success: false,
      message: '',
      error: 'No content in Gemini Flash response'
    };

  } catch (error) {
    console.error('Gemini Flash API call failed:', error);
    return {
      success: false,
      message: '',
      error: 'Network or parsing error',
      retryWithOpenAI: true
    };
  }
}

async function callOpenAIAPI(
  messages: ChatMessage[],
  portfolioContext: string
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  console.log('OpenAI API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWithSk: apiKey?.startsWith('sk-') || false
  });

  if (!apiKey) {
    return {
      success: false,
      message: '',
      error: 'OPENAI_API_KEY not configured'
    };
  }

  try {
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Here is my current portfolio data:\n\n${portfolioContext}` }
    ];

    messages.forEach(msg => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: conversationMessages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);

      if (response.status === 429 || response.status >= 500) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.code === 'insufficient_quota') {
          return { success: false, message: '', error: 'OpenAI quota exceeded - add credits to your account', retryWithAnthropic: true };
        }
        return { success: false, message: '', error: 'Rate limited or service unavailable', retryWithAnthropic: true };
      }

      return {
        success: false,
        message: '',
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return {
        success: true,
        message: data.choices[0].message.content
      };
    }

    return {
      success: false,
      message: '',
      error: 'No content in response'
    };

  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return {
      success: false,
      message: '',
      error: 'Network or parsing error',
      retryWithAnthropic: true
    };
  }
}

async function callAnthropicAPI(
  messages: ChatMessage[],
  portfolioContext: string
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log('Anthropic API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWithSk: apiKey?.startsWith('sk-') || false
  });

  if (!apiKey) {
    return {
      success: false,
      message: '',
      error: 'ANTHROPIC_API_KEY not configured'
    };
  }

  try {
    const conversationMessages = [
      { role: 'user', content: `Here is my current portfolio data:\n\n${portfolioContext}` }
    ];

    messages.forEach(msg => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: conversationMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', response.status, errorData);

      if (response.status === 429 || response.status >= 500) {
        return { success: false, message: '', error: 'Rate limited or service unavailable', retryWithGemini: true };
      }

      return {
        success: false,
        message: '',
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      return {
        success: true,
        message: data.content[0].text
      };
    }

    return {
      success: false,
      message: '',
      error: 'No content in response'
    };

  } catch (error) {
    console.error('Anthropic API call failed:', error);
    return {
      success: false,
      message: '',
      error: 'Network or parsing error',
      retryWithGemini: true
    };
  }
}

async function callGeminiAPI(
  messages: ChatMessage[],
  portfolioContext: string
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: '',
      error: 'GEMINI_API_KEY not configured'
    };
  }

  try {
    const conversationText = messages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n');

    const prompt = `${SYSTEM_PROMPT}\n\nHere is my current portfolio data:\n\n${portfolioContext}\n\nConversation history:\n${conversationText}`;

    // OAuth 2.0 authentication
    let accessToken = getStoredToken();

    if (!accessToken) {
      accessToken = await getAccessToken();
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);

      return {
        success: false,
        message: '',
        error: `Gemini API error: ${response.status}`
      };
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts?.[0]?.text || '';

      return {
        success: true,
        message: content,
        usedGemini: true
      };
    }

    return {
      success: false,
      message: '',
      error: 'No content in Gemini response'
    };

  } catch (error) {
    console.error('Gemini API call failed:', error);
    return {
      success: false,
      message: '',
      error: 'Network or parsing error'
    };
  }
}

export async function getAIResponse(
  messages: ChatMessage[],
  holdings: Holding[],
  cashAccounts?: CashAccount[],
  assetAccounts?: AssetAccount[]
): Promise<AIResponse> {
  const portfolioContext = createPortfolioContext(holdings, cashAccounts, assetAccounts);

  console.log('=== AI Advisor Request ===');
  console.log('Portfolio context created:', holdings.length, 'holdings');
  console.log('Message count:', messages.length);

  // Try Gemini Flash first (primary service - free and fast)
  const geminiFlashResponse = await callGeminiFlashAPI(messages, portfolioContext);

  if (geminiFlashResponse.success) {
    console.log('✓ Gemini Flash API response received');
    return geminiFlashResponse;
  }

  // Fallback to OpenAI if Gemini Flash fails
  console.log('⚠️  Gemini Flash failed, trying OpenAI fallback');
  const openaiResponse = await callOpenAIAPI(messages, portfolioContext);

  if (openaiResponse.success) {
    console.log('✓ OpenAI API response received');
    return openaiResponse;
  }

  // Final fallback to Anthropic if both Gemini Flash and OpenAI fail
  console.log('⚠️  Gemini Flash and OpenAI failed, trying Anthropic fallback');
  const anthropicResponse = await callAnthropicAPI(messages, portfolioContext);

  if (anthropicResponse.success) {
    console.log('✓ Anthropic API response received');
    return anthropicResponse;
  }

  console.error('✗ All APIs failed');

  // Return error from first failed provider for better user experience
  const firstFailedError = geminiFlashResponse.error || openaiResponse.error || anthropicResponse.error || 'Unknown error';

  return {
    success: false,
    message: '',
    error: firstFailedError
  };
}

export function createChatMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date()
  };
}
