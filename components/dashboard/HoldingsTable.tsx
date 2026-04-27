import { Holding, Currency } from '@/lib/types';
import { formatIDR, formatNumber } from '@/lib/calculations';
import { useState } from 'react';
import { convertToIDR, FX_RATES } from '@/lib/fxRates';

function convertIDRToNative(amount: number, currency: Currency): number {
  switch (currency) {
    case 'IDR':
      return amount;
    case 'SGD':
      return amount / FX_RATES.SGD_TO_IDR;
    case 'USD':
      return amount / FX_RATES.USD_TO_IDR;
    default:
      return amount;
  }
}

interface HoldingsTableProps {
  holdings: Holding[];
  onDeleteHolding?: (id: string) => void;
  onRefreshPrice?: (id: string, newPrice: number) => void;
  onBuySell?: (holding: Holding) => void;
}

export default function HoldingsTable({ holdings, onDeleteHolding, onRefreshPrice, onBuySell }: HoldingsTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: string } | null>(null);

  if (holdings.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <p className="text-secondary text-center py-8">
          No holdings yet. Add your first investment below.
        </p>
      </div>
    );
  }

  return (
    <div className="grid-holdings">
      {/* Column Headers - Hidden on mobile */}
      <div className="hidden sm:grid grid-cols-7 gap-2 sm:gap-4 px-3 sm:px-5 pb-3 text-[11px] uppercase text-tertiary font-medium tracking-wider">
        <div>Asset</div>
        <div className="text-right">Shares</div>
        <div className="text-right">Avg Price</div>
        <div className="text-right">Current</div>
        <div className="text-right">Value</div>
        <div className="text-right">P&L</div>
        <div className="text-right">Actions</div>
      </div>

      {holdings.map((holding) => {
        // ✅ STRICT CONTRACT: Prices are stored in native currency
        // Convert to IDR ONLY for calculations
        const purchasePriceNative = holding.purchasePrice;
        const currentPriceNative = holding.currentPrice;
        const currency = holding.currency;

        // Convert to IDR for calculations (ONLY here!)
        const purchasePriceIDR = convertToIDR(purchasePriceNative, currency);
        const currentPriceIDR = convertToIDR(currentPriceNative, currency);

        // Core calculations in IDR
        const valueIDR = holding.shares * currentPriceIDR;
        const costBasisIDR = holding.shares * purchasePriceIDR;
        const plIDR = valueIDR - costBasisIDR;
        const plPercent = costBasisIDR > 0 ? (plIDR / costBasisIDR) * 100 : 0;

        // USD display only for original USD holdings (use native prices)
        let valueUSD: number | null = null;
        let plUSD: number | null = null;

        if (currency === 'USD') {
          valueUSD = holding.shares * currentPriceNative;
          const costBasisUSD = holding.shares * purchasePriceNative;
          plUSD = valueUSD - costBasisUSD;
        } else if (currency === 'IDR') {
          valueUSD = valueIDR / FX_RATES.USD_TO_IDR;
          plUSD = plIDR / FX_RATES.USD_TO_IDR;
        } else if (currency === 'SGD') {
          valueUSD = valueIDR / FX_RATES.USD_TO_IDR;
          plUSD = plIDR / FX_RATES.USD_TO_IDR;
        }

        return (
          <div
            key={holding.id}
            className="hover-reveal-row grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-4 items-start sm:items-center px-3 sm:px-5 py-3"
          >
            {/* Asset Column - Mobile header row, Desktop first column */}
            <div className="flex items-center justify-between sm:block">
              <div className="sm:hidden text-[10px] uppercase text-tertiary font-medium tracking-wider mb-1">
                Asset
              </div>
              <div>
                <p className="text-[16px] font-bold text-primary">{holding.ticker}</p>
                <p className="text-[11px] text-secondary">{holding.name}</p>
              </div>
              {/* Mobile Actions */}
              <div className="flex items-center gap-1 sm:hidden">
                {/* Edit Price */}
                {editingPrice?.id === holding.id ? (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="any"
                      value={editingPrice.price}
                      onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                      className="w-16 px-2 py-1 bg-glass border rounded text-sm text-right focus:outline-none focus:border-accent"
                      placeholder="Price"
                    />
                    <button
                      onClick={() => {
                        const newPriceIDR = parseFloat(editingPrice.price);
                        if (!isNaN(newPriceIDR) && newPriceIDR > 0) {
                          const nativePrice = convertIDRToNative(newPriceIDR, holding.currency);
                          onRefreshPrice?.(holding.id, nativePrice);
                          setEditingPrice(null);
                        }
                      }}
                      className="btn-glass text-positive"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingPrice(null)}
                      className="btn-glass"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const currentPriceIDR = convertToIDR(holding.currentPrice, holding.currency);
                      setEditingPrice({ id: holding.id, price: currentPriceIDR.toString() });
                    }}
                    className="btn-glass"
                    title="Manually set current price"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    ↻
                  </button>
                )}

                {/* Buy/Sell */}
                {onBuySell && (
                  <button
                    onClick={() => onBuySell(holding)}
                    className="btn-glass text-positive"
                    title="Buy/Sell"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    +
                  </button>
                )}

                {/* Delete */}
                {onDeleteHolding && (
                  <button
                    onClick={() => onDeleteHolding(holding.id)}
                    className="btn-glass text-negative"
                    title="Delete holding"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Data Rows - Hidden on Desktop */}
            <div className="sm:hidden space-y-2">
              {/* Shares */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-tertiary font-medium tracking-wider">Shares</span>
                <div className="text-right">
                  <p className="text-[14px] font-bold tabular-nums">{formatNumber(holding.shares)}</p>
                  <p className="text-[11px] text-secondary">{holding.type}</p>
                </div>
              </div>

              {/* Avg Price */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-tertiary font-medium tracking-wider">Avg Price</span>
                <div className="text-right">
                  <p className="text-[14px] tabular-nums">{formatIDR(purchasePriceIDR)}</p>
                  {currency === 'USD' ? (
                    <p className="text-[11px] text-secondary">
                      ${formatNumber(purchasePriceNative)} USD
                    </p>
                  ) : currency === 'SGD' ? (
                    <p className="text-[11px] text-secondary">
                      ${formatNumber(purchasePriceNative)} SGD
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Current Price */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-tertiary font-medium tracking-wider">Current</span>
                <div className="text-right">
                  <p className="text-[14px] tabular-nums">{formatIDR(currentPriceIDR)}</p>
                  {currency === 'USD' && valueUSD !== null ? (
                    <p className="text-[11px] text-secondary">
                      ${formatNumber(currentPriceNative)} USD
                    </p>
                  ) : currency === 'SGD' && valueUSD !== null ? (
                    <p className="text-[11px] text-secondary">
                      ${formatNumber(currentPriceNative)} SGD
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Value */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-tertiary font-medium tracking-wider">Value</span>
                <div className="text-right">
                  <p className="text-[14px] font-bold tabular-nums">{formatIDR(valueIDR)}</p>
                  {valueUSD !== null && (
                    <p className="text-[11px] text-secondary">
                      ${formatNumber(valueUSD)} USD
                    </p>
                  )}
                </div>
              </div>

              {/* P&L */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-tertiary font-medium tracking-wider">P&L</span>
                <div className="text-right">
                  <span className={`pill-badge ${plIDR >= 0 ? 'pill-positive' : 'pill-negative'}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Columns - Hidden on Mobile */}
            {/* Shares Column */}
            <div className="hidden sm:block text-right">
              <p className="text-[15px] font-bold tabular-nums">{formatNumber(holding.shares)}</p>
              <p className="text-[12px] text-secondary">{holding.type}</p>
            </div>

            {/* Avg Price Column */}
            <div className="hidden sm:block text-right">
              <p className="text-[15px] tabular-nums">{formatIDR(purchasePriceIDR)}</p>
              {currency === 'USD' ? (
                <p className="text-[12px] text-secondary">
                  ${formatNumber(purchasePriceNative)} USD
                </p>
              ) : currency === 'SGD' ? (
                <p className="text-[12px] text-secondary">
                  ${formatNumber(purchasePriceNative)} SGD
                </p>
              ) : null}
            </div>

            {/* Current Price Column */}
            <div className="hidden sm:block text-right">
              <p className="text-[15px] tabular-nums">{formatIDR(currentPriceIDR)}</p>
              {currency === 'USD' && valueUSD !== null ? (
                <p className="text-[12px] text-secondary">
                  ${formatNumber(currentPriceNative)} USD
                </p>
              ) : currency === 'SGD' && valueUSD !== null ? (
                <p className="text-[12px] text-secondary">
                  ${formatNumber(currentPriceNative)} SGD
                </p>
              ) : null}
            </div>

            {/* Value Column */}
            <div className="hidden sm:block text-right">
              <p className="text-[15px] font-bold tabular-nums">{formatIDR(valueIDR)}</p>
              {valueUSD !== null && (
                <p className="text-[12px] text-secondary">
                  ${formatNumber(valueUSD)} USD
                </p>
              )}
            </div>

            {/* P&L Column with Pill Badge */}
            <div className="hidden sm:block text-right">
              <span className={`pill-badge ${plIDR >= 0 ? 'pill-positive' : 'pill-negative'}`}>
                {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
              </span>
            </div>

            {/* Actions Column - Desktop only */}
            <div className="hidden sm:block text-right flex items-center justify-end gap-2">
              {/* Edit Price */}
              {editingPrice?.id === holding.id ? (
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    value={editingPrice.price}
                    onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                    className="w-20 px-2 py-1 bg-glass border rounded text-sm text-right focus:outline-none focus:border-accent"
                    placeholder="Price (IDR)"
                  />
                  <button
                    onClick={() => {
                      const newPriceIDR = parseFloat(editingPrice.price);
                      if (!isNaN(newPriceIDR) && newPriceIDR > 0) {
                        const nativePrice = convertIDRToNative(newPriceIDR, holding.currency);
                        onRefreshPrice?.(holding.id, nativePrice);
                        setEditingPrice(null);
                      }
                    }}
                    className="btn-glass text-positive"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingPrice(null)}
                    className="btn-glass"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const currentPriceIDR = convertToIDR(holding.currentPrice, holding.currency);
                    setEditingPrice({ id: holding.id, price: currentPriceIDR.toString() });
                  }}
                  className="btn-glass row-actions"
                  title="Manually set current price"
                >
                  ↻
                </button>
              )}

              {/* Buy/Sell */}
              {onBuySell && (
                <button
                  onClick={() => onBuySell(holding)}
                  className="btn-glass row-actions text-positive"
                  title="Buy/Sell"
                >
                  +
                </button>
              )}

              {/* Delete */}
              {onDeleteHolding && (
                <button
                  onClick={() => onDeleteHolding(holding.id)}
                  className="btn-glass row-actions text-negative"
                  title="Delete holding"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
