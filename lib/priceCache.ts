// Price Cache System with Source Tracking

interface CachedPrice {
  priceIDR: number; // Primary storage in IDR
  priceUSD?: number; // Optional USD for display
  timestamp: number;
  source: 'api' | 'cache' | 'fallback' | 'manual'; // Price source tracking
}

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();

  // Cache duration in milliseconds (30 minutes default)
  private readonly CACHE_DURATION = 30 * 60 * 1000;

  /**
   * Get cached price if available and not expired
   */
  getCachedPrice(ticker: string): CachedPrice | null {
    const key = ticker.toUpperCase();
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.CACHE_DURATION) {
      console.log(`Cache expired for ${key} (${Math.round(age / 1000 / 60)} minutes old)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`Using cached price for ${key} (${Math.round(age / 1000 / 60)} minutes old)`);
    return cached;
  }

  /**
   * Store price in cache with source tracking
   */
  setCachedPrice(ticker: string, priceIDR: number, priceUSD?: number, source: 'cache' = 'cache'): void {
    const key = ticker.toUpperCase();
    const now = Date.now();

    this.cache.set(key, { priceIDR, priceUSD, timestamp: now, source });
    console.log(`Cached price for ${key}: IDR: ${priceIDR}, USD: ${priceUSD} (${new Date(now).toLocaleTimeString()})`);
  }

  /**
   * Clear all cached prices
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Price cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; expired: number; active: number } {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      expired,
      active
    };
  }
}

// Global cache instance
export const priceCache = new PriceCache();