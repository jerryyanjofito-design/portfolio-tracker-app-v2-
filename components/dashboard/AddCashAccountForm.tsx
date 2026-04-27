import { useState } from 'react';
import { CashAccount, Currency } from '@/lib/types';

interface AddCashAccountFormProps {
  onAddCashAccount: (account: CashAccount) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function AddCashAccountForm({ onAddCashAccount, isOpen: controlledIsOpen, onToggle }: AddCashAccountFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const [formData, setFormData] = useState({
    name: '',
    currency: 'IDR' as Currency,
    amount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const account: CashAccount = {
      id: Date.now().toString(),
      name: formData.name,
      accountName: formData.name,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      balance: parseFloat(formData.amount)
    };

    onAddCashAccount(account);
    setFormData({
      name: '',
      currency: 'IDR',
      amount: ''
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed rounded-lg text-secondary hover:border-primary hover:text-primary transition-all duration-120"
        style={{ borderRadius: 'var(--radius-md)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        + Add Cash Account
      </button>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[17px] font-semibold">Add Cash Account</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="btn-glass"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-secondary">Account Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Indodax, DBS, etc."
            className="w-full px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors"
            style={{ borderRadius: 'var(--radius-md)' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-secondary">Currency *</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
            className="w-full px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors"
            style={{ borderRadius: 'var(--radius-md)' }}
            required
          >
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-secondary">Balance *</label>
          <input
            type="number"
            step="any"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="25000000"
            className="w-full px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors tabular-nums"
            style={{ borderRadius: 'var(--radius-md)' }}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            Add Account
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
