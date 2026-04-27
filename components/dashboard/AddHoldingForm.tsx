import { useState } from 'react';
import { Holding, AssetType, Currency } from '@/lib/types';
import { validatePriceRange, validateHoldingComplete } from '@/lib/currencyValidation';

interface AddHoldingFormProps {
  onAddHolding: (holding: Omit<Holding, 'id'>) => Promise<void>;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function AddHoldingForm({ onAddHolding, isOpen: controlledIsOpen, onToggle }: AddHoldingFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    type: 'crypto' as AssetType,
    shares: '',
    purchasePrice: '',
    currency: 'IDR' as Currency
  });
  const [isLoading, setIsLoading] = useState(false);
  const [priceStatus, setPriceStatus] = useState<'fetching' | 'success' | 'failed' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPriceStatus('fetching');

    try {
      console.log('=== FORM SUBMISSION ===');
      console.log('Input Values:');
      console.log('  ticker:', formData.ticker);
      console.log('  name:', formData.name);
      console.log('  type:', formData.type);
      console.log('  shares:', formData.shares);
      console.log('  purchasePrice:', formData.purchasePrice);
      console.log('  currency:', formData.currency);

      // Validate currency-appropriate price ranges
      const parsedPrice = parseFloat(formData.purchasePrice);
      const parsedShares = parseFloat(formData.shares);

      // Currency validation
      const currencyWarnings: string[] = [];
      if (formData.currency === 'USD' && parsedPrice > 10000) {
        currencyWarnings.push('⚠️ Suspicious: USD price > $10,000 (might be stored as IDR)');
      }
      if (formData.currency === 'IDR' && parsedPrice < 1000) {
        currencyWarnings.push('⚠️ Suspicious: IDR price < Rp 1,000 (might be stored as USD)');
      }
      if (formData.currency === 'SGD' && parsedPrice > 10000) {
        currencyWarnings.push('⚠️ Suspicious: SGD price > $10,000 (might be stored as IDR)');
      }

      if (currencyWarnings.length > 0) {
        console.warn('Currency Validation Warnings:');
        currencyWarnings.forEach(warning => console.warn('  ' + warning));
      }

      const holding: Omit<Holding, 'id'> = {
        ticker: formData.ticker.toUpperCase(),
        name: formData.name || formData.ticker.toUpperCase(),
        type: formData.type,
        shares: parsedShares,
        purchasePrice: parsedPrice,
        currentPrice: parsedPrice,
        currency: formData.currency
      };

      console.log('Prepared holding object:');
      console.log('  ticker:', holding.ticker);
      console.log('  name:', holding.name);
      console.log('  type:', holding.type);
      console.log('  shares:', holding.shares);
      console.log('  purchasePrice:', holding.purchasePrice, holding.currency, '(native currency)');
      console.log('  currentPrice:', holding.currentPrice, holding.currency, '(native currency)');
      console.log('  Expected database storage: { purchase_price:', holding.purchasePrice, ', currency:', holding.currency, '}');

      // Comprehensive validation before submission
      console.log('=== PRE-SUBMISSION VALIDATION ===');
      const validationPassed = validateHoldingComplete({
        ticker: holding.ticker,
        purchasePrice: holding.purchasePrice,
        currentPrice: holding.currentPrice,
        currency: holding.currency,
        shares: holding.shares
      });

      if (!validationPassed) {
        console.error('❌ Validation failed - submission blocked');
        setPriceStatus('failed');
        setIsLoading(false);
        return;
      }

      console.log('✅ All validations passed - proceeding with submission');
      console.log('=====================');

      await onAddHolding(holding);
      setPriceStatus('success');

      setFormData({
        ticker: '',
        name: '',
        type: 'crypto',
        shares: '',
        purchasePrice: '',
        currency: 'IDR'
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding holding:', error);
      setPriceStatus('failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setPriceStatus(null), 3000);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed rounded-lg text-secondary hover:border-primary hover:text-primary transition-all duration-120"
        style={{ borderRadius: 'var(--radius-md)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        + Add New Holding
      </button>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[17px] font-semibold">Add New Holding</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="btn-glass"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Ticker *</label>
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              placeholder="BTC, AAPL, etc."
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Bitcoin, Apple Inc."
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            >
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="bond">Bond</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Currency *</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            >
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Shares *</label>
            <input
              type="number"
              step="any"
              value={formData.shares}
              onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
              placeholder="0.5"
              className="w-full px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors tabular-nums"
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Buy Price *</label>
            <input
              type="number"
              step="any"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              placeholder="65000000"
              className="w-full px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors tabular-nums"
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            />
          </div>

          <div className="flex items-center justify-center bg-[var(--glass)] rounded-lg px-4 py-3 text-sm text-secondary" style={{ borderRadius: 'var(--radius-md)' }}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span>
                Fetching current price...
              </span>
            ) : priceStatus === 'success' ? (
              <span className="text-positive">✓ Price fetched automatically</span>
            ) : priceStatus === 'failed' ? (
              <span className="text-negative">✗ Using buy price as current</span>
            ) : (
              <span>Current price auto-fetched</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Holding'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
