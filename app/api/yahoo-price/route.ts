import { NextRequest, NextResponse } from 'next/server';

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const currency = searchParams.get('currency');

    if (!ticker || !currency) {
      return NextResponse.json(
        { error: 'Missing ticker or currency parameter' },
        { status: 400 }
      );
    }

    console.log(`API: Fetching Yahoo price for ${ticker} (${currency})`);

    // Format ticker based on currency - idempotent
    function formatTicker(ticker: string, currency: string): string {
      const cleanTicker = ticker.toUpperCase().trim();

      // Indonesian stocks (IDR) use .JK suffix - add only if not already present
      if (currency === 'IDR') {
        if (cleanTicker.endsWith('.JK')) {
          console.log(`API: ${cleanTicker} already has .JK suffix, keeping as-is`);
          return cleanTicker;
        }
        const jkTicker = cleanTicker + '.JK';
        console.log(`API: ${cleanTicker} → ${jkTicker} (adding .JK suffix)`);
        return jkTicker;
      }

      // Singapore stocks (SGD) use .SI suffix - add only if not already present
      if (currency === 'SGD') {
        if (cleanTicker.endsWith('.SI')) {
          console.log(`API: ${cleanTicker} already has .SI suffix, keeping as-is`);
          return cleanTicker;
        }
        const siTicker = cleanTicker + '.SI';
        console.log(`API: ${cleanTicker} → ${siTicker} (adding .SI suffix)`);
        return siTicker;
      }

      // USD and other currencies - return as-is
      console.log(`API: ${cleanTicker} → ${cleanTicker} (no suffix needed)`);
      return cleanTicker;
    }

    const formattedTicker = formatTicker(ticker, currency);
    console.log(`API: Formatted ticker: ${ticker} → ${formattedTicker}`);

    // Yahoo Finance chart API
    const response = await fetch(
      `${YAHOO_FINANCE_BASE}/${formattedTicker}?interval=1d&range=1d&includePrePost=false`
    );

    if (!response.ok) {
      console.error(`API: Yahoo HTTP error: ${response.status}`);
      return NextResponse.json(
        { error: 'Yahoo Finance request failed', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) {
      console.error(`API: No metadata for ${formattedTicker}`);
      return NextResponse.json(
        { error: 'No metadata found for ticker' },
        { status: 404 }
      );
    }

    // Yahoo returns current price in regularMarketPrice or previousClose
    const price = meta.regularMarketPrice || meta.previousClose;

    if (!price || isNaN(price)) {
      console.error(`API: Invalid price for ${formattedTicker}`);
      return NextResponse.json(
        { error: 'Invalid price data' },
        { status: 404 }
      );
    }

    console.log(`API: Yahoo price fetched: ${formattedTicker} = ${price} (${currency})`);
    return NextResponse.json({ price: parseFloat(price) });
  } catch (error) {
    console.error('API: Yahoo Finance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
