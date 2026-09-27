# 📋 Project Roadmap & Task Status — Family Portfolio Tracker

**Document Version**: 4.0  
**Current Release Status**: Milestone 4.0 (Indian Family Wealth Ledger & Heirloom Typography System) Complete  
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

### ✅ Pillar 7: Indian Family Wealth Ledger & Heirloom Typography System
- [x] **Named Typography System**: `Newsreader` (optical size `6..72`) Display Serif for valuations and net worth, `Plus Jakarta Sans` for clean UI chrome, and `JetBrains Mono` for bullion weights, tolas, and compounding rates.
- [x] **Cultural Identity & Warm Brass Palette**: Primary accent shifted to Warm Antique Brass & Heritage Gold (`--accent-gold: #d4af37`, `--accent-brass: #e5b869`) representing Indian family gold and generational wealth.
- [x] **Stewardship Semantics**: Calibrated non-alarmist financial tones (Stately Forest Jade `#166534` for growth, Terracotta Garnet `#991b1b` for liabilities).
- [x] **Archival Vellum & Basalt Vault Canvas**: Replaced generic cyan/purple neon nebulas with warm archival vellum (light) and basalt obsidian slate (dark).
- [x] **Purged Borrowed Tropes**: Retired `--nav-whatsapp-green` and VisionOS Apple naming in favor of the Suspended Ledger Dock.

---

## 2. Active Verification Checklist (36 Screenshots System)

- [x] `01_desktop_dark_pin_lock_screen.png` — Aurora gradient passcode gate (1440×900)
- [x] `02_desktop_dark_stocks_holdings.png` — Virtualized stocks table with sorting (1440×900)
- [x] `03_desktop_dark_summary_analytics_widgets.png` — Bento 2.0 dashboard analytics grid (1440×900)
- [x] `04_desktop_dark_fixed_deposits.png` — Unified FD banner & deposit cards (1440×900)
- [x] `05_desktop_dark_recurring_deposits.png` — RD installment tracker (1440×900)
- [x] `06_desktop_dark_sip_mutual_funds.png` — Mutual funds with live AMFI NAV (1440×900)
- [x] `07_desktop_dark_gold_bullion_vault.png` — Gold vault with live MCX spot rate (1440×900)
- [x] `08_desktop_dark_real_estate_registry.png` — Standalone property registry & yields (1440×900)
- [x] `09_desktop_dark_insurance_policies.png` — Life, health & motor policy cover (1440×900)
- [x] `10_desktop_dark_document_vault.png` — Zero-knowledge encrypted records (1440×900)
- [x] `11_desktop_dark_tax_harvesting.png` — Indian FY24-25 capital gains & loss harvester (1440×900)
- [x] `12_desktop_dark_family_member_father.png` — Single-member filtered view (1440×900)
- [x] `13_desktop_dark_ai_assistant_panel.png` — Deterministic NLP assistant panel (1440×900)
- [x] `14_desktop_dark_modal_add_holding.png` — Stock holding entry modal (1440×900)
- [x] `15_desktop_dark_modal_add_gold.png` — Gold holding entry modal (1440×900)
- [x] `16_desktop_light_stocks_holdings.png` — Stocks in Light mode (1440×900)
- [x] `17_desktop_light_summary_analytics_widgets.png` — Summary widgets in Light mode (1440×900)
- [x] `18_desktop_light_gold_bullion.png` — Bullion vault in Light mode (1440×900)
- [x] `19_desktop_light_fixed_deposits.png` — Fixed deposits in Light mode (1440×900)
- [x] `20_desktop_light_sip_mutual_funds.png` — Mutual funds in Light mode (1440×900)
- [x] `21_mobile_dark_pin_lock.png` — Mobile PIN lock screen (390×844)
- [x] `22_mobile_dark_home_summary.png` — Mobile home summary with liquid dock (390×844)
- [x] `23_mobile_dark_stocks_holdings.png` — Mobile stocks registry with hero question (390×844)
- [x] `24_mobile_dark_fixed_deposits.png` — Mobile FD registry with maturity badge (390×844)
- [x] `25_mobile_dark_sip_mutual_funds.png` — Mobile mutual funds registry (390×844)
- [x] `26_mobile_dark_gold_holdings.png` — Mobile bullion vault with 24K spot badge (390×844)
- [x] `27_mobile_light_home_summary.png` — Mobile home in Light mode (390×844)
- [x] `28_mobile_light_stocks.png` — Mobile stocks in Light mode (390×844)
- [x] `29_mobile_dark_insurance.png` — Mobile insurance cover with renewal urgency (390×844)
- [x] `30_mobile_dark_real_estate.png` — Mobile real estate registry (390×844)
- [x] `31_mobile_dark_documents.png` — Mobile document vault with AES-256 badge (390×844)
- [x] `32_mobile_dark_tax_harvesting.png` — Mobile tax harvesting with "Harvest" chips (390×844)
- [x] `33_mobile_iphonese_dark_stocks.png` — iPhone SE compact stocks view (375×667)
- [x] `34_mobile_iphonese_dark_fd.png` — iPhone SE compact FD view (375×667)
- [x] `35_mobile_iphonese_dark_insurance.png` — iPhone SE compact insurance view (375×667)
- [x] `36_mobile_iphonese_dark_documents.png` — iPhone SE compact document vault (375×667)

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
