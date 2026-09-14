---
name: capture-screenshot
description: >-
  Captures full-size high-accuracy screenshots for web and mobile across light and dark modes.
  Use whenever the user requests any screenshot, full project screenshots, or screenshot updates.
  Always purges and removes the old version first before capturing fresh screenshots with identical
  dimensions, 2x Retina resolution, and pixel-perfect accuracy.
---

# Capture Screenshot Skill

This skill governs capturing full-size, high-accuracy screenshots for the Family Portfolio Tracker across Web Desktop and Mobile in both Light and Dark themes.

## Core Directives

1. **Mandatory Purge Before Capture**:
   - Whenever asked to take, retake, or update any screenshot (full suite or a single view), **ALWAYS remove the old version first** from the target directory before taking the new one.
   - For full suite:
     ```powershell
     Remove-Item -Path "screenshots\web\*\*.png", "screenshots\mobile\*\*.png" -Force -ErrorAction SilentlyContinue
     ```
   - For a single target view (e.g. `02-stocks-etfs.png`):
     ```powershell
     Remove-Item -Path "screenshots\web\*\02-stocks-etfs.png", "screenshots\mobile\*\02-stocks-etfs.png" -Force -ErrorAction SilentlyContinue
     ```

2. **Standard Viewports & Resolutions (Retina Sharpness)**:
   - **Web Desktop**:
     - Viewport: `1920 × 1080`
     - Device Scale Factor: `2` (Crisp 4K/Retina pixel density)
   - **Mobile View**:
     - Viewport: `390 × 844` (iPhone 14 standard)
     - Device Scale Factor: `2`
     - Configuration: `isMobile: true`, `hasTouch: true`
     - User Agent: Mobile Safari iPhone OS

3. **Capture Execution Requirements**:
   - Always capture full scrollable height (`fullPage: true`).
   - Settle Delay: Allow ~1.5 seconds after route navigation so lazy chunks (`AssetTabContent`), Recharts SVG animations, and virtualized list items fully render before snapping.
   - Dual Theme Support:
     - Light Mode: `localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark');`
     - Dark Mode: `localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark');`

## Standard Target Views

| ID | Name | Route |
| :--- | :--- | :--- |
| `01-family-overview` | Family Overview / Dashboard | `/#/all/home` |
| `02-stocks-etfs` | Stocks & ETFs Registry | `/#/all/stocks` |
| `03-fixed-deposits` | Fixed Deposits | `/#/all/fd` |
| `04-recurring-deposits` | Recurring Deposits | `/#/all/rd` |
| `05-sip-mutual-funds` | SIP Mutual Funds | `/#/all/sip` |
| `06-gold-holdings` | Gold Holdings & Bullion | `/#/all/gold` |
| `07-real-estate` | Real Estate Registry | `/#/all/real_estate` |
| `08-insurance-cover` | Insurance Policies Cover | `/#/all/insurance` |
| `09-document-vault` | Document Vault | `/#/all/documents` |
| `10-tax-harvesting` | Tax Loss Harvesting & Optimization | `/#/all/tax` |

## Automated Workflow Execution

To capture the complete 40-screenshot suite:

1. **Purge old screenshots**:
   ```powershell
   Remove-Item -Path "screenshots\web\*\*.png", "screenshots\mobile\*\*.png" -Force -ErrorAction SilentlyContinue
   ```

2. **Run the Playwright capture suite**:
   ```powershell
   npx playwright test e2e/capture_all_views.spec.ts
   ```

3. **Verify generated files**:
   ```powershell
   Get-ChildItem -Recurse screenshots | Where-Object { -not $_.PSIsContainer } | Select-Object FullName, Length
   ```