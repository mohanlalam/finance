# 📋 Project Roadmap & Task Status — Family Portfolio Tracker

**Document Version**: 3.1  
**Current Release Status**: Milestone 3.1 (High-Agency Frontend Design Taste & Bento 2.0 Grid) Complete  
**Verification Pipeline**: 100% Passing (ESLint: 0, TypeScript: 0, Vitest: 309/309, Build: Clean)  

---

## 1. Completed Milestones & System Evolution

### ✅ Pillar 1: Absolute Financial Data Integrity & Pure Math
- [x] Pure financial math invariant test suite (`financialMathInvariants.test.ts`).
- [x] Floating-point precision helper `roundToDecimals` with `Number.EPSILON` guard.
- [x] Net Worth consolidation and asset category sum validation.
- [x] Hallmark purity multiplier calculations for bullion (24K, 22K/916, 18K/750, 14K/585).
- [x] Indian FY24-25 & FY25-26 Capital Gains tax calculation solver (20% STCG, 12.5% LTCG > ₹1.25L).
- [x] Fail-closed server-side PIN authentication and spoof-resistant IP rate limiting.
- [x] Private Supabase Storage bucket with 300s HMAC signed URLs.

### ✅ Pillar 2: Multi-Asset Indian Financial Presets
- [x] `indianFinancialPresets.ts`: Top Indian scheduled banks (SBI, HDFC, ICICI, etc.) and AMFI schemes.
- [x] `FDFormModal.tsx` & `RDFormModal.tsx`: Bank autocompletes and instant compounding calculators.
- [x] `GoldFormModal.tsx`: 1-tap "Auto-compute" valuation from grams, purity, and live 24K spot rate.
- [x] `SIPFormFields.tsx`: Mutual Fund scheme datalist with AMFI code & CAGR auto-population.

### ✅ Pillar 3: Smart AI Import & Document Quarantine
- [x] Drag-and-drop parser for PDF broker statements, FD certificates, and insurance policies.
- [x] Quarantined side-by-side verification interface before database commit (zero silent writes).
- [x] Visual evidence heatmap linking parsed values to exact coordinates on uploaded documents.
- [x] Entity disambiguation auto-assigning documents to Rammohan, Padmavathi, or Sai Laxmi.

### ✅ Pillar 4: Antigravity Cyber-Zen & Liquid Glass UI Redesign
- [x] Cosmic obsidian background (`#040711`) with multi-point ambient radial nebula meshes.
- [x] Translucent glassmorphism (`backdrop-blur-2xl`) with specular top reflections.
- [x] Liquid Glass Suspended Mobile Dock (`58px` height, `29px` radius, concentric inner lens plate).
- [x] Solid backdrop More drawer (`max-height: 88vh`) exposing secondary asset registries.

