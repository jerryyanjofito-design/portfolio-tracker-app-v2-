'use client';

import { useState, useEffect, useMemo } from 'react';
import { runCurrencyFixTest } from '@/lib/currencyFixTest';
import { validateHoldingComplete } from '@/lib/currencyValidation';
import { Holding, CashAccount, Snapshot, AssetAccount } from '@/lib/types';
import { priceCache } from '@/lib/priceCache';
import {
  calculatePortfolioSummary,
  calculatePortfolioAllocation,
  calculateNetWorthAllocation
} from '@/lib/calculations';

import {
  fetchHoldings,
  addHolding,
  deleteHolding,
  fetchCashAccounts,
  addCashAccount,
  deleteCashAccount,
  updateCashAccount,
  fetchSnapshots,
  updateHoldingPrice,
  fetchPricesOnce,
  fetchAssetAccounts,
  addAssetAccount,
  deleteAssetAccount,
  updateAssetAccount,
  saveDailySnapshot
} from '@/lib/database';

import NetWorthDisplay from '@/components/dashboard/NetWorthDisplay';
import HoldingsTable from '@/components/dashboard/HoldingsTable';
import CashAccounts from '@/components/dashboard/CashAccounts';
import AddHoldingForm from '@/components/dashboard/AddHoldingForm';
import AddCashAccountForm from '@/components/dashboard/AddCashAccountForm';
import SnapshotComparison from '@/components/dashboard/SnapshotComparison';
import PortfolioAllocationChart from '@/components/dashboard/PortfolioAllocationChart';
import NetWorthAllocationChart from '@/components/dashboard/NetWorthAllocationChart';
import PortfolioPerformanceChart from '@/components/dashboard/PortfolioPerformanceChart';
import TransactionModal from '@/components/dashboard/TransactionModal';
import AssetAccounts from '@/components/dashboard/AssetAccounts';
import AddAssetModal from '@/components/dashboard/AddAssetModal';
import AIAdvisorChatbot from '@/components/dashboard/AIAdvisorChatbot';

export default function Home() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if daily snapshot has been saved this session
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  // Transaction modal state
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Asset modal state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  // AI advisor chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form open states
  const [isAddCashFormOpen, setIsAddCashFormOpen] = useState(false);
  const [isAddHoldingFormOpen, setIsAddHoldingFormOpen] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();

    // Run currency fix test in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Running currency fix validation test...');
      runCurrencyFixTest();
    }
  }, []);

  // Note: Daily snapshot saving is now handled in loadData function
