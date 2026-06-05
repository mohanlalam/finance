# Technical Implementation Guide: Azure Ledger

This guide provides the technical specifications for implementing the **Azure Ledger** Family Wealth Office platform.

## 1. Brand Identity & Design System
The Azure Ledger system is built on a sophisticated dark-mode aesthetic designed to convey security, trust, and premium financial management.

### Color Palette
- **Primary**: `#3b82f6` (Azure Blue)
- **Surface (Background)**: `#0b1326` (Deep Navy)
- **Surface Container**: `#131b2e`
- **Surface Bright**: `#31394d`
- **Outline/Borders**: Glassmorphic borders using `rgba(255, 255, 255, 0.1)` or `border-outline-variant`.

### Typography
- **Font Family**: `Outfit` (Sans-serif)
- **Display Large**: 32px / 2rem, Bold
- **Headline Medium**: 24px / 1.5rem, Semibold
- **Body Medium**: 16px / 1rem, Regular
- **Label Small**: 12px / 0.75rem, Medium

### Components & Layout
- **Grid**: 12-column desktop grid with 24px gutters.
- **Rounding**: `ROUND_EIGHT` (8px corner radius).
- **Effects**: Backdrop blur (12px-16px) for glassmorphic elements.

---

## 2. Screen Reference Inventory

### Desktop Screens
1. **Secure Login** (`{{DATA:SCREEN:SCREEN_2}}`): Features a custom numeric keypad and encryption status indicators.
2. **Wealth Overview Dashboard** (`{{DATA:SCREEN:SCREEN_12}}`): Central hub with Net Worth trends (Line chart) and Asset Allocation (Donut chart).
3. **Investment Portfolio** (`{{DATA:SCREEN:SCREEN_4}}`): Detailed holdings table and performance by category.
4. **Transaction History** (`{{DATA:SCREEN:SCREEN_5}}`): Categorized ledger with monthly budget tracking.

### Mobile Screens
- **Secure Login** (`{{DATA:SCREEN:SCREEN_10}}`)
- **Wealth Overview** (`{{DATA:SCREEN:SCREEN_11}}`)
- **Investment Portfolio** (`{{DATA:SCREEN:SCREEN_6}}`)
- **Transaction History** (`{{DATA:SCREEN:SCREEN_8}}`)

---

## 3. Developer Instructions
- **Framework**: Designs are optimized for **Tailwind CSS**.
- **Icons**: Use Google Material Symbols (Rounded) for consistent iconography.
- **Assets**: Download all generated logos and image assets directly from the file explorer.
- **Responsive Logic**: 
  - Desktop uses a `SideNavBar` + `TopNavBar` layout.
  - Mobile transitions to a `BottomNavBar` for primary navigation.