### ✅ Pillar 5: Mobile UI Polish & De-densification
- [x] **Plain-Language Hero Questions**: Every asset screen leads with a focused, conversational question (`line-clamp-2 leading-tight`).
- [x] **Strict 2-Metric Secondary Cap**: Capped with `.slice(0, 2)` to eliminate hero bloat on small screens.
- [x] **Unified Tokenized Badges**: Created [`AppBadge.tsx`](src/components/ui/AppBadge.tsx) standardizing `positive`, `negative`, `warning`, `urgency`, `info`, and `encrypted` variants.
- [x] **56px Touch Row Rhythm**: All list rows equipped with trailing `ChevronRight` icons and `ios-press` feedback.
- [x] **Mobile Stock Rows Complete Metrics**: Displays Current Value, Total P&L amount & percentage (`+₹X (Y%)`), and Day change (`Day Z%`), resolving the missing overall return and removing the double plus bug.
- [x] **Mobile Asset Delete Actions**: Added direct row-level trash buttons and prominent "Delete [Asset]" modal actions across FD, RD, SIP, Gold, Real Estate, Insurance, and Stock (`EditStockModal` & `HoldingDetailDrawer`) with confirmation gates.
- [x] **Touch Target & Accessibility Upgrades**: Expanded all row-level action buttons (trash & view icons) to ≥36-44px touch targets with `touch-manipulation` preventing accidental row opens.
- [x] **JSX Template Literal Entity Fixes**: Replaced all remaining raw `&bull;` string templates with Unicode `•` across Stocks, Fixed Deposits, Insurance, Document Vault, Recurring Deposits, SIP, Gold, Real Estate, and Tax Harvesting views.
- [x] **PWA Install Banner Ergonomics & Dock Overlap Fix**: Repositioned `PWAInstallBanner` below the header on mobile (`top-16`) with downward iOS instruction tooltip, completely eliminating vertical tap contention with the bottom navigation dock and FAB.
- [x] **Global Reference-Counted Body Scroll Lock**: Converted [`Modal.tsx`](src/components/Modal.tsx) and [`HoldingDetailDrawer.tsx`](src/components/HoldingDetailDrawer.tsx) to use [`scrollLock.ts`](src/utils/scrollLock.ts) reference counting, eliminating scroll lock collisions during modal/sheet transitions.
- [x] **Action Priority Elevation**: Pulsing urgency badges for upcoming insurance renewals; prominent "Harvest" chips for tax loss candidates; FAB suppressed on Tax Harvesting.
- [x] **iPhone SE Compact Optimization**: Verified at 375×667 with zero text clipping and safe-area dock clearance.

### ✅ Pillar 6: High-Agency Frontend Design Taste & Bento 2.0 Dashboard Architecture
- [x] **Bento 2.0 Asymmetric Dashboard Layout**: 12-column grid with 70/30 Hero row (`lg:col-span-8` Net Worth Timeline / `lg:col-span-4` Asset Allocation Donut) + 50/50 Row 2 (`lg:col-span-6` Member Returns / `lg:col-span-6` AI Assistant).
- [x] **Responsive Donut Visualizer**: `lg:flex-col xl:flex-row` flex wrapping preventing center HUD and slice legend crowding.
- [x] **Specular Liquid Glass Refraction**: Inner 1px refraction highlight (`box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.08)`) across `.apple-card`, `.antigravity-card`, `.hero-networth-card`, and `AppBadge`.
- [x] **Perpetual Intraday Live Indicator**: Pulsing emerald beacon (`animate-pulse`) on Today's Return.
- [x] **Frontend Design Skill Integration**: Integrated `.agents/skills/front-end-design/SKILL.md` aligned with project constraints (Tailwind CSS v3 lock, zero-dependency SVG icon system in `src/components/icons/AppIcons.tsx`).

---

## 2. Active Verification Checklist (46 Screenshots System)

### A. Web Desktop Dark Mode (`screenshots/web/dark/` — 1920×1080 @2x Retina)
- [x] `01-family-overview.png` — Bento 2.0 asymmetric dashboard layout (70/30 Hero + 50/50 Row 2)
- [x] `02-stocks-etfs.png` — Virtualized multi-member stocks table with active search & filters
- [x] `03-fixed-deposits.png` — Unified 3-row FD banner with bank breakdown & maturity schedule
- [x] `04-recurring-deposits.png` — Recurring deposit quarterly compounding registry
- [x] `05-sip-mutual-funds.png` — AMFI mutual funds portfolio valuation registry
- [x] `06-gold-holdings.png` — Bullion vault calibrated against live MCX spot rates & hallmark cards
- [x] `07-real-estate.png` — Property registry with valuation and rental yield metrics
- [x] `08-insurance-cover.png` — Life, health & motor policies with renewal countdown badges
- [x] `09-document-vault.png` — Zero-trust client-side encrypted document storage & tags
- [x] `10-tax-harvesting.png` — FY25-26 capital gains analyzer with loss harvesting opportunities

