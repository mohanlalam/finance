# 📜 Design System & Visual Specification — Indian Family Wealth Ledger

**Document Version**: 4.0  
**Design Philosophy**: The Private Family Wealth Ledger & Heirloom Vault ("Kosh / Tijori")  
**Authoritative Token Source**: `src/index.css` & `Design.md §3`  

---

## 1. Design Philosophy: The Private Family Wealth Ledger & Heirloom Vault

The user interface rejects generic SaaS fintech clichés (neon crypto gradients, uncalibrated blue-violet buttons, and alarmist red/green day-trading indicators) in favor of a **dignified, private family wealth ledger** engineered specifically for the Indian household of **Rammohan, Padmavathi, and Sai Laxmi**.

### 1.1 Core Aesthetic Anchors
1. **Generational Stewardship over Speculative Trading**:
   - Wealth tracking for an Indian family is about preservation, security, and inter-generational stability.
   - Assets tracked reflect an authentic Indian household portfolio: physical gold bullion and sovereign bonds, compounding term bank deposits (FDs/RDs), real estate holdings, family life and health cover, alongside mutual fund SIPs and equities.
2. **Warm Brass & Heritage Gold as Primary Identity Accent**:
   - Rather than default fintech corporate blue, the primary accent is **Warm Antique Brass & Heritage Gold** (`#c89b3c` / `#d4af37`).
   - Gold is not merely an asset category in this household—it is a cultural anchor of security, family honor, and enduring tangible value.
3. **Archival Vellum & Deep Basalt Vault Materiality**:
   - **Light Mode (Archival Vellum & Linen Canvas)**: Warm parchment canvas (`#fbfbfa`), crisp cream surfaces (`rgba(255, 255, 255, 0.88)`), and warm antique stone/brass hairline borders (`rgba(180, 160, 130, 0.25)`).
   - **Dark Mode (Deep Basalt Vault)**: Deep basalt obsidian slate (`#090c10`), midnight card surfaces (`rgba(15, 20, 28, 0.72)`), and burnished gold specular edge highlights (`rgba(212, 175, 55, 0.14)`).
4. **Restrained, Non-Alarmist Financial Semantics**:
   - Appreciation is conveyed through **Stately Forest Jade** (`#166534` / `#22c55e`), evoking enduring growth rather than casino greens.
   - Drawdowns or liabilities use **Terracotta Garnet** (`#991b1b` / `#e05353`), communicating gravity and attention without panic.

---

## 2. Authoritative Typography System

Typography carries the soul and dignity of the wealth ledger. The application employs a strict, 3-tier typographic pairing:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. DISPLAY & VALUATION SERIF: Newsreader (Google Fonts / Georgia)       │
│    "₹ 1,42,85,000" — Archival ledger elegance, engraved bond pedigree  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. INTERFACE & OPERATIONAL SANS: Plus Jakarta Sans (Humanistic Sans)  │
│    "Fixed Deposits", "Matures in 42 days", "Rammohan" — Crisp legibility│
├────────────────────────────────────────────────────────────────────────┤
│ 3. TABULAR DATA & PRECISION MONO: JetBrains Mono / SF Mono             │
│    "24.500 g", "2.10 tola", "7.10% p.a.", "FOLIO-98214" — Exact numeric │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Font Family Declarations

| Role | Font Family | CSS Custom Property | Usage |
| :--- | :--- | :--- | :--- |
| **Valuation & Ledger Numbers** | `'Newsreader', Georgia, serif` | `--font-display`, `--font-serif` | Total Net Worth, primary card valuations, asset summary totals, hero metrics (`.text-financial`, `.font-ledger`) |
| **Interface & Structural Text** | `'Plus Jakarta Sans', -apple-system, sans-serif` | `--font-sans` | Page titles, navigation labels, table column headers, form inputs, modal dialogs, status badges |
| **Precision Numerics & Codes** | `'JetBrains Mono', 'SF Mono', monospace` | `--font-mono` | Bullion gram weights, tola quantities, FD interest rates, folio numbers, policy IDs, dates |

### 2.2 Typographic Hierarchy & Scale