// to ensure summary is calculated before attempting to save

  async function loadData() {
    try {
      setLoading(true);
      const [c, a, s] = await Promise.all([
        fetchCashAccounts(),
        fetchAssetAccounts(),
        fetchSnapshots()
      ]);

      let holdings = await fetchHoldings();

      // Fetch prices once per session with caching, then reload with updated prices
      if (holdings.length > 0) {
        console.log('Starting one-time price fetching...');
        await fetchPricesOnce(holdings);
        holdings = await fetchHoldings(); // Reload to get updated prices
      }

      setHoldings(holdings); // Now has fresh prices
      setCashAccounts(c);
      setAssetAccounts(a);
      setSnapshots(s);

      // Calculate and save daily snapshot after data is loaded
      const calculatedSummary = calculatePortfolioSummary(holdings, c, a);
      if (calculatedSummary.netWorth > 0 && !snapshotSaved) {
        console.log('=== Auto-saving daily snapshot after load ===');
        const success = await saveDailySnapshot(calculatedSummary.netWorth);
        if (success) {
          setSnapshotSaved(true);
          console.log('✓ Daily snapshot auto-saved');
          // Reload snapshots to include the new one
          const updatedSnapshots = await fetchSnapshots();
          setSnapshots(updatedSnapshots);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(
    () => calculatePortfolioSummary(holdings, cashAccounts, assetAccounts),
    [holdings, cashAccounts, assetAccounts]
  );

  const portfolioAllocation = useMemo(
    () => calculatePortfolioAllocation(holdings),
    [holdings]
  );

  const netWorthAllocation = useMemo(
    () => calculateNetWorthAllocation(holdings, cashAccounts, assetAccounts),
    [holdings, cashAccounts, assetAccounts]
  );

  const previousSnapshot = snapshots.length > 1 ? snapshots[1] : null;

  const handleAddHolding = async (holding: Omit<Holding, 'id'>) => {
    console.log('=== handleAddHolding ===');
    console.log('Adding holding:', holding);

    // Currency consistency validation
    const { purchasePrice, currentPrice, currency, ticker } = holding;
    console.log('Currency Context Validation:');
    console.log('  ticker:', ticker);
    console.log('  purchasePrice:', purchasePrice, currency);
    console.log('  currentPrice:', currentPrice, currency);

    // Validate currency-appropriate price ranges
    const validationWarnings: string[] = [];
    if (currency === 'USD' && (purchasePrice > 10000 || currentPrice > 10000)) {
      validationWarnings.push('⚠️ USD price looks like IDR (value too high)');
    }
    if (currency === 'IDR' && (purchasePrice < 1000 || currentPrice < 1000)) {
      validationWarnings.push('⚠️ IDR price looks like USD (value too low)');
    }
    if (currency === 'SGD' && (purchasePrice > 10000 || currentPrice > 10000)) {
      validationWarnings.push('⚠️ SGD price looks like IDR (value too high)');
    }

    if (validationWarnings.length > 0) {
      console.warn('Currency Validation Warnings:');
      validationWarnings.forEach(warning => console.warn('  ' + warning));
    } else {
      console.log('✅ Currency validation passed');
    }

    // Final validation before database storage
    const validationPassed = validateHoldingComplete({
      ticker: holding.ticker,
      purchasePrice: holding.purchasePrice,
      currentPrice: holding.currentPrice,
      currency: holding.currency,
      shares: holding.shares
    });

    if (!validationPassed) {
      console.error('❌ Final validation failed - database storage blocked');
      console.log('=====================');
      return;
    }

    // Save holding to database
    const newHolding = await addHolding(holding);
    if (newHolding) {
      console.log('✓ Holding saved to database');
      console.log('  Stored as:', {
        purchase_price: newHolding.purchasePrice,
        current_price: newHolding.currentPrice,
        currency: newHolding.currency
      });
      setHoldings(prev => [...prev, newHolding]);
    } else {
      console.error('✗ Failed to save holding to database');
    }
    console.log('=====================');
  };

  const handleDeleteHolding = async (id: string) => {
    await deleteHolding(id);
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  const handleAddCashAccount = async (account: CashAccount) => {
    const newAccount = await addCashAccount(account);
    if (newAccount) setCashAccounts(prev => [...prev, newAccount]);
  };

  const handleDeleteCashAccount = async (id: string) => {
    await deleteCashAccount(id);
    setCashAccounts(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCashAccount = async (id: string, amount: number) => {
    const success = await updateCashAccount(id, amount);
    if (success) {
      setCashAccounts(prev =>
        prev.map(c =>
          c.id === id ? { ...c, amount: amount } : c
        )
      );
    }
  };

  const handleRefreshPrice = async (id: string, newPrice: number) => {
    console.log(`=== Manual price refresh for holding ID: ${id} ===`);
    // Find the holding to get its currency
    const holding = holdings.find(h => h.id === id);
    const currency = holding?.currency;

    const success = await updateHoldingPrice(id, newPrice, currency);
    if (success) {
      console.log('✓ Manual price updated successfully');
      // Update local state
      setHoldings(prev =>
        prev.map(h =>
          h.id === id ? { ...h, currentPrice: newPrice } : h
        )
      );
    } else {
      console.error('✗ Failed to update price manually');
    }
  };

  const handleBuySell = (holding: Holding) => {
    setSelectedHolding(holding);
    setIsTransactionModalOpen(true);
  };

  const handleTransactionComplete = async () => {
    // Reload data to get updated holdings
    await loadData();
  };

  const handleCloseTransactionModal = () => {
    setSelectedHolding(null);
    setIsTransactionModalOpen(false);
  };

  // Asset handlers
  const handleAddAsset = async (name: string, value: number, type: 'business' | 'asset') => {
    const newAsset = await addAssetAccount(name, value, type);
    if (newAsset) {
      setAssetAccounts(prev => [...prev, newAsset]);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    await deleteAssetAccount(id);
    setAssetAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAsset = async (id: string, value: number) => {
    const success = await updateAssetAccount(id, value);
    if (success) {
      setAssetAccounts(prev =>
        prev.map(a =>
          a.id === id ? { ...a, value: value } : a
        )
      );
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {error && <div className="text-negative">{error}</div>}

        {/* Header with refresh buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (holdings.length > 0) {
                  console.log('Force price refresh triggered');
                  // Clear cache to fetch fresh prices
                  priceCache.clearCache();
                  await fetchPricesOnce(holdings, true);
                  // Reload holdings to get updated prices
                  const updatedHoldings = await fetchHoldings();
                  setHoldings(updatedHoldings);
                }
              }}
              disabled={loading || holdings.length === 0}
              className={`btn-secondary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '↻ Force Refresh...' : '↻ Force Refresh'}
            </button>
            <button
              onClick={() => {
                if (holdings.length > 0) {
                  console.log('Manual price refresh triggered');
                  // Clear cache to fetch fresh prices
                  priceCache.clearCache();
                  fetchPricesOnce(holdings);
                }
              }}
              disabled={loading || holdings.length === 0}
              className={`btn-secondary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '↻ Refreshing...' : '↻ Refresh Prices'}
            </button>
          </div>
        </div>

        {/* Hero Section - Net Worth */}
        <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
          <NetWorthDisplay summary={summary} assetsTotal={netWorthAllocation.assetsTotal} />
        </div>

        {/* Performance Chart */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <PortfolioPerformanceChart
            snapshots={snapshots}
            currentNetWorth={summary.netWorth}
          />
        </div>

        {/* Cash Accounts Section */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="section-header">
            <span className="section-label">CASH ACCOUNTS</span>
            <button
              onClick={() => setIsAddCashFormOpen(!isAddCashFormOpen)}
              className="btn-glass"
            >
              + Add Account
            </button>
          </div>
          <CashAccounts
            cashAccounts={cashAccounts}
            onDeleteAccount={handleDeleteCashAccount}
            onUpdateAccount={handleUpdateCashAccount}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <AddCashAccountForm
            isOpen={isAddCashFormOpen}
            onAddCashAccount={handleAddCashAccount}
          />
        </div>

        {/* Assets Section */}
        <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="section-header">
            <span className="section-label">ASSETS</span>
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="btn-glass"
            >
              + Add Asset
            </button>
          </div>
          <AssetAccounts
            assetAccounts={assetAccounts}
            onDeleteAccount={handleDeleteAsset}
            onUpdateAccount={handleUpdateAsset}
          />
        </div>

        <AddAssetModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          onAddAsset={handleAddAsset}
        />

        {/* Holdings Section */}
        <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="section-header">
            <span className="section-label">HOLDINGS</span>
            <button
              onClick={() => setIsAddHoldingFormOpen(!isAddHoldingFormOpen)}
              className="btn-glass"
            >
              + Add Holding
            </button>
          </div>
          <HoldingsTable
            holdings={holdings}
            onDeleteHolding={handleDeleteHolding}
            onRefreshPrice={handleRefreshPrice}
            onBuySell={handleBuySell}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
          <AddHoldingForm
            isOpen={isAddHoldingFormOpen}
            onAddHolding={handleAddHolding}
          />
        </div>

        {/* Snapshot Comparison */}
        <div className="animate-fade-up" style={{ animationDelay: '420ms' }}>
          <SnapshotComparison
            currentNetWorth={summary.netWorth}
            previousSnapshot={previousSnapshot}
          />
        </div>

        {/* Allocation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '480ms' }}>
          <PortfolioAllocationChart data={portfolioAllocation} />
          <NetWorthAllocationChart
            investmentsTotal={summary.totalHoldingsValue}
            cashTotal={summary.totalCashValue}
            assetsTotal={netWorthAllocation.assetsTotal}
          />
        </div>

        {/* Modals */}
        <TransactionModal
          holding={selectedHolding!}
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          onTransactionComplete={handleTransactionComplete}
        />

        <AIAdvisorChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          holdings={holdings}
          cashAccounts={cashAccounts}
          assetAccounts={assetAccounts}
        />

        {/* Floating Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 btn-primary p-4 z-50"
          title="Ask AI Advisor"
        >
          💬
        </button>

      </div>
    </main>
  );
}
