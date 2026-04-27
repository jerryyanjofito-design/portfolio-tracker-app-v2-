import { supabase } from './supabase';
import { Holding, CashAccount, Snapshot, Transaction, TransactionInput, AssetAccount } from './types';

// Price cache duration (minutes)
const PRICE_CACHE_DURATION = 30;

// Holdings functions
export async function fetchHoldings(): Promise<Holding[]> {
  try {
    console.log('=== fetchHoldings ===');
    if (!supabase) {
      console.warn('✗ Supabase not initialized. Using empty data.');
      return [];
    }

    console.log('✓ Attempting to fetch holdings...');
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('✗ Error fetching holdings:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return [];
    }

    // Map snake_case to camelCase for TypeScript
    const holdings: Holding[] = (data || []).map((item: any) => ({
      id: item.id,
      ticker: item.ticker,
      name: item.name,
      type: item.type,
      shares: item.shares,
      purchasePrice: item.purchase_price,
      currentPrice: item.current_price,
      currency: item.currency
    }));

    console.log('✓ Successfully fetched holdings:', holdings.length, 'items');
    return holdings;
  } catch (error) {
    console.error('✗ Exception in fetchHoldings:', error);
    return [];
  }
}

export async function addHolding(holding: Omit<Holding, 'id'>): Promise<Holding | null> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    console.log('Inserting holding:', holding);

    // Map camelCase to snake_case for Supabase
    const insertData = {
      ticker: holding.ticker,
      name: holding.name,
      type: holding.type,
      shares: holding.shares,
      purchase_price: holding.purchasePrice,
      current_price: holding.currentPrice,
      currency: holding.currency
    };

    console.log('Mapped insert data for Supabase:', insertData);

    const { data, error } = await supabase
      .from('holdings')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase holding error:', error?.message, error);
      return null;
    }

    // Check if the returned data is valid (note: database returns snake_case)
    if (!data || Object.keys(data).length === 0 ||
        !data.ticker || !data.type || !data.shares ||
        !data.purchase_price || !data.current_price || !data.currency) {
      console.error('Invalid holding data received from Supabase:', data);
      return null;
    }

    // Map snake_case back to camelCase for TypeScript
    const holdingData: Holding = {
      id: data.id,
      ticker: data.ticker,
      name: data.name,
      type: data.type,
      shares: data.shares,
      purchasePrice: data.purchase_price,
      currentPrice: data.current_price,
      currency: data.currency
    };

    console.log('Successfully added holding:', holdingData);
    return holdingData;
  } catch (error: any) {
    console.error('Error adding holding:', error);
    return null;
  }
}

export async function deleteHolding(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting holding:', error);
      return false;
    }

    console.log('Successfully deleted holding:', id);
    return true;
  } catch (error) {
    console.error('Error deleting holding:', error);
    return false;
  }
}