| Token / Class | Font Family | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.text-financial` | Display Serif | `24px` (`sm: 28px`) | `600` (SemiBold) | `-0.02em` (tnum) | Hero Net Worth amount, asset class total values |
| `.text-page-title` | Display Serif / Sans | `28px` (`sm: 34px`) | `700` (Bold) | `-0.035em` | Screen titles ("Stocks & ETFs", "Gold Bullion") |
| `.text-section-title` | Interface Sans | `20px` (`sm: 24px`) | `700` (Bold) | `-0.025em` | Grouped member headers, widget headings |
| `.text-card-title` | Interface Sans | `15px` | `600` (SemiBold) | `-0.015em` | Holding card titles, deposit bank names |
| `.text-label-small` | Interface Sans | `11px` | `600` (SemiBold) | `normal` | Metric labels ("Invested", "Today's Return") |
| `.text-label-micro` | Interface Sans | `10px` | `700` (Bold) | `+0.04em` | Category badges, tax STCG/LTCG pills |

---

## 3. Authoritative Design Tokens

> ⚠️ **Design Token Invariant**: Never introduce hardcoded hex colors, corner radii, or ad-hoc shadow classes in component code. All visual tokens must map directly to CSS Custom Properties declared in `src/index.css`.

### 3.1 Theme Palette & Canvas Tokens

| Token Name | Dark Mode (Basalt Vault) | Light Mode (Archival Vellum) | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--app-background` | `#090c10` | `#fbfbfa` | Root canvas / viewport background |
| `--surface` | `rgba(15, 20, 28, 0.72)` | `rgba(255, 255, 255, 0.88)` | Primary cards, table bodies, modal surfaces |
| `--surface-secondary` | `rgba(24, 30, 42, 0.75)` | `rgba(246, 244, 238, 0.85)` | Inset metrics, filter bars, table headers |
| `--surface-solid` | `#0d1219` | `#ffffff` | Solid backdrop for bottom sheets & popovers |
| `--border-subtle` | `rgba(212, 175, 55, 0.14)` | `rgba(180, 160, 130, 0.25)` | Standard card and hairline divider borders |
| `--border-luminous` | `rgba(212, 175, 55, 0.32)` | `rgba(200, 155, 60, 0.35)` | Specular gold edge highlights & active borders |

### 3.2 Primary Identity & Accent Tokens

| Token Name | Dark Mode Value | Light Mode Value | Character & Cultural Intent |
| :--- | :--- | :--- | :--- |
| `--accent-gold` | `#d4af37` (soft: `0.15`) | `#c89b3c` (soft: `0.12`) | **Lead Identity**: Radiant 24K bullion & sovereign wealth |
| `--accent-brass` | `#e5b869` (soft: `0.14`) | `#a16207` (soft: `0.10`) | **Heirloom Metal**: Warm antique brass & ledger accents |
| `--accent-blue` | `#60a5fa` (soft: `0.14`) | `#1d4ed8` (soft: `0.08`) | **Treasury Blue**: Lapis reserve, institutional bonds |

### 3.3 Generational Stewardship Semantic Financial Colors

| Semantic State | Base Color Token | Soft Background Token (`-soft`) | Contrast Ratio (WCAG) | Intent & Tone |
| :--- | :--- | :--- | :--- | :--- |
| **Growth / Surplus** | `--positive`: `#22c55e` / `#166534` | `--positive-soft`: `rgba(22, 101, 52, 0.10)` | $> 4.5:1$ (AA) | Stately Forest Jade; durable organic appreciation |
| **Drawdown / Liability** | `--negative`: `#e05353` / `#991b1b` | `--negative-soft`: `rgba(153, 27, 27, 0.09)` | $> 4.5:1$ (AA) | Terracotta Garnet; dignified attention without alarmism |
| **Maturity / Reminder** | `--warning`: `#f59e0b` / `#b45309` | `--warning-soft`: `rgba(180, 83, 9, 0.10)` | $> 4.5:1$ (AA) | Saffron Amber; near-term actions & maturities |

### 3.4 Multi-Asset Category Color Tokens

