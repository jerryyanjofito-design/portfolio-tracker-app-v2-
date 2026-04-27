-- Create asset_accounts table for business and other assets
CREATE TABLE IF NOT EXISTS asset_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('business', 'asset')) DEFAULT 'asset',
  value NUMERIC DEFAULT 0 CHECK (value >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_asset_accounts_created_at ON asset_accounts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on asset_accounts
CREATE POLICY "Users can manage their asset accounts"
ON asset_accounts
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE asset_accounts IS 'Stores business assets and other non-cash, non-investment assets';
COMMENT ON COLUMN asset_accounts.name IS 'Name of the asset or business';
COMMENT ON COLUMN asset_accounts.type IS 'Asset type: business (e.g., Studioverse) or asset (other assets)';
COMMENT ON COLUMN asset_accounts.value IS 'Current value of the asset in IDR';
