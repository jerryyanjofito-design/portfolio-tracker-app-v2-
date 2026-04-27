# Portfolio Tracker — Full UI Redesign Brief

Read this file fully before making any changes. Implement everything across all components and files.

---

## Goal

Redesign the entire app to match Apple's dark design language: pure black base, glassmorphism surfaces, premium typography, smooth micro-interactions. Every component gets overhauled — no exceptions.

---

## Design Tokens

```css
/* Colors */
--bg: #000000;
--bg-elevated: #0a0a0a;
--glass: rgba(255, 255, 255, 0.05);
--glass-hover: rgba(255, 255, 255, 0.08);
--border: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.12);
--accent: #0A84FF;
--positive: #30D158;
--negative: #FF453A;
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.50);
--text-tertiary: rgba(255, 255, 255, 0.30);

/* Typography */
--font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;

/* Radii */
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 20px;
--radius-pill: 980px;

/* Spacing (8pt grid) */
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
```

---

## Glass Card — Apply to Every Card/Panel

```css
background: var(--glass);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--border);
border-radius: var(--radius-lg);
box-shadow:
  0 0 0 0.5px rgba(255,255,255,0.06) inset,
  0 20px 40px rgba(0,0,0,0.4),
  0 1px 0 rgba(255,255,255,0.08) inset;
```

---

## Page Layout

- Body background: `radial-gradient(ellipse 80% 50% at 20% 20%, rgba(10,132,255,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(48,209,88,0.04), transparent 60%), #000`
- Max content width: 1200px, centered, padding: 0 24px
- Section vertical gap: 32px
- Card-to-card gap: 16px
- All card inner padding: 24px

---

## Navbar

- Height: 52px, sticky top
- Background: `rgba(0,0,0,0.72)`, `backdrop-filter: blur(20px)`
- Bottom border: `1px solid rgba(255,255,255,0.06)`
- App name: left-aligned, 17px, font-weight 600
- Action buttons: right-aligned, pill-shaped glass buttons

---

## Hero — Net Worth Card

- Full-width glass card, padding 40px
- "Total Net Worth" label: 12px uppercase, var(--text-tertiary), letter-spacing 0.08em
- Amount: 52px, font-weight 700, letter-spacing -0.03em, font-variant-numeric: tabular-nums
- Today's gain: 15px, with colored arrow icon inline, var(--positive) or var(--negative)
- Unrealized P&L: pill badge — colored text on 12% opacity matching color background, border-radius pill
- 2-column stat row below (Cash / Invested / etc): 14px label secondary + 17px value bold, separated by 1px vertical dividers
- Net Worth Goal progress bar:
  - Height: 3px, border-radius pill
  - Fill: linear-gradient(90deg, var(--accent), var(--positive))
  - Track: rgba(255,255,255,0.08)
  - Label: "X% to goal" right-aligned, 12px var(--text-tertiary)

---

## Portfolio Performance Chart

- Glass card, no heavy borders on the chart itself
- Chart line: 2px stroke, color var(--accent), drop-shadow glow filter
- Area fill: gradient from rgba(10,132,255,0.15) to transparent
- Time range pills — `1W 1M 3M ALL`:
  - Default: rgba(255,255,255,0.06) background, pill shape
  - Selected: rgba(255,255,255,0.12) background, white text
  - Transition: 120ms ease
- Axis labels: 11px, var(--text-tertiary)
- Hover tooltip: glass card, 12px font, shadow, no harsh border, fade-in 150ms

---

## Section Header Pattern

Apply consistently to every section (Cash Accounts, Assets, Holdings, Allocation):

```
SECTION LABEL              [+ Add Item]
──────────────────────────────────────
```

- Label: 11px, font-weight 600, letter-spacing 0.08em, uppercase, var(--text-tertiary)
- Divider: `border-top: 1px solid rgba(255,255,255,0.06)`, margin-top 12px
- Add button: glass pill, 13px, var(--accent) text

---

## Cash Accounts

- Each account is a row inside one glass card (not individual cards)
- Row height: 56px, flex with vertical center alignment
- Account name: 15px bold var(--text-primary)
- Sub-label/tag: 12px var(--text-secondary) below name
- Amount: right-aligned, 15px bold, font-variant-numeric tabular-nums
- Edit/delete icons: opacity 0 by default, opacity 1 on row hover — transition 120ms
- Row hover: background rgba(255,255,255,0.03)
- Row separator: 1px rgba(255,255,255,0.05)