| Asset Class | Token Name | Hex Color | Cultural / Ledger Association |
| :--- | :--- | :--- | :--- |
| **Physical Gold Bullion** | `--asset-gold` | `#d4af37` | Sovereign bullion, 22K jewelry, hallmarked gold |
| **Fixed Deposits (FD)** | `--asset-fd` | `#0d9488` | Secure bank term reserves (Deep Teal) |
| **Recurring Deposits (RD)** | `--asset-rd` | `#c2410c` | Disciplined installment savings (Terracotta Ochre) |
| **Mutual Funds & SIPs** | `--asset-sip` | `#7e22ce` | Long-term capital compounding (Royal Amethyst) |
| **Real Estate** | `--asset-realestate` | `#15803d` | Tangible immovable property & land (Estate Emerald) |
| **Insurance Policies** | `--asset-insurance` | `#991b1b` | Family security & medical risk cover (Garnet Protection) |

### 3.5 Radii & Elevation Tokens

| Category | Token Name | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Corner Radii** | `--radius-small` | `6px` | Badges, small inputs, buttons |
| | `--radius-medium` | `10px` | List items, action chips, inner cards |
| | `--radius-large` | `16px` | Primary cards, modal dialogs, sheets |
| | `--radius-xl` | `20px` | Hero ledger cards, floating docks |
| | `--radius-pill` | `9999px` | Member switchers, status capsules |
| **Elevations** | `--shadow-card` | `0 2px 8px rgba(28, 25, 23, 0.06)` | Archival card depth with 1px inner refraction highlight |
| | `--shadow-floating` | `0 16px 36px -10px rgba(28, 25, 23, 0.10)` | Floating elevation with warm brass highlight |
| | `--shadow-luminous` | `0 0 25px rgba(200, 155, 60, 0.18)` | Burnished gold ambient aura |

---

## 4. Navigation Architecture

### 4.1 Desktop Sidebar Navigation (`md:` and above)
- Fixed left navigation drawer (`w-64`) with frosted archival backing.
- High-level sections:
  1. **Portfolio Overview** (`Home`, `Widgets`)
  2. **Family Member Switcher** (`All Family`, `Rammohan`, `Padmavathi`, `Sai Laxmi`)
  3. **Asset Registries** (`Stocks`, `Fixed Deposits`, `Recurring Deposits`, `SIPs`, `Gold`, `Real Estate`, `Insurance`, `Document Vault`, `Tax Harvesting`)
  4. **Vault Tools** (`Smart Import`, `Backup/Restore`, `Lock Application`)

### 4.2 Suspended Ledger Mobile Dock (`< 768px`)
- **Dimensions & Offset**: Max width `410px` centered (`mx-auto`), Height `58px`, Curvature `rounded-full` (`9999px`), Floating bottom clearance `max(env(safe-area-inset-bottom, 0px) + 8px, 12px)`.
- **Surface**: Translucent ledger glass (`--nav-glass-bg`, `backdrop-filter: blur(28px) saturate(1.8)`) with burnished gold hairline perimeter border (`--nav-glass-border`) and soft elevation shadow (`--nav-glass-shadow`).
- **5-Tab Hierarchy**: `Home`, `Stocks`, `Funds`, `Deposits`, `More`.
- **Active Pill Indicator**: Active tab renders a warm gold/brass capsule (`52px × 28px`, `rounded-full`, `--nav-ledger-accent-soft`) with active tab glyph and category-tinted label.
- **More Asset Classes Drawer**: Slide-up sheet (`max-height: 88vh`, solid background `bg-[var(--surface-solid)]`) exposing all secondary categories (Gold, Real Estate, Insurance, Vault, Tax) in a clean 2-column grid.

---

## 5. Mobile Design Contract ("Do Not Regress" Rules)

