# 🎨 Design System & Visual Specification — Family Portfolio Tracker

**Document Version**: 3.0  
**Design Philosophy**: Antigravity Cyber-Zen & Liquid Glass Dynamic Navigation  
**Authoritative Token Source**: `src/index.css` & `Design.md §2`  

---

## 1. Design Philosophy: Antigravity Cyber-Zen & Liquid Glass

The user interface embodies weightless suspension, calm cognitive clarity, and tactile responsiveness:
- **Atmospheric Suspension over Void**: Replaces heavy opaque footers with ambient cosmic depth (`#040711`) layered with soft radial nebula meshes (cyan `#06b6d4`, celestial violet `#a855f7`, emerald aura `#10b981`).
- **Liquid Glass Optics**: High-refraction frosted glass cards and floating docks with `backdrop-blur-2xl`, luminous 1px specular edges, and soft ambient drop shadows.
- **Concentric Inner Lens Navigation**: Floating navigation pills featuring inner frosted glass capsules that align with outer border curvatures for a fluid, physical feel.

---

## 2. Authoritative Design Tokens

> ⚠️ **Design Token Invariant**: Never introduce hardcoded hex colors, corner radii, or ad-hoc shadow classes in component code. All visual tokens must map directly to CSS Custom Properties declared in `src/index.css`.

### 2.1 Theme Palette & Canvas Tokens

| Token Name | Dark Mode (Cyber-Zen) | Light Mode (Crisp Canvas) | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#040711` | `#f8fafc` | Root canvas / viewport background |
| `--surface` | `rgba(13, 19, 36, 0.75)` | `rgba(255, 255, 255, 0.90)` | Primary cards, table bodies, modal surfaces |
| `--surface-secondary` | `rgba(20, 29, 53, 0.60)` | `rgba(241, 245, 249, 0.85)` | Inset metrics, filter bars, table headers |
| `--surface-solid` | `#0d1324` | `#ffffff` | Solid backdrop for bottom sheets & popovers |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Standard card and divider borders |
| `--border-luminous` | `rgba(255, 255, 255, 0.16)` | `rgba(0, 0, 0, 0.14)` | Top specular highlight and active card borders |

### 2.2 Typography & Hierarchy Tokens

| Token Name | Dark Mode Value | Light Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--text-primary` | `#f1f5f9` | `#0f172a` | Large valuations, card headers, table values |
| `--text-secondary` | `#94a3b8` | `#475569` | Secondary metrics, subtitles, labels |
| `--text-tertiary` | `#64748b` | `#64748b` | Timestamps, currency prefixes, field notes |

### 2.3 Semantic Financial Colors

| Semantic State | Base Color Token | Soft Background Token (`-soft`) | Contrast Ratio (WCAG) |
| :--- | :--- | :--- | :--- |
| **Positive / Returns** | `--positive`: `#10b981` | `--positive-soft`: `rgba(16, 185, 129, 0.15)` | $> 4.5:1$ (AA compliant) |
| **Negative / Loss** | `--negative`: `#f43f5e` | `--negative-soft`: `rgba(244, 63, 94, 0.15)` | $> 4.5:1$ (AA compliant) |
| **Warning / Reminder** | `--warning`: `#f59e0b` | `--warning-soft`: `rgba(245, 158, 11, 0.15)` | $> 4.5:1$ (AA compliant) |
| **Primary Accent** | `--accent-blue`: `#3b82f6` | `--accent-blue-soft`: `rgba(59, 130, 246, 0.15)` | $> 4.5:1$ (AA compliant) |
| **Bullion / Gold** | `--accent-gold`: `#eab308` | `--accent-gold-soft`: `rgba(234, 179, 8, 0.15)` | $> 4.5:1$ (AA compliant) |

### 2.4 Radii & Shadow Tokens

| Category | Token Name | Value | Description |
| :--- | :--- | :--- | :--- |
| **Corner Radii** | `--radius-small` | `8px` | Badges, small inputs, buttons |
| | `--radius-medium` | `14px` | List items, action chips, inner cards |
| | `--radius-large` | `20px` | Primary cards, modal dialogs, sheets |
| | `--radius-pill` | `9999px` | Navigation pills, filter capsules |
| **Elevations** | `--shadow-card` | `0 4px 20px rgba(0, 0, 0, 0.25)` | Translucent card depth |
| | `--shadow-glow` | `0 0 24px rgba(59, 130, 246, 0.25)` | Active element luminous aura |

---

## 3. Navigation Architecture

### 3.1 Desktop Sidebar Navigation (`md:` and above)
- Fixed left navigation drawer (`w-64`) with frosted glass backing (`backdrop-blur-xl`).
- High-level sections:
  1. **Portfolio Overview** (`Home`, `Widgets`)
  2. **Family Member Switcher** (`All Family`, `Rammohan`, `Padmavathi`, `Sai Laxmi`)
  3. **Asset Registries** (`Stocks`, `Fixed Deposits`, `Recurring Deposits`, `SIPs`, `Gold`, `Real Estate`, `Insurance`, `Document Vault`, `Tax Harvesting`)
  4. **System Tools** (`Smart Import`, `Backup/Restore`, `Lock Application`)

### 3.2 Liquid Glass Suspended Mobile Dock (`< 768px`)
- **Dimensions & Offset**: Width `max-w-[440px]`, Height `58px`, Corner radius `29px`, Inset padding `4px`.
- **Concentric Lens Plate**: Selected tab sits inside a matching `25px` frosted glass capsule with directional gradient optics (`--nav-glass-bg`).
- **More Asset Classes Drawer**: Slide-up sheet (`max-height: 88vh`, solid background `bg-[var(--surface-solid)]`) exposing all secondary categories in a 2-column grid.

---

## 4. Mobile Design Contract ("Do Not Regress" Rules)

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

### 4.1 Plain-Language Hero Phrasing
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

### 4.2 Strict 2-Metric Secondary Cap
- Secondary metric count in [`MobileAssetRegistry.tsx`](src/components/ui/MobileAssetRegistry.tsx) is capped at exactly 2 items via `.slice(0, 2)` to prevent hero bloat on small devices like iPhone SE (375px).

### 4.3 Unified Tokenized Badges ([`AppBadge.tsx`](src/components/ui/AppBadge.tsx))
All pills and badges across the application must use `AppBadge`. Supported variants:
- `positive`: Emerald pill for gains / returns.
- `negative`: Rose pill for losses / overdue policies.
- `warning`: Amber pill for near-term reminders.
- `urgency`: Pulsing dot badge for events due within 30 days.
- `info`: Blue pill for neutral counts and status flags.
- `encrypted`: Monospaced, calm muted pill with shield icon for cryptographic security.

### 4.4 Action Priority Contract
- **Urgent Renewals**: Insurance policies due within 30 days show a prominent pulsing urgency badge directly below the policy title.
- **Harvest Actions**: Tax harvesting rows display a high-contrast green **"Harvest"** action chip taking visual priority over generic taps.
- **FAB Suppression**: The Floating Action Button (`+`) is hidden on pure analytical screens (`activeAsset === 'tax'`) so it never competes with harvest actions.
- **Safe-Area Clearance**: Content containers reserve `pb-28` (112px), and the FAB is elevated (`bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]`) above the 58px bottom dock.