---

## Assets Section

- Glass card with inner grid: Business Assets | Other Assets | Total Assets
- Each column: label 11px uppercase secondary + value 22px bold primary
- Column dividers: 1px rgba(255,255,255,0.06) vertical lines
- Category rows below (e.g. Studiomae): tag pill + values in columns

---

## Holdings Table

Replace any HTML `<table>` with CSS Grid. Each holding is its own glass card row.

**Column layout:** `[Asset] [Shares] [Avg Price] [Current Price] [Value] [P&L] [Actions]`

- Column headers: 11px uppercase, var(--text-tertiary), not bold, padding-bottom 8px
- Each row:
  - Glass card: `background: rgba(255,255,255,0.03)`, border-radius 14px, padding 14px 20px
  - Gap between rows: 8px
  - Hover: `box-shadow: 0 0 0 1px rgba(255,255,255,0.10)`, background rgba(255,255,255,0.05), transition 120ms
- Ticker: 17px bold var(--text-primary)
- Exchange/name: 12px var(--text-secondary)
- All numbers: font-variant-numeric tabular-nums, right-aligned
- P&L pill: `border-radius: var(--radius-pill)`, padding 4px 10px, font-size 13px, font-weight 500
  - Positive: color var(--positive), background rgba(48,209,88,0.12)
  - Negative: color var(--negative), background rgba(255,69,58,0.12)
- Action icons (edit/delete): hidden until row hover, ghost icon buttons

---

## Buttons

**Primary:**
```css
background: var(--accent);
border-radius: var(--radius-pill);
padding: 8px 20px;
font-size: 15px;
font-weight: 500;
color: #fff;
border: none;
transition: filter 80ms ease, transform 80ms ease;
```
Hover: `filter: brightness(1.1); transform: translateY(-1px)`

**Secondary / Glass:**
```css
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.10);
border-radius: var(--radius-pill);
padding: 7px 18px;
font-size: 14px;
color: var(--text-primary);
transition: background 120ms ease;
```
Hover: `background: rgba(255,255,255,0.13)`

**Force Refresh button:** redesign as glass pill secondary button with a ↻ icon inline.

No square corners anywhere. Minimum border-radius on any button: 10px.

---

## Donut / Allocation Charts

- Two charts side by side in glass cards: Portfolio Allocation + Net Worth Allocation
- Donut: 3px gap between segments, rounded segment end caps (`strokeLinecap: round`)
- Center text: 22px bold value or %, 12px secondary label below
- Legend: colored dot (8px circle) + name + value, CSS grid layout, 13px font
- Card padding: 24px

---

## Animations

**Page load — staggered fade-up:**
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Apply to each card with increasing animation-delay (0ms, 60ms, 120ms, 180ms...) */
animation: fadeUp 500ms ease forwards;
```

**Number count-up:** Animate all large currency/number values from 0 to final on mount. Duration: 600ms, ease-out.

**Hover transitions:** All interactive rows and buttons: `transition: 120ms ease`

**Chart tooltip:** `opacity` transition 150ms ease

---

## Scrollbar

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
```

No overflow scrollbars visible inside cards.

---

## Checklist — Every Item Must Be Done

- [ ] Apply glass card treatment to every panel/card
- [ ] Page background replaced with gradient mesh on pure black
- [ ] Sticky glass navbar
- [ ] Hero net worth card redesigned (large type, pill badges, progress bar)
- [ ] Chart with glow line, glass time-range pills, glass tooltip
- [ ] All section headers follow the uppercase label + divider pattern
- [ ] Cash accounts as hover-reveal rows inside one card
- [ ] Holdings table replaced with CSS Grid glass-card rows
- [ ] P&L values always use pill badges (green/red tint)
- [ ] Assets section grid layout
- [ ] All buttons pill-shaped (Force Refresh included)
- [ ] Donut charts with rounded segments and legend
- [ ] Staggered page load animation
- [ ] Number count-up animation on hero values
- [ ] Custom scrollbar styling
- [ ] All numbers use `font-variant-numeric: tabular-nums`
- [ ] No square corners anywhere in the UI