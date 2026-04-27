'use client';

import { useState } from 'react';
import { AssetAccount } from '@/lib/types';
import { formatIDR, formatNumber } from '@/lib/calculations';

interface AssetAccountsProps {
  assetAccounts: AssetAccount[];
  onDeleteAccount?: (id: string) => void;
  onUpdateAccount?: (id: string, value: number) => void;
}

export default function AssetAccounts({
  assetAccounts,
  onDeleteAccount,
  onUpdateAccount
}: AssetAccountsProps) {
  const [editingValue, setEditingValue] = useState<{ id: string; value: string } | null>(null);

  const handleEditValue = (id: string, currentValue: number) => {
    setEditingValue({ id, value: currentValue.toString() });
  };

  const handleSaveValue = (id: string, newValue: number) => {
    if (!isNaN(newValue) && newValue >= 0) {
      onUpdateAccount?.(id, newValue);
      setEditingValue(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
  };

  // Calculate totals
  const businessAssets = assetAccounts.filter(a => a.type === 'business');
  const otherAssets = assetAccounts.filter(a => a.type === 'asset');
  const totalBusinessValue = businessAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalOtherValue = otherAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalValue = assetAccounts.reduce((sum, asset) => sum + asset.value, 0);

  if (assetAccounts.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <p className="text-secondary text-center py-8">
          No assets yet. Add your first asset below.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '16px sm:px-6 sm:py-6' }}>
      {/* Summary Grid Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6 pb-3 border-b" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center sm:text-center">
          <p className="text-[10px] uppercase text-secondary tracking-wider">Business Assets</p>
          <p className="text-[16px] sm:text-[22px] font-bold text-primary tabular-nums">{formatIDR(totalBusinessValue)}</p>
        </div>
        <div className="text-center sm:text-center border-t sm:border-t-0 sm:border-l sm:border-r" style={{ borderColor: 'rgba(255,255,255,0.06)', paddingTop: '10px', paddingBottom: '10px' }}>
          <p className="text-[10px] uppercase text-secondary tracking-wider">Other Assets</p>
          <p className="text-[16px] sm:text-[22px] font-bold text-primary tabular-nums">{formatIDR(totalOtherValue)}</p>
        </div>
        <div className="text-center sm:text-center">
          <p className="text-[10px] uppercase text-secondary tracking-wider">Total Assets</p>
          <p className="text-[16px] sm:text-[22px] font-bold text-accent tabular-nums">{formatIDR(totalValue)}</p>
        </div>
      </div>

      {/* Asset Rows */}
      <div className="space-y-2">
        {assetAccounts.map((asset) => (
          <div
            key={asset.id}
            className="hover-reveal-row flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.03)',
              minHeight: 'auto',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
              {/* Category Pill */}
              <span className={`pill-badge ${asset.type === 'business' ? 'pill-positive' : 'text-primary'}`} style={{ background: asset.type === 'business' ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.08)', fontSize: '11px', padding: '3px 8px' }}>
                {asset.type === 'business' ? 'Business' : 'Asset'}
              </span>
              <p className="text-[13px] sm:text-[15px] font-bold text-primary">{asset.name}</p>
            </div>

            <div className="flex items-center justify-between sm:gap-3">
              {editingValue?.id === asset.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={editingValue.value}
                    onChange={(e) => setEditingValue({ ...editingValue, value: e.target.value })}
                    className="w-32 px-2 py-1 bg-glass border rounded text-sm text-right focus:outline-none focus:border-accent tabular-nums"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveValue(asset.id, parseFloat(editingValue.value));
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSaveValue(asset.id, parseFloat(editingValue.value))}
                      className="btn-glass text-positive"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-glass"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleEditValue(asset.id, asset.value)}
                  className="text-[15px] font-bold tabular-nums hover:text-accent transition-colors row-actions"
                  title="Edit value"
                >
                  {formatIDR(asset.value)}
                </button>
              )}

              <div className="flex gap-1 row-actions">
                <button
                  onClick={() => onDeleteAccount?.(asset.id)}
                  className="btn-glass text-negative"
                  title="Delete asset"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
