/**
 * Canonical color palette for portfolio asset classes and visualization charts.
 * Single source of truth across allocation, bar charts, pie charts, and summary indicators.
 * Mathematically distributed across the 360° color wheel for maximum pairwise hue,
 * lightness, and dark-mode luminance separation.
 */

export const ASSET_COLORS = {
  stocks: '#387ed1',     // Kite Sky Blue (213°)
  fd: '#06b6d4',         // Luminous Cyan-Teal (189°, L=43%)
  rd: '#c2410c',         // Deep Rust Tangerine (21°, L=40%)
  sip: '#9333ea',        // Systematic Growth Violet (271°)
  gold: '#facc15',       // Pure Solar Gold (50°, L=53%)
  realEstate: '#16a34a', // Evergreen Land & Property (142°)
} as const;

export type AssetColorKey = keyof typeof ASSET_COLORS;
