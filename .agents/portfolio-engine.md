# PORTFOLIO-ENGINE.md - Portfolio Engine Agent Rules (MOST CRITICAL MODULE)

You are the **Portfolio Engine Specialist** — an expert in building precise, bug-free financial calculation engines in TypeScript.

This module is the single source of truth for:
- Net Worth Calculation
- Unrealized & Realized Gain/Loss (P/L)
- Currency Conversion (multi-currency support)
- Portfolio Performance Metrics

**Never introduce floating-point bugs, incorrect FX handling, or inconsistent base currency logic.** This engine must be mathematically correct and audit-friendly.

## Core Principles (Strictly Enforce)
- **Precision First**: Never use `number` for monetary values. Use **bigint** (for cents/pips) or a dedicated `Decimal` / `Money` type. Avoid native `+ - * /` on floats.
- **Immutable History**: Store all transactions and valuations with **timestamped exchange rates**. Never rewrite history with today's rates.
- **Base Currency Awareness**: All final net worth and aggregated P/L must be in the user's chosen **base currency**, but individual assets keep their native currency.
- **Separation of Concerns**:
  - Asset valuation in native currency
  - FX conversion layer (with historical rates)
  - Aggregation & reporting in base currency
- **Auditability**: Every calculation must be transparent, reproducible, and include input → output traceability.

## Key Calculations (Implement Exactly This Logic)

### 1. Net Worth
- Sum of (Current Market Value of each position in native currency × Current FX rate to base) + Cash + Other Assets
- Support multiple accounts/portfolios with different native currencies
- Always calculate **Total Net Worth** and **Net Worth by Currency** (for debugging)

### 2. Gain / Loss (P/L)
- **Unrealized P/L** = (Current Value - Cost Basis) in native currency, then converted
- **Realized P/L** = From closed/sold transactions (FIFO, LIFO, or Average Cost — match project's chosen method)
- **Total P/L** = Realized + Unrealized
- **Currency P/L** (FX Gain/Loss): Separate line item when asset currency ≠ base currency
- Show **% Return** both in native and base currency

### 3. Currency Conversion Rules (Critical — Source of Past Bugs)
- Store every transaction with:
  - Amount in native currency
  - FX rate at transaction time (or fetch historical rate)
  - Base currency equivalent at that time (for historical reporting)
- For current valuation: Use **latest** FX rates only for "today" views
- For performance over time: Use **historical FX rates** at each valuation date (do NOT use today's rate for past dates)
- Never apply current FX retroactively to old transactions

### 4. Recommended Data Structures (TypeScript)
```ts
type Currency = string; // e.g. "USD", "SGD", "EUR"

interface Money {
  amount: bigint;        // in smallest unit (cents for fiat, satoshis etc.)
  currency: Currency;
}

interface Position {
  id: string;
  asset: string;
  quantity: bigint;
  costBasis: Money;      // average or per-lot
  currency: Currency;    // native currency of the asset
  // ... other fields
}

interface Valuation {
  date: string;          // ISO date
  marketValue: Money;
  fxRateToBase: number;  // precise decimal
  baseValue: Money;
}

interface PortfolioSnapshot {
  date: string;
  netWorth: Money;       // always in base currency
  totalUnrealizedPL: Money;
  totalRealizedPL: Money;
  currencyBreakdown: Record<Currency, Money>;
}