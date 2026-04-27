-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crypto', 'stock', 'etf', 'bond', 'gold')),
  shares NUMERIC(28, 10) NOT NULL,
  purchase_price NUMERIC(28, 10) NOT NULL,
  current_price NUMERIC(28, 10) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('IDR', 'USD', 'SGD')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash accounts table
CREATE TABLE IF NOT EXISTS cash_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('IDR', 'USD', 'SGD')),
  amount NUMERIC(28, 10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots table (simplified - no trigger needed)
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  total_value_idr NUMERIC(28, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_type ON holdings(type);
CREATE INDEX IF NOT EXISTS idx_cash_accounts_currency ON cash_accounts(currency);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at DESC);
