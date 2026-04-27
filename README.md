# Wealth Portfolio OS - MVP

A simple personal wealth tracking system with IDR base currency and Supabase persistence.

## Features

- Net worth tracking (IDR)
- Holdings table (stocks, crypto, ETFs)
- Cash accounts management (IDR, SGD, USD)
- Real-time P/L calculations
- Goal progress tracking (Target: 15B IDR)
- Supabase database persistence
- Add/delete holdings and cash accounts

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your Project URL and Anon Key

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Create Database Tables

Run the SQL schema in your Supabase SQL Editor:

1. Go to Supabase → SQL Editor
2. Open `supabase/schema.sql`
3. Copy and paste the contents
4. Click "Run" to create tables

The schema creates:
- `holdings` table (id, ticker, name, type, shares, purchase_price, current_price, currency)
- `cash_accounts` table (id, name, currency, amount)

### 5. Install dependencies

```bash
npm install
```

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Holdings Table
```sql
- id (UUID, primary key)
- ticker (TEXT, e.g., "BTC", "AAPL")
- name (TEXT, e.g., "Bitcoin")
- type (TEXT: crypto, stock, etf, bond, gold)
- shares (NUMERIC)
- purchase_price (NUMERIC)
- current_price (NUMERIC)
- currency (TEXT: IDR, USD, SGD)
- created_at (TIMESTAMPTZ)
```

### Cash Accounts Table
```sql
- id (UUID, primary key)
- name (TEXT, e.g., "Indodax")
- currency (TEXT: IDR, USD, SGD)
- amount (NUMERIC)
- created_at (TIMESTAMPTZ)
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Supabase (PostgreSQL)
- React

## Usage

1. **Add Holdings**: Click "+ Add New Holding" and fill in ticker, type, shares, buy price, current price, and currency
2. **Add Cash Accounts**: Click "+ Add Cash Account" and fill in name, currency, and balance
3. **Delete Items**: Click the ✕ button next to any holding or cash account to remove it
4. **View Portfolio**: Net worth, P/L, and progress bar update automatically

## Currency Handling

- Base currency: **IDR**
- FX Rates:
  - 1 USD = 16,200 IDR
  - 1 SGD = 11,850 IDR
- All values displayed in IDR with optional USD secondary display for USD holdings

## Future Improvements

- Real-time market data integration (CoinGecko, Yahoo Finance)
- Authentication and user accounts
- Advanced portfolio analytics
- AI-powered insights
- Historical performance tracking