export async function updateHoldingPrice(id: string, currentPrice: number, currency?: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('✗ Supabase not initialized');
      return false;
    }

    // Validate price before database update
    if (currentPrice === null || currentPrice === undefined || isNaN(currentPrice) || currentPrice <= 0) {
      console.error(`✗ Invalid price for database update: ${currentPrice}`);
      return false;
    }

    console.log(`=== DATABASE STORAGE ===`);
    console.log(`Updating holding ID: ${id}`);
    console.log(`  New price: ${currentPrice}`);
    console.log(`  Currency: ${currency || 'Unknown'}`);
    console.log(`  Expected storage: ${currentPrice} ${currency || ''} (native currency)`);

    // ✅ STRICT CONTRACT: Validate currency-appropriate price ranges
    if (currency) {
      const validationWarnings: string[] = [];

      if (currency === 'USD') {
        if (currentPrice > 10000) {
          validationWarnings.push('⚠️ Suspicious: USD price > $10,000 (might be stored as IDR)');
        }
        if (currentPrice < 0.01) {
          validationWarnings.push('⚠️ Suspicious: USD price < $0.01');
        }
      } else if (currency === 'IDR') {
        if (currentPrice < 1000) {
          validationWarnings.push('⚠️ Suspicious: IDR price < Rp 1,000 (might be stored as USD)');
        }
        if (currentPrice > 100000000) {
          validationWarnings.push('⚠️ Suspicious: IDR price > Rp 100,000,000');
        }
      } else if (currency === 'SGD') {
        if (currentPrice > 10000) {
          validationWarnings.push('⚠️ Suspicious: SGD price > $10,000 (might be stored as IDR)');
        }
        if (currentPrice < 0.01) {
          validationWarnings.push('⚠️ Suspicious: SGD price < $0.01');
        }
      }

      if (validationWarnings.length > 0) {
        console.warn('Currency Validation Warnings:');
        validationWarnings.forEach(warning => console.warn('  ' + warning));
      } else {
        console.log('✅ Currency validation passed');
      }
    } else {
      console.log('⚠️ No currency provided - skipping validation');
    }

    console.log('====================');

    const { error } = await supabase
      .from('holdings')
      .update({
        current_price: currentPrice
      })
      .eq('id', id);

    if (error) {
      console.error(`✗ Database update error for holding ${id}:`, error);
      console.error(`   Error code: ${error.code}, message: ${error.message}`);
      console.error(`   Details: ${error.details}, hint: ${error.hint}`);
      return false;
    }

    console.log(`✓ Successfully updated holding price: ${id}`);
    console.log(`→ Database stored current_price: ${currentPrice}`);
    return true;
  } catch (error) {
    console.error(`✗ Exception updating holding price for ${id}:`, error);
    return false;
  }
}

// Cash accounts functions
export async function fetchCashAccounts(): Promise<CashAccount[]> {
  try {
    console.log('=== fetchCashAccounts ===');
    if (!supabase) {
      console.warn('✗ Supabase not initialized. Using empty data.');
      return [];
    }

    console.log('✓ Attempting to fetch cash accounts...');
    const { data, error } = await supabase
      .from('cash_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('✗ Error fetching cash accounts:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return [];
    }

    console.log('✓ Successfully fetched cash accounts:', data?.length || 0, 'items');
    return data || [];
  } catch (error) {
    console.error('✗ Exception in fetchCashAccounts:', error);
    return [];
  }
}

export async function addCashAccount(account: Omit<CashAccount, 'id'>): Promise<CashAccount | null> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    console.log('Inserting cash account:', account);

    const insertData = {
      name: account.name || account.accountName,
      currency: account.currency,
      amount: account.amount || account.balance
    };

    console.log('Insert data structure:', insertData);

    const { data, error } = await supabase
      .from('cash_accounts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase cash account error:', error?.message, error);
      return null;
    }

    // Check if the returned data is valid
    if (!data || !data.name || !data.currency || !data.amount) {
      console.error('Invalid cash account data received from Supabase:', data);
      return null;
    }

    console.log('Successfully added cash account:', data);
    return data;
  } catch (error: any) {
    console.error('Error adding cash account:', error);
    return null;
  }
}

export async function deleteCashAccount(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('cash_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting cash account:', error);
      return false;
    }

    console.log('Successfully deleted cash account:', id);
    return true;
  } catch (error) {
    console.error('Error deleting cash account:', error);
    return false;
  }
}

export async function updateCashAccount(id: string, amount: number): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('cash_accounts')
      .update({ amount: amount })
      .eq('id', id);

    if (error) {
      console.error('Error updating cash account:', error);
      return false;
    }

    console.log('Successfully updated cash account:', id);
    return true;
  } catch (error) {
    console.error('Error updating cash account:', error);
    return false;
  }
}

