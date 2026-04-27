import { Holding } from './types';
import { priceCache } from './priceCache';
import { supabase } from './supabase';
import { updateHoldingPrice } from './database';
import { FX_RATES } from './fxRates';

// API Endpoints
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Convert price to IDR based on currency
 */
function convertToIDR(price: number, currency: string): number {
  switch (currency) {
    case 'IDR':
      return price;
    case 'SGD':
      return price * FX_RATES.SGD_TO_IDR;
    case 'USD':
      return price * FX_RATES.USD_TO_IDR;
    default:
      return price;
  }
}

/**
 * Format ticker for API calls
 * Idempotent - calling multiple times produces same result
 */
function formatTickerForAPI(ticker: string, currency: string, type: string): string {
  const rawTicker = ticker.toUpperCase().trim();

  // Crypto doesn't need suffixes
  if (type === 'crypto') {
    console.log(`Fetching: ${rawTicker} → ${rawTicker} (crypto, no suffix)`);
    return rawTicker;
  }

  // Indonesian stocks (IDR) use .JK suffix - add only if not already present
  if (currency === 'IDR' && (type === 'stock' || type === 'etf')) {
    if (rawTicker.endsWith('.JK')) {
      console.log(`Fetching: ${rawTicker} → ${rawTicker} (already has .JK suffix)`);
      return rawTicker;
    }
    const jkTicker = rawTicker + '.JK';
    console.log(`API ticker: ${rawTicker} → ${jkTicker} (Indonesian)`);
    return jkTicker;
  }

  // Singapore stocks (SGD) use .SI suffix - add only if not already present
  if (currency === 'SGD' && (type === 'stock' || type === 'etf')) {
    if (rawTicker.endsWith('.SI')) {
      console.log(`Fetching: ${rawTicker} → ${rawTicker} (already has .SI suffix)`);
      return rawTicker;
    }
    const siTicker = rawTicker + '.SI';
    console.log(`Fetching: ${rawTicker} → ${siTicker} (Singapore)`);
    return siTicker;
  }

  // US stocks/ETFs (USD) use ticker as-is
  if (currency === 'USD' && (type === 'stock' || type === 'etf')) {
    console.log(`Fetching: ${rawTicker} → ${rawTicker} (US market)`);
    return rawTicker;
  }

  // Default
  console.log(`Fetching: ${rawTicker} → ${rawTicker} (no suffix)`);
  return rawTicker;
}

/**
 * Fetch crypto price from CoinGecko
 * Returns both USD and IDR prices for proper display
 * Proper conversion when IDR not available from API
 */
