/**
 * Lightweight mobile haptics utility using navigator.vibrate
 * Gracefully no-ops on browsers/platforms that do not support the Vibration API (e.g. iOS Safari)
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  selection: 8,       // Subtle tick on tab / button press
  light: 12,          // Light tap
  medium: 20,         // Medium click
  heavy: 35,          // Heavy press
  success: [10, 30, 15], // Double light pulse
  warning: [25, 40, 25], // Double medium pulse
  error: [40, 50, 40, 50, 40], // Triple urgent pulse
};

export function triggerHaptic(style: HapticStyle = 'selection'): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[style] || 10;
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore any security or browser restrictions
  }
}