// Snapshots functions
export async function fetchSnapshots(): Promise<Snapshot[]> {
  try {
    console.log('=== fetchSnapshots ===');
    if (!supabase) {
      console.warn('✗ Supabase not initialized. Using empty data.');
      return [];
    }

    console.log('✓ Attempting to fetch snapshots...');
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('✗ Error fetching snapshots:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return [];
    }

    console.log('✓ Successfully fetched snapshots:', data?.length || 0, 'items');

    // Debug: Log each snapshot to verify data
    if (data && data.length > 0) {
      console.log('=== Snapshot Data Details ===');
      data.forEach((snapshot, i) => {
        console.log(`  Snapshot ${i + 1}:`);
        console.log(`    ID: ${snapshot.id}`);
        console.log(`    Date: ${snapshot.created_at}`);
        console.log(`    Total Value (IDR): ${snapshot.total_value_idr?.toLocaleString()}`);
        console.log(`    Snapshot Date: ${snapshot.snapshot_date}`);
      });
    }

    return data || [];
  } catch (error) {
    console.error('✗ Exception in fetchSnapshots:', error);
    return [];
  }
}

/**
 * Fetch prices only once per session for all holdings
 * Checks if prices need updating based on PRICE_CACHE_DURATION
 */
export async function fetchPricesOnce(holdings: Holding[], forceRefresh: boolean = false): Promise<void> {
  console.log('=== fetchPricesOnce ===');
  console.log('Force refresh:', forceRefresh);
  if (!supabase) {
    console.warn('Supabase not initialized');
    return;
  }

  const now = new Date();
  const cacheThreshold = PRICE_CACHE_DURATION * 60 * 1000; // Convert to milliseconds

  for (const holding of holdings) {
    try {
      // Check price cache to see if we need to update
      const { fetchHoldingPrice } = await import('./priceFetcher');
      const { priceCache } = await import('./priceCache');

      const cachedData = priceCache.getCachedPrice(holding.ticker);
      let needsUpdate = forceRefresh || cachedData === null;

      if (!needsUpdate && cachedData) {
        const age = now.getTime() - cachedData.timestamp;
        needsUpdate = age > cacheThreshold;
      }

      if (needsUpdate) {
        console.log(`Updating price for ${holding.ticker}: needs fresh data`);

        try {
          const newPrice = await fetchHoldingPrice(holding);

          // Validate price before updating database
          if (newPrice === null || newPrice === undefined || isNaN(newPrice) || newPrice <= 0) {
            console.log(`✗ Skipping DB update for ${holding.ticker}: Invalid price ${newPrice}`);
            console.log(`→ Keeping current price: ${holding.currentPrice}`);
            continue; // Skip to next holding
          }

          // Only update if price is valid and different
          if (newPrice !== holding.currentPrice) {
            console.log(`→ Attempting DB update for ${holding.ticker}: ${holding.currentPrice} → ${newPrice}`);
            console.log(`→ Price to update: ${newPrice}, holding current price: ${holding.currentPrice}`);

            const success = await updateHoldingPrice(holding.id, newPrice);
            if (success) {
              console.log(`✓ Updated ${holding.ticker}: ${holding.currentPrice} → ${newPrice}`);
            } else {
              console.log(`✗ Failed to update ${holding.ticker} in database - check column permissions and RLS policies`);
            }
          } else {
            console.log(`→ ${holding.ticker}: Price unchanged (${newPrice}), skipping DB update`);
          }
        } catch (error) {
          console.error(`✗ Exception processing ${holding.ticker}:`, error);
          console.log(`→ Keeping current price: ${holding.currentPrice}`);
          continue; // Skip to next holding
        }
      } else {
        console.log(`→ ${holding.ticker}: Price is recent (cached), skipping fetch`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error updating price for ${holding.ticker}:`, error);
    }
  }

  console.log('✓ Price fetching completed');
}

// Import calculation function
import { calculatePortfolioSummary } from './calculations';

// Transaction functions
export async function executeTransaction(
  holdingId: string,
  type: 'buy' | 'sell',
  quantity: number,
  price: number
): Promise<{ success: boolean; holding?: Holding; error?: string }> {
  try {
    console.log('=== executeTransaction ===');
    console.log(`Holding ID: ${holdingId}, Type: ${type}, Quantity: ${quantity}, Price: ${price}`);

    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    // Validate inputs
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    // Fetch current holding
    const { data: currentHolding, error: fetchError } = await supabase
      .from('holdings')
      .select('*')
      .eq('id', holdingId)
      .single();

    if (fetchError) {
      console.error('✗ Error fetching holding:', fetchError);
      throw new Error('Holding not found');
    }

    if (!currentHolding) {
      throw new Error('Holding not found');
    }

    const oldShares = currentHolding.shares;
    const oldAvgPrice = currentHolding.purchase_price;

    console.log(`Current shares: ${oldShares}, Current avg price: ${oldAvgPrice}`);

    let newShares: number;
    let newAvgPrice: number;

    if (type === 'buy') {
      // BUY: Add shares and recalculate average price
      newShares = oldShares + quantity;
      newAvgPrice = ((oldShares * oldAvgPrice) + (quantity * price)) / newShares;

      console.log(`BUY transaction: ${oldShares} → ${newShares} shares, avg price: ${oldAvgPrice} → ${newAvgPrice}`);
    } else {
      // SELL: Remove shares, average price unchanged
      if (quantity > oldShares) {
        throw new Error(`Cannot sell ${quantity} shares when holding only ${oldShares} shares`);
      }

      newShares = oldShares - quantity;
      newAvgPrice = newShares === 0 ? 0 : oldAvgPrice;

      console.log(`SELL transaction: ${oldShares} → ${newShares} shares, avg price unchanged: ${newAvgPrice}`);
    }

    // Update holding
    const { error: updateError } = await supabase
      .from('holdings')
      .update({
        shares: newShares,
        purchase_price: newAvgPrice
      })
      .eq('id', holdingId);

    if (updateError) {
      console.error('✗ Error updating holding:', updateError);
      throw new Error('Failed to update holding');
    }

    // Optionally create a snapshot to record the new portfolio state
    try {
      const portfolioSummary = calculatePortfolioSummary([currentHolding], [], []);

      const snapshotPayload = {
        total_value_idr: portfolioSummary.netWorth,
        snapshot_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };

      console.log('Creating snapshot for transaction:', JSON.stringify(snapshotPayload, null, 2));

      const { error: snapshotError } = await supabase
        .from('snapshots')
        .insert([snapshotPayload]);

      if (snapshotError) {
        console.warn('Warning: Failed to create snapshot (transaction still succeeded):', snapshotError.message);
      } else {
        console.log('✓ Snapshot created successfully');
      }
    } catch (snapshotErr) {
      // Snapshot creation is non-critical - transaction succeeded even if this fails
      console.warn('Warning: Snapshot creation failed (transaction still succeeded):', snapshotErr);
    }

    // Fetch updated holding for return
    const { data: updatedHolding } = await supabase
      .from('holdings')
      .select('*')
      .eq('id', holdingId)
      .single();

    if (!updatedHolding) {
      throw new Error('Failed to fetch updated holding');
    }

    // Map to Holding type
    const holding: Holding = {
      id: updatedHolding.id,
      ticker: updatedHolding.ticker,
      name: updatedHolding.name,
      type: updatedHolding.type,
      shares: updatedHolding.shares,
      purchasePrice: updatedHolding.purchase_price,
      currentPrice: updatedHolding.current_price,
      currency: updatedHolding.currency
    };

    console.log('✓ Transaction completed successfully');
    console.log(`→ Updated holding: ${holding.ticker}, ${holding.shares} shares @ ${holding.purchasePrice}`);

    return { success: true, holding };
  } catch (error: any) {
    console.error('✗ Exception in executeTransaction:', error);
    return {
      success: false,
      error: error.message || 'Transaction failed'
    };
  }
}

export async function fetchTransactions(holdingId?: string): Promise<Transaction[]> {
  try {
    console.log('=== fetchTransactions ===');
    // Note: Transactions table doesn't exist in current schema
    // This function returns empty array as transaction history is not currently stored
    console.log('Note: Transaction history not available - transactions table does not exist');
    return [];
  } catch (error) {
    console.error('✗ Exception in fetchTransactions:', error);
    return [];
  }
}

export async function deleteTransaction(transactionId: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    // Note: Transactions table doesn't exist in current schema
    // This function always returns false as transaction history is not currently stored
    console.log('Note: Cannot delete transaction - transactions table does not exist');
    return false;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}

/**
 * Save a daily snapshot of portfolio net worth
 * Creates one snapshot per day to build historical chart data
 */
export async function saveDailySnapshot(totalNetWorth: number): Promise<boolean> {
  try {
    console.log('=== saveDailySnapshot ===');
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    console.log('Attempting to save snapshot for:', today);
    console.log('Total net worth:', totalNetWorth);

    // Check if snapshot already exists for today
    const { data: existingSnapshot, error: checkError } = await supabase
      .from('snapshots')
      .select('id')
      .eq('snapshot_date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing snapshot:', checkError);
      return false;
    }

    if (existingSnapshot) {
      console.log('Snapshot already exists for today:', existingSnapshot.id);
      console.log('✓ Skipping duplicate snapshot');
      return true; // Considered success since snapshot exists
    }

    // Create new snapshot
    const snapshotPayload = {
      total_value_idr: totalNetWorth,
      snapshot_date: today
    };

    console.log('Creating new snapshot:', JSON.stringify(snapshotPayload, null, 2));

    const { error: insertError } = await supabase
      .from('snapshots')
      .insert([snapshotPayload]);

    if (insertError) {
      console.error('✗ Error creating snapshot:', JSON.stringify(insertError, null, 2));
      return false;
    }

    console.log('✓ Successfully saved daily snapshot');
    return true;
  } catch (error) {
    console.error('✗ Exception in saveDailySnapshot:', error);
    return false;
  }
}

// Asset accounts functions
export async function fetchAssetAccounts(): Promise<AssetAccount[]> {
  try {
    console.log('=== fetchAssetAccounts ===');
    if (!supabase) {
      console.warn('✗ Supabase not initialized. Using empty data.');
      return [];
    }

    console.log('✓ Attempting to fetch asset accounts...');
    const { data, error } = await supabase
      .from('asset_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('✗ Error fetching asset accounts:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return [];
    }

    console.log('✓ Successfully fetched asset accounts:', data?.length || 0, 'items');
    return data || [];
  } catch (error) {
    console.error('✗ Exception in fetchAssetAccounts:', error);
    return [];
  }
}

export async function addAssetAccount(
  name: string,
  value: number,
  type: 'business' | 'asset' = 'asset'
): Promise<AssetAccount | null> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    console.log('Adding asset account:', { name, value, type });

    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (value < 0) {
      throw new Error('Value must be non-negative');
    }

    const { data, error } = await supabase
      .from('asset_accounts')
      .insert([{
        name: name.trim(),
        value: value,
        type: type
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase asset account error:', error?.message, error);
      return null;
    }

    console.log('Successfully added asset account:', data);
    return data;
  } catch (error: any) {
    console.error('Error adding asset account:', error);
    return null;
  }
}

export async function updateAssetAccount(id: string, value: number): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    // Validate input
    if (value < 0) {
      throw new Error('Value must be non-negative');
    }

    console.log(`Updating asset account ${id}: value = ${value}`);

    const { error } = await supabase
      .from('asset_accounts')
      .update({ value: value })
      .eq('id', id);

    if (error) {
      console.error('Error updating asset account:', error);
      return false;
    }

    console.log('Successfully updated asset account:', id);
    return true;
  } catch (error) {
    console.error('Error updating asset account:', error);
    return false;
  }
}

export async function deleteAssetAccount(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('asset_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting asset account:', error);
      return false;
    }

    console.log('Successfully deleted asset account:', id);
    return true;
  } catch (error) {
    console.error('Error deleting asset account:', error);
    return false;
  }
}