async function fetchCryptoPrice(ticker: string, currency: string): Promise<{ priceUSD: number | null; priceIDR: number | null } | null> {
  try {
    const formattedTicker = formatTickerForAPI(ticker, currency, 'crypto');

    // Convert common ticker symbols to CoinGecko IDs
    const tickerMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'MATIC': 'matic-network',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'XLM': 'stellar',
      'ALGO': 'algorand',
      'UNI': 'uniswap',
      'VET': 'vechain',
      'FIL': 'filecoin',
      'AAVE': 'aave',
      'ATOM': 'cosmos',
      'EOS': 'eos',
      'TRX': 'tron',
      'XTZ': 'tezos',
      'BCH': 'bitcoin-cash',
      'NEO': 'neo',
      'ICP': 'internet-computer',
      'XEM': 'nem',
      'THETA': 'theta-token'
    };

    const coinId = tickerMap[formattedTicker] || formattedTicker.toLowerCase();

    const response = await fetch(`${COINGECKO_BASE}/coins/${coinId}`);
    if (!response.ok) {
      console.error(`✗ CoinGecko HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Get USD price from CoinGecko API
    const priceUSD = data.market_data?.current_price?.usd;

    // Validate USD price (required for display)
    if (!priceUSD || isNaN(priceUSD) || priceUSD <= 0) {
      console.error(`✗ CoinGecko: Invalid USD price for ${formattedTicker}`);
      return null;
    }

    // ✅ STRICT CONTRACT: Store API prices in NATIVE CURRENCY only
    console.log(`=== API PRICE FETCH ===`);
    console.log('CoinGecko API Response:');
    console.log(`  Ticker: ${formattedTicker}`);
    console.log(`  Raw price: ${priceUSD} USD`);
    console.log(`  Currency: USD`);
    console.log(`  Expected storage: ${priceUSD} USD (native currency)`);
    console.log('=====================');

    const priceIDR = priceUSD * FX_RATES.USD_TO_IDR; // Convert to IDR for consistency
    return { priceUSD, priceIDR }; // Store converted IDR price
  } catch (error) {
    console.error(`✗ CoinGecko error for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch stock price from TwelveData
 * Note: Requires API key - using free tier
 * Returns price in IDR for consistency with portfolio base currency
 * Enhanced error handling
 */
async function fetchStockPriceTwelveData(ticker: string, currency: string): Promise<number | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
    if (!apiKey) {
      console.warn('✗ TwelveData API key not configured');
      return null;
    }

    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`
    );

    if (!response.ok) {
      console.error(`✗ TwelveData HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const priceUSD = parseFloat(data.price);

    if (!priceUSD || isNaN(priceUSD) || priceUSD <= 0) {
      console.error(`✗ TwelveData: Invalid price ${priceUSD} for ${ticker}`);
      return null;
    }

    // ✅ STRICT CONTRACT: Store API prices in NATIVE CURRENCY only
    console.log(`=== API PRICE FETCH ===`);
    console.log('TwelveData API Response:');
    console.log(`  Ticker: ${ticker}`);
    console.log(`  Raw price: ${priceUSD} USD`);
    console.log(`  Currency: USD`);
    console.log(`  Expected storage: ${priceUSD} USD (native currency)`);
    console.log('=====================');

    return priceUSD; // Store native USD price
  } catch (error) {
    console.error(`✗ TwelveData error for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch stock price from Yahoo Finance API (for IDR/SGD/USD markets)
 * Uses internal API route to avoid CORS
 * Returns price in IDR for consistency with portfolio base currency
 * Enhanced error handling for 404 and other API failures
 */
async function fetchStockPriceYahoo(ticker: string, currency: string): Promise<number | null> {
  try {
    const formattedTicker = formatTickerForAPI(ticker, currency, 'stock');
    console.log(`→ Yahoo Finance API: ${ticker} → ${formattedTicker}`);

    // Call internal API route instead of direct Yahoo Finance
    const response = await fetch(
      `/api/yahoo-price?ticker=${formattedTicker}&currency=${currency}`
    );

    if (!response.ok) {
      console.error(`✗ Yahoo Finance API HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(`✗ Yahoo Finance API error: ${data.error}`);
      return null;
    }

    let price = parseFloat(data.price);

    if (!price || isNaN(price) || price <= 0) {
      console.error(`✗ Yahoo Finance API: Invalid price ${price} for ${formattedTicker}`);
      return null;
    }

    // ✅ STRICT CONTRACT: Store API prices in NATIVE CURRENCY only
    console.log(`=== API PRICE FETCH ===`);
    console.log('Yahoo Finance API Response:');
    console.log(`  Ticker: ${formattedTicker}`);
    console.log(`  Raw price: ${price} ${currency}`);
    console.log(`  Currency: ${currency}`);
    console.log(`  Expected storage: ${price} ${currency} (native currency)`);
    console.log('=====================');

    return price; // Store native price in its original currency
  } catch (error) {
    console.error(`✗ Yahoo Finance API error for ${ticker}:`, error);
    return null;
  }
}

/**
 * Unified price fetching function with provider fallback and caching
 * Returns best available price from multiple sources
 */
async function getPrice(ticker: string, type: string, currency: string, purchasePrice: number): Promise<number> {
  console.log(`=== getPrice(${ticker}, ${type}, ${currency}) ===`);

  try {
    // Check cache first for reliability
    // All prices are cached with both IDR and USD
    try {
      const cachedData = priceCache.getCachedPrice(ticker);
      if (cachedData !== null && cachedData.priceIDR > 0) {
        console.log('✓ Using cached price: IDR:', cachedData.priceIDR, 'USD:', cachedData.priceUSD);
        console.log(`→ Returning cached priceIDR: ${cachedData.priceIDR} for ${ticker}`);
        return cachedData.priceIDR;
      }
    } catch (error) {
      console.warn('✗ Cache error, proceeding with API fetch:', error);
    }

    // Crypto always uses CoinGecko only
    if (type === 'crypto') {
      console.log('→ Provider: CoinGecko (with cache)');
      let priceResult: { priceUSD: number | null; priceIDR: number | null } | null = null;

      try {
        priceResult = await fetchCryptoPrice(ticker, currency);
      } catch (error) {
        console.error('✗ CoinGecko exception:', error);
      }

      // Validate fetched price
      if (priceResult !== null &&
          priceResult.priceIDR !== null &&
          priceResult.priceIDR > 0 &&
          !isNaN(priceResult.priceIDR)) {
        console.log('✓ CoinGecko success');
        console.log(`→ Storing crypto price: USD ${priceResult.priceUSD}`);

        // Store IDR price in cache (consistent with stocks/ETFs)
        try {
          priceCache.setCachedPrice(ticker, priceResult.priceIDR ?? 0, priceResult.priceUSD ?? undefined);
        } catch (error) {
          console.warn('✗ Failed to cache price:', error);
        }

        // ✅ STRICT CONTRACT: Return native price, not converted
        const priceNative = priceResult.priceUSD !== null && priceResult.priceUSD !== undefined
          ? priceResult.priceUSD
          : purchasePrice; // Fallback to purchasePrice if API fails

        console.log('⚠️ Crypto fallback price selection:', {
          source: priceResult.priceUSD !== null && priceResult.priceUSD !== undefined ? 'API' : 'database',
          value: priceNative,
          currency: currency
        });
        console.log(`→ Returning crypto price: ${priceNative} ${currency} (native currency)`);
        return priceNative;
      }

      // Log fallback and return only if validation failed
      console.log('✗ CoinGecko failed, using fallback price');
      console.log(`→ Using purchase price fallback: ${purchasePrice}`);
      return purchasePrice;
    }

    // Stock/ETF use multiple providers based on currency
    if (type === 'stock' || type === 'etf') {
      const formattedTicker = formatTickerForAPI(ticker, currency, type);

      // USD markets: Try Yahoo Finance first, fallback to TwelveData
      if (currency === 'USD') {
        console.log('→ Provider: Yahoo Finance first (USD → IDR with cache)');
        let price: number | null = null;

        try {
          price = await fetchStockPriceYahoo(formattedTicker, currency);
          if (price !== null && price > 0) {
            console.log('✓ Yahoo Finance success');

            // Store in cache (IDR) with USD
            try {
              // Price is in IDR, convert back to USD for caching
              const priceUSD = price / FX_RATES.USD_TO_IDR;
              priceCache.setCachedPrice(ticker, price, priceUSD);
            } catch (error) {
              console.warn('✗ Failed to cache price:', error);
            }

            return price;
          }
        } catch (error) {
          console.error('✗ Yahoo Finance exception:', error);
        }

        console.log('✗ Yahoo Finance failed, trying TwelveData fallback');

        try {
          price = await fetchStockPriceTwelveData(formattedTicker, currency);
          if (price !== null && price > 0) {
            console.log('✓ TwelveData fallback success');

            // Store in cache (IDR) with USD
            try {
              // Price is in IDR, convert back to USD for caching
              const priceUSD = price / FX_RATES.USD_TO_IDR;
              priceCache.setCachedPrice(ticker, price, priceUSD);
            } catch (error) {
              console.warn('✗ Failed to cache price:', error);
            }

            return price;
          }
        } catch (error) {
          console.error('✗ TwelveData exception:', error);
        }

        console.log('✗ All USD providers failed, using fallback price');
        console.log(`→ Using purchase price fallback: ${purchasePrice}`);
        return purchasePrice;
      }

      // IDR/SGD markets: Use Yahoo Finance only
      if (currency === 'IDR' || currency === 'SGD') {
        console.log('→ Provider: Yahoo Finance (IDR/SGD → IDR with cache)');
        let price: number | null = null;

        try {
          price = await fetchStockPriceYahoo(formattedTicker, currency);
          if (price !== null && price > 0) {
            console.log('✓ Yahoo Finance success');

            // Store in cache (IDR) with optional USD based on currency
            try {
              let priceUSD: number | undefined;
              if (currency === 'IDR') {
                // Already IDR, no conversion needed
                priceUSD = undefined;
              } else if (currency === 'SGD') {
                // Convert from IDR to USD: USD = IDR / FX_RATES.USD_TO_IDR
                priceUSD = price / FX_RATES.USD_TO_IDR;
              } else if (currency === 'USD') {
                // Price was already converted from USD to IDR, so we need the original
                // Since we used convertToIDR(price, 'USD'), the original was price / FX_RATES.USD_TO_IDR
                priceUSD = price / FX_RATES.USD_TO_IDR;
              }
              priceCache.setCachedPrice(ticker, price, priceUSD);
            } catch (error) {
              console.warn('✗ Failed to cache price:', error);
            }

            return price;
          }
        } catch (error) {
          console.error('✗ Yahoo Finance exception:', error);
        }

        console.log('✗ Yahoo Finance failed, using fallback price');
        console.log(`→ Using purchase price fallback: ${purchasePrice}`);
        return purchasePrice;
      }
    }

    // Bonds and Gold: No real-time pricing, use purchase price
    if (type === 'bond' || type === 'gold') {
      console.log('→ Provider: Manual pricing (stable assets)');
      console.log(`Using purchase price: ${purchasePrice}`);
      return purchasePrice;
    }

    // Unknown type: Fallback to purchase price
    console.log('✗ Unknown type, falling back to purchase price');
    console.log(`→ Using purchase price fallback: ${purchasePrice}`);
    return purchasePrice;
  } catch (error) {
    console.error(`✗ Exception in getPrice for ${ticker}:`, error);
    return purchasePrice;
  }
}

/**
 * Fetch price based on holding type (backward compatibility)
 * Enhanced error handling with validation
 */
export async function fetchHoldingPrice(holding: Holding): Promise<number | null> {
  console.log(`Fetching price for ${holding.ticker} (${holding.type}, ${holding.currency})`);

  try {
    const price = await getPrice(
      holding.ticker,
      holding.type,
      holding.currency,
      holding.purchasePrice
    );

    // Validate price is a valid number
    if (price === null || price === undefined || isNaN(price) || price <= 0) {
      console.log(`✗ Invalid price received: ${price}, using current price fallback`);
      return holding.currentPrice || holding.purchasePrice;
    }

    // Check if using fallback (purchase price)
    if (price === holding.purchasePrice) {
      console.log('✗ Using purchase price fallback (APIs failed)');
    }

    return price;
  } catch (error) {
    console.error(`✗ Exception in fetchHoldingPrice for ${holding.ticker}:`, error);
    // Return current price if available, otherwise purchase price
    return holding.currentPrice || holding.purchasePrice;
  }
}

/**
 * Fetch prices for all holdings once per session with caching
 */
export async function fetchPricesOnce(holdings: Holding[]): Promise<void> {
  console.log('=== fetchPricesOnce ===');

  if (!supabase) {
    console.warn('Supabase not initialized. Using empty data.');
    return;
  }

  const now = new Date();
  const cacheThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds

  for (const holding of holdings) {
    try {
      console.log(`Checking ${holding.ticker}: cache status`);

      // Check price cache first to prevent API spam
      const cachedData = priceCache.getCachedPrice(holding.ticker);
      let needsUpdate = !cachedData || cachedData === null;

      // Only fetch if cache is empty or expired
      if (!needsUpdate && cachedData) {
        const age = now.getTime() - cachedData.timestamp;
        needsUpdate = age > cacheThreshold;
      }

      if (needsUpdate) {
        console.log(`Updating price for ${holding.ticker}: cache expired/missing`);

        // Fetch price using all providers with fallback logic
        const newPrice = await fetchHoldingPrice({
          ...holding,
          id: 'temp' // Temporary ID for price fetching
        });

        // Validate fetched price before updating database
        if (newPrice !== null && !isNaN(newPrice) && newPrice > 0) {
          console.log(`Final ticker: ${holding.ticker}: ${newPrice}`);

          // Only update if price is different from current
          if (newPrice !== holding.currentPrice) {
            console.log(`→ Attempting DB update: ${holding.currentPrice} → ${newPrice}`);

            const success = await updateHoldingPrice(holding.id, newPrice, holding.currency);

            if (success) {
              console.log(`✓ Updated ${holding.ticker} price to ${newPrice} (stored in database)`);
            } else {
              console.error(`✗ Failed to update ${holding.ticker} price in database`);
            }
          } else {
            console.log(`→ ${holding.ticker}: Price unchanged, skipping DB update`);
          }
        } else {
          console.log(`✗ Price fetch failed, keeping current price: ${holding.currentPrice}`);
        }
      } else {
        console.log(`→ ${holding.ticker}: Using cached price (${cachedData?.priceIDR})`);
      }

      // Small delay to avoid rate limiting (only for actual fetches)
      if (needsUpdate) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error updating price for ${holding.ticker}:`, error);
    }
  }

  console.log('✓ Price fetch completed');
  console.log('Cache stats:', priceCache.getCacheStats());
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return priceCache.getCacheStats();
}