All mobile views (`< 768px`) **must strictly adhere** to the following contract:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Hero Question Card (Max 2 Secondary Metrics)        │
│    "What are my holdings worth today?"                 │
├────────────────────────────────────────────────────────┤
│ 2. Segmented Family Pill Filter (44px+ touch targets)  │
│    [All Family]  [Rammohan]  [Padmavathi]  [Sai Laxmi] │
├────────────────────────────────────────────────────────┤
│ 3. Instant Search Input Bar                            │
│    [ 🔍 Search holdings...                           ] │
├────────────────────────────────────────────────────────┤
│ 4. 56px Interactive Touch Rows                         │
│    [Icon] Title & Metadata ... Value & Return [Chevron]│
└────────────────────────────────────────────────────────┘
```

### 5.1 Plain-Language Hero Phrasing
Every mobile screen answers one plain-language question upfront using `line-clamp-2 leading-tight` (never single-line truncation):
- **Stocks**: *"What are my holdings worth today?"*
- **Fixed Deposits**: *"How much is locked and what matures next?"*
- **Recurring Deposits**: *"How much is locked and what matures next?"*
- **Mutual Funds & SIPs**: *"What are our mutual funds worth today?"*
- **Gold & Bullion**: *"What is our bullion worth today?"*
- **Real Estate**: *"What is our property worth today?"*
- **Insurance**: *"How much cover do we have and what needs renewal?"*
- **Document Vault**: *"Are our records safe and current?"*
- **Tax Harvesting**: *"How much loss can be harvested?"*

### 5.2 Strict 2-Metric Secondary Cap
- Secondary metric count in [`MobileAssetRegistry.tsx`](src/components/ui/MobileAssetRegistry.tsx) is capped at exactly 2 items via `.slice(0, 2)` to eliminate hero bloat on compact viewports (iPhone SE 375px).

### 5.3 Unified Tokenized Badges ([`AppBadge.tsx`](src/components/ui/AppBadge.tsx))
All pills and badges across the application must use `AppBadge`. Supported variants:
- `positive`: Forest jade pill for gains / returns.
- `negative`: Terracotta garnet pill for losses / overdue policies.
- `warning`: Saffron amber pill for near-term reminders.
- `urgency`: Pulsing dot badge for events due within 30 days.
- `info`: Warm brass pill for neutral counts and status flags.
- `encrypted`: Monospaced muted pill with shield icon for cryptographic zero-trust records.

### 5.4 Action Priority Contract
- **Urgent Renewals**: Insurance policies due within 30 days show a prominent pulsing urgency badge directly below the policy title.
- **Harvest Actions**: Tax harvesting rows display a high-contrast green **"Harvest"** action chip taking visual priority over generic taps.
- **FAB Suppression**: The Floating Action Button (`+`) is hidden on pure analytical screens (`activeAsset === 'tax'`) so it never competes with harvest actions.
- **Safe-Area Clearance**: Content containers reserve `pb-28` (112px), and the FAB is elevated (`bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]`) above the 58px bottom dock.

---

## 6. Dashboard Bento 2.0 Grid & Layout Hierarchy

To enforce visual hierarchy and avoid generic visual monotony, the Home dashboard overview employs the **Bento 2.0** 12-column grid in [`HomeDashboardWidgets.tsx`](src/layouts/HomeDashboardWidgets.tsx):

### 6.1 Asymmetric 70/30 Hero Hierarchy
- **Hero Block (`lg:col-span-8` / 70% width)**: Houses the interactive **Net Worth Timeline Chart**, giving primary financial trajectory prominence.
- **Companion Pillar (`lg:col-span-4` / 30% width)**: Houses the **Asset Class Allocation Donut**. On desktop viewports (`lg:`), the visualizer adapts with responsive flex wrapping (`lg:flex-col xl:flex-row`), maintaining full readability for the central HUD and slice percentages without crowding.
- **Row 2 Symmetrical Foundation (`lg:col-span-6` each)**: Member Returns Bar Chart side-by-side with the AI Portfolio Assistant.

### 6.2 Archival Refraction & Specular Highlights
Cards and badges feature physical specular refraction optics:
- **Dark Mode**: 1px specular inner refraction border: `box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.08)`.
- **Light Mode**: Luminous glass highlight: `box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.95)`.
- **Hover Ascension**: Spring ascension (`translateY(-2px)`) with intensified inner highlight.

### 6.3 Perpetual Live Motion & Tactile Feedback
- **Live Market Indicator**: A pulsing emerald live beacon (`w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse`) next to "Today's Return" in [`SummaryCards.tsx`](src/components/SummaryCards.tsx) signals active intraday price movement.
- **Tactile Spring Press**: `.ios-press` uses refined cubic-bezier spring physics with `-translate-y-0.5` on hover and `scale(0.97)` on active press.
