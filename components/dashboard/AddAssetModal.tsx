'use client';

import { useState, useEffect } from 'react';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (name: string, value: number, type: 'business' | 'asset') => void;
}

export default function AddAssetModal({
  isOpen,
  onClose,
  onAddAsset
}: AddAssetModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'business' | 'asset'>('business');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setValue('');
      setType('business');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const valueNum = parseFloat(value);
    if (isNaN(valueNum) || valueNum < 0) {
      setError('Value must be a non-negative number');
      return;
    }

    setLoading(true);

    try {
      await onAddAsset(name.trim(), valueNum, type);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="glass-card-elevated w-full max-w-md"
        style={{ padding: '24px' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[17px] font-semibold">Add Asset</h2>
          <button
            onClick={onClose}
            className="btn-glass"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">Asset Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('business')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  type === 'business'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={loading}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setType('asset')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  type === 'asset'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={loading}
              >
                Other Asset
              </button>
            </div>
            {type === 'business' && (
              <p className="text-sm text-secondary mt-2">
                Examples: Studioverse, business equity, company assets
              </p>
            )}
            {type === 'asset' && (
              <p className="text-sm text-secondary mt-2">
                Examples: Real estate, vehicles, collectibles, equipment
              </p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-secondary">
              Asset Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="e.g., Studioverse, Car, Equipment"
              disabled={loading}
              required
            />
          </div>

          {/* Value Input */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium mb-2 text-secondary">
              Value (IDR)
            </label>
            <input
              id="value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums text-primary"
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="Enter asset value"
              disabled={loading}
              required
            />
          </div>

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
              {loading ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
