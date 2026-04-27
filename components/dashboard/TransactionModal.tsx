'use client';

import { useState, useEffect } from 'react';
import { Holding } from '@/lib/types';
import { convertToIDR, FX_RATES } from '@/lib/fxRates';
import { formatIDR, formatNumber } from '@/lib/calculations';

interface TransactionModalProps {
  holding: Holding;
  isOpen: boolean;
  onClose: () => void;
  onTransactionComplete: () => void;
}

export default function TransactionModal({
  holding,
  isOpen,
  onClose,
  onTransactionComplete
}: TransactionModalProps) {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens or holding changes
  useEffect(() => {
    if (isOpen) {
      setType('buy');
      setQuantity('');
      setError('');
      // Pre-fill price with current price for convenience (converted to IDR)
      const currentPriceIDR = convertToIDR(holding.currentPrice, holding.currency);
      setPrice(currentPriceIDR.toString());
    }
  }, [isOpen, holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (type === 'sell' && quantityNum > holding.shares) {
      setError(`Cannot sell ${quantityNum} shares when holding only ${holding.shares} shares`);
      return;
    }

    setLoading(true);

    try {
      const { executeTransaction } = await import('@/lib/database');

      // Validate all fields before sending
      if (!holding.id || !holding.id.trim()) {
        throw new Error('Invalid holding ID');
      }
      if (!type || !['buy', 'sell'].includes(type)) {
        throw new Error('Invalid transaction type');
      }
      if (isNaN(quantityNum) || quantityNum <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Price must be a positive number');
      }

      // Convert IDR price back to native currency for database storage
      const nativePrice = priceNum / (holding.currency === 'USD' ? FX_RATES.USD_TO_IDR :
                                      holding.currency === 'SGD' ? FX_RATES.SGD_TO_IDR : 1);

      console.log('=== Transaction Payload ===');
      console.log('Holding ID:', holding.id);
      console.log('Type:', type);
      console.log('Quantity:', quantityNum);
      console.log('Price (IDR):', priceNum);
      console.log('Native Price:', nativePrice);
      console.log('Currency:', holding.currency);

      const result = await executeTransaction(
        holding.id,
        type,
        quantityNum,
        nativePrice
      );

      if (result.success) {
        onTransactionComplete();
        onClose();
      } else {
        setError(result.error || 'Transaction failed');
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div
        className="glass-card-elevated w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
        style={{ padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[17px] font-semibold">
            {type === 'buy' ? 'Buy' : 'Sell'} {holding.ticker}
          </h2>
          <button
            onClick={onClose}
            className="btn-glass"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Transaction Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('buy')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  type === 'buy'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={loading}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setType('sell')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  type === 'sell'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={loading}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Current Holdings Info */}
          {type === 'sell' && (
            <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-sm text-secondary">
                <span className="font-medium text-primary">Available Shares:</span>{' '}
                {holding.shares.toLocaleString()}
              </p>
              <p className="text-sm text-secondary">
                <span className="font-medium text-primary">Avg Price:</span>{' '}
                {formatIDR(convertToIDR(holding.purchasePrice, holding.currency))}
                {holding.currency !== 'IDR' && (
                  <span className="text-xs text-secondary ml-1">
                    (${formatNumber(holding.purchasePrice)} {holding.currency})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-secondary">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="Enter quantity"
              disabled={loading}
              required
            />
          </div>

          {/* Price Input */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2 text-secondary">
              Price (IDR)
            </label>
            <input
              id="price"
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="Enter price in IDR"
              disabled={loading}
              required
            />
            <p className="text-sm text-secondary mt-2">
              Current price: {formatIDR(convertToIDR(holding.currentPrice, holding.currency))}
              {holding.currency !== 'IDR' && (
                <span className="text-xs text-secondary ml-1">
                  (${formatNumber(holding.currentPrice)} {holding.currency})
                </span>
              )}
            </p>
          </div>

          {/* Transaction Summary */}
          {quantity && price && !isNaN(parseFloat(quantity)) && !isNaN(parseFloat(price)) && (
            <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-sm text-secondary">
                <span className="font-medium text-primary">Total Amount:</span>{' '}
                {(parseFloat(quantity) * parseFloat(price)).toLocaleString()} IDR
              </p>
              {type === 'sell' && (
                <p className="text-sm text-secondary">
                  Remaining shares: {holding.shares - parseFloat(quantity)}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[var(--negative)]/10 border border-[var(--negative)]/30 text-[var(--negative)] px-4 py-3 rounded-lg text-sm" style={{ borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Processing...' : type === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
