-- Create transactions table for tracking buy/sell operations
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on holding_id for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON transactions(holding_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on transactions
CREATE POLICY "Users can manage their transactions"
ON transactions
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE transactions IS 'Tracks buy/sell transactions for portfolio holdings';
COMMENT ON COLUMN transactions.holding_id IS 'Reference to the holding being bought/sold';
COMMENT ON COLUMN transactions.type IS 'Transaction type: buy or sell';
COMMENT ON COLUMN transactions.quantity IS 'Number of shares bought/sold';
COMMENT ON COLUMN transactions.price IS 'Price per share at time of transaction';
