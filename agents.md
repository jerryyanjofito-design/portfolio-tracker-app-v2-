# AGENTS.md — Wealth Portfolio OS Guidelines

**Always read this file first**, then ORCHESTRATOR.md and relevant agent files in `/agents/`.

This is a **Luxury Personal Wealth OS** (not a basic tracker).  
Base currency: **IDR**. Long-term goal: **15,000,000,000 IDR**.

Tracks: Stocks, ETFs, Crypto, Bonds, Gold, multiple cash accounts (Indodax, DBS, Expresi, Studioverse, etc.), and SGD holdings (always converted to IDR).

---

## Core Principles

- **Precision First**: All financial math belongs to Portfolio Engine. Use `bigint` or Decimal — never raw `number`.
- **Data Integrity**: Backend/Data owns schema, RLS, and immutability. Transactions are append-only where possible.
- **Currency Rule**: Everything aggregates in **IDR**. Store native currency + transaction-time FX rate. Never apply today's rate to historical data.
- **Consistency**: Strictly follow existing patterns, naming, and architecture.
- **Premium Experience**: Dark mode only, minimalist, glassmorphism, Apple-level calm & trustworthy feel.
- **Safety**: No direct investment advice. All insights must be data-grounded and neutral.

---

## Agent Responsibilities & Collaboration

See `ORCHESTRATOR.md` for exact workflow.

- **Backend / Data** (`agents/backend-data.md`): Supabase schema, RLS, migrations, queries, integrity.
- **Market Data** (`agents/market-data.md`): CoinGecko (crypto), Yahoo/TwelveData (stocks/ETFs), FX rates, normalization & caching.
- **Portfolio Engine** (`agents/portfolio-engine.md`): **All** calculations — net worth, gain/loss, cost basis, returns, currency conversion.
- **AI Analyst** (`agents/ai-analyst.md`): Daily insights, chat explanations, risk signals.
- **UI Designer** (`agents/ui-designer.md`): Layout, components, animations, premium dark-mode UI.

**Data Flow Order** (never violate):
Backend/Data → Market Data → Portfolio Engine → AI Analyst → UI Designer

---

## Tech Stack & Standards

- Next.js 15 (App Router), TypeScript (strict)
- TailwindCSS + shadcn/ui, Framer Motion (subtle only)
- Supabase (PostgreSQL, Auth, Realtime)
- Prefer Server Components for data fetching
- Functional components only, small & reusable

**Key Directories**:
- `app/` → routes
- `components/` → `ui/`, `portfolio/`, `insights/`
- `lib/` → utilities, money formatters
- `types/` → shared types
- `supabase/` → schema & migrations

---

## Workflow (Every Task)

1. Identify involved agents via ORCHESTRATOR.md
2. Explore context and existing code
3. Output a clear step-by-step plan with agent handoffs
4. Make minimal, targeted changes
5. Verify with lint, type-check, build
6. Suggest exact commands

**After changes**: Always run `npm run lint`, `tsc --noEmit`, `npm run build`.

---

## Forbidden Practices

- Using `any` or raw `number` for monetary values
- Bypassing any agent (e.g. direct API calls, manual math)
- Hardcoding data or secrets
- Large unrequested refactors
- Cluttered or non-minimalist UI
- Giving "buy/sell/hold" advice

**Goal**: Build a calm, precise, private-banking-grade Wealth OS.

## ⚡ MVP Mode (Temporary Override)

When explicitly instructed to enter "MVP Mode", the following overrides apply:

### Purpose
Enable fast iteration and successful deployment without being blocked by strict architectural or typing constraints.

### Overrides

- TypeScript strictness can be relaxed
- Temporary use of `any` is allowed ONLY to unblock build issues
- Financial calculations can temporarily use `number` where precision is not critical for MVP
- Portfolio Engine rules may be simplified for display-only calculations
- Cross-agent workflow can be shortened (not all agents required for minor fixes)

### Still Required

- Do NOT remove core features (portfolio, cash, snapshots)
- Do NOT break runtime functionality
- Do NOT change database schema destructively
- Maintain IDR as base currency
- Keep UI clean and consistent

### Priority Shift

From:
- Precision, correctness, architecture

To:
- Functionality, deployability, usability

### Exit Condition

After successful deployment:
- Gradually restore strict typing
- Migrate all calculations back to Portfolio Engine
- Remove temporary `any` usage
- Re-enable full agent orchestration rules