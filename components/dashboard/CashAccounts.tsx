import { CashAccount } from '@/lib/types';
import { formatIDR } from '@/lib/calculations';

interface CashAccountsProps {
  cashAccounts: CashAccount[];
  onDeleteAccount?: (id: string) => void;
  onUpdateAccount?: (id: string, amount: number) => void;
}

export default function CashAccounts({ cashAccounts, onDeleteAccount, onUpdateAccount }: CashAccountsProps) {
  if (cashAccounts.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <p className="text-secondary text-center py-8">
          No cash accounts yet. Add your first account below.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '12px sm:px-6 sm:py-6' }}>
      <div className="space-y-0">
        {cashAccounts.map((account, index) => {
          const accountName = account.accountName || account.name || 'Unknown Account';
          const amount = account.balance !== undefined ? account.balance : account.amount;

          if (amount === undefined || amount === null) {
            console.warn('Invalid cash account amount:', account);
            return null;
          }

          let displayValue: string;
          if (account.currency === 'IDR') {
            displayValue = formatIDR(amount);
          } else {
            displayValue = `$${amount.toLocaleString()} ${account.currency}`;
          }

          return (
            <div
              key={account.id}
              className={`hover-reveal-row flex flex-col sm:flex-row sm:items-center sm:justify-between ${index > 0 ? 'pt-3' : ''}`}
              style={{
                minHeight: 'auto',
                borderBottom: index < cashAccounts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div className="mb-2 sm:mb-0">
                <p className="text-[14px] sm:text-[15px] font-bold text-primary">{accountName}</p>
                <p className="text-[11px] sm:text-[12px] text-secondary">{account.currency}</p>
              </div>
              <div className="flex items-center justify-between sm:gap-3">
                <p className="text-[14px] sm:text-[15px] font-bold tabular-nums">{displayValue}</p>
                <div className="flex gap-1 row-actions">
                  {onUpdateAccount && (
                    <button
                      onClick={() => {
                        const newAmount = prompt(`Enter new amount for ${accountName}:`, amount?.toString() || '0');
                        if (newAmount !== null && !isNaN(Number(newAmount))) {
                          onUpdateAccount(account.id, Number(newAmount));
                        }
                      }}
                      className="btn-glass"
                      title="Edit amount"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      ✏️
                    </button>
                  )}
                  {onDeleteAccount && (
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="btn-glass text-negative"
                      title="Delete account"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}