### B. Web Desktop Light Mode (`screenshots/web/light/` — 1920×1080 @2x Retina)
- [x] `01-family-overview.png` — Bento 2.0 dashboard in crisp porcelain light theme
- [x] `02-stocks-etfs.png` — Stocks registry in light theme with high-contrast text
- [x] `03-fixed-deposits.png` — Fixed deposits registry in light theme
- [x] `04-recurring-deposits.png` — Recurring deposits registry in light theme
- [x] `05-sip-mutual-funds.png` — SIP mutual funds registry in light theme
- [x] `06-gold-holdings.png` — Gold bullion vault in light theme
- [x] `07-real-estate.png` — Real estate registry in light theme
- [x] `08-insurance-cover.png` — Insurance coverage registry in light theme
- [x] `09-document-vault.png` — Document vault in light theme
- [x] `10-tax-harvesting.png` — Tax harvesting analyzer in light theme

### C. Mobile Dark Mode (`screenshots/mobile/dark/` — 390×844 @2x Retina)
- [x] `01-family-overview.png` — Mobile overview with conversational hero question
- [x] `02-stocks-etfs.png` — Mobile stocks registry with 2-metric secondary cap
- [x] `03-fixed-deposits.png` — Mobile FD registry with maturity countdown
- [x] `04-recurring-deposits.png` — Mobile RD savings registry
- [x] `05-sip-mutual-funds.png` — Mobile SIP flow and valuation registry
- [x] `06-gold-holdings.png` — Mobile gold bullion reserve with hallmark badges
- [x] `07-real-estate.png` — Mobile property registry and equity breakdown
- [x] `08-insurance-cover.png` — Mobile insurance cover with pulsing renewal urgency badge
- [x] `09-document-vault.png` — Mobile document vault with encrypted file tags
- [x] `10-tax-harvesting.png` — Mobile tax harvester with FAB suppressed
- [x] `bottom-nav-bar.png` — Isolated 58px liquid glass capsule navigation pill
- [x] `bottom-nav-dock.png` — Suspended dock in viewport context with floating FAB
- [x] `more-drawer.png` — High-opacity slide-up drawer for secondary asset registries

### D. Mobile Light Mode (`screenshots/mobile/light/` — 390×844 @2x Retina)
- [x] `01-family-overview.png` — Mobile home overview in light theme
- [x] `02-stocks-etfs.png` — Mobile stocks registry in light theme
- [x] `03-fixed-deposits.png` — Mobile FD registry in light theme
- [x] `04-recurring-deposits.png` — Mobile RD savings in light theme
- [x] `05-sip-mutual-funds.png` — Mobile SIP flow in light theme
- [x] `06-gold-holdings.png` — Mobile gold bullion in light theme
- [x] `07-real-estate.png` — Mobile property registry in light theme
- [x] `08-insurance-cover.png` — Mobile insurance cover in light theme
- [x] `09-document-vault.png` — Mobile document vault in light theme
- [x] `10-tax-harvesting.png` — Mobile tax harvester in light theme
- [x] `bottom-nav-bar.png` — Light mode liquid glass capsule navigation pill
- [x] `bottom-nav-dock.png` — Light mode dock in viewport context
- [x] `more-drawer.png` — Light mode secondary asset drawer sheet

---

## 3. Future Enhancements & Backlog

1. **Broker API Auto-Sync (Zerodha Kite & Groww)**:
   - Automated daily holding sync via broker OAuth Connect APIs with automated reconciliation.
2. **Bank Statement PDF Parser (Account Aggregator / CAS)**:
   - In-browser parser for consolidated account statements (CAS) from CAMS/KFintech.
3. **WhatsApp / SMS Renewal & Maturity Alerts**:
   - Opt-in Supabase cron notifications reminding family members 7 days prior to FD maturity or insurance renewal.
4. **Multi-Currency Support for Overseas Assets**:
   - USD/EUR denominated equities and ETFs with real-time RBI reference exchange rate conversion.
