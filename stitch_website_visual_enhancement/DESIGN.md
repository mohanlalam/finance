---
name: Azure Ledger
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#8691a7'
  on-tertiary-container: '#1f2a3c'
  error: '#EF4444'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  success: '#10B981'
  warning: '#F59E0B'
  surface-glass: rgba(30, 41, 59, 0.7)
  border-glass: rgba(255, 255, 255, 0.1)
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is engineered for high-stakes personal finance management, prioritizing security, clarity, and a premium "command center" feel. The aesthetic leans into **Modern Corporate** with **Glassmorphism** accents to provide depth in a dark environment. 

The visual narrative focuses on "Data as Light," where critical information glows against deep, stable backgrounds. The interface should feel authoritative yet accessible, using subtle translucency and precise geometry to organize complex financial datasets. The target audience expects a professional-grade tool that feels as secure as a vault but as fluid as a modern SaaS platform.

## Colors

The palette is anchored by a deep navy (#0F172A) to provide maximum contrast for data visualization. 

- **Primary:** An energetic blue used for CTA buttons, active states, and primary brand markers.
- **Secondary:** A cool slate used for supporting text and non-critical icons.
- **Tertiary:** Used for secondary surface containers to create a "layered" effect.
- **Semantic Colors:** Success (Emerald), Warning (Amber), and Error (Rose) are slightly desaturated to maintain the premium feel while ensuring high legibility against the dark background.
- **Glass Effects:** Use the `surface-glass` variable for floating panels and modals to create a sense of verticality.

## Typography

The system utilizes two typefaces to balance personality with utility. **Outfit** is used for headlines and large data displays (like account balances) to provide a modern, geometric flair. **Inter** is the workhorse for body text, labels, and granular financial data, chosen for its exceptional legibility and neutral tone.

Financial figures should use `mono-data` (utilizing Inter's tabular num features) to ensure numbers align perfectly in tables and lists, facilitating quick scanning of currency values.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **single-column fluid layout** for mobile. 

A strict 4px/8px baseline grid maintains vertical rhythm. Layouts should favor generous whitespace around high-level metrics to prevent data fatigue. Use the 24px gutter for card spacing to ensure each financial module feels distinct. Large data tables should utilize a "comfortable" density by default, with an option for "compact" view in data-heavy administrative screens.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**, avoiding traditional heavy shadows.

- **Level 0 (Background):** #0F172A.
- **Level 1 (Cards/Containers):** #1E293B with a subtle 1px border (rgba(255,255,255,0.05)).
- **Level 2 (Active Elements/Modals):** Glassmorphic surfaces with a 12px backdrop blur and a more prominent top-down gradient border to simulate light hitting the edge.
- **Interactions:** Hover states should involve a subtle "glow" (inner shadow with primary color) rather than a lift, reinforcing the digital/futuristic theme.

## Shapes

The shape language is "Soft-Modern." A consistent 8px (`rounded-md`) radius is applied to standard cards and input fields. Primary buttons use slightly more rounded corners (12px) to make them more inviting and distinct from the structural grid. Use pill shapes strictly for status tags (e.g., "Verified," "Pending") and toggle switches.

## Components

- **Buttons:** Primary buttons use a solid #3B82F6 fill with white text. Secondary buttons use an outline style with #94A3B8 borders. Always include a subtle 4px rounded-inner glow on active states.
- **Cards:** Financial cards must include a "glass" header area to separate titles from data. Use a 1px border (#1E293B) to define the silhouette against the dark background.
- **Inputs:** Darker than the container surface (#0F172A) with a 1px border. On focus, the border transitions to the primary blue with a soft outer glow.
- **Chips/Status:** Use low-opacity background fills of the semantic colors (e.g., 10% opacity Green for "Success") with high-contrast text for accessibility.
- **Icons:** Use thin-stroke (2pt) icons. Primary actions can use a "duotone" style where one element of the icon uses the primary blue.
- **Data Tables:** Row headers should be sticky. Use zebra-striping with #1E293B at 50% opacity for improved horizontal scanning.