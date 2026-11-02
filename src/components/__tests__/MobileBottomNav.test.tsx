// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import MobileBottomNav from '../MobileBottomNav';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const renderNav = (overrides: Partial<Parameters<typeof MobileBottomNav>[0]> = {}) =>
  render(
    <MobileBottomNav
      activeAsset="home"
      onChangeAsset={vi.fn()}
      {...overrides}
    />
  );

function openMoreDrawer() {
  // The More button's aria-label varies ('More asset categories' vs 'More (active)'),
  // so use the stable title attribute to find it reliably.
  const moreBtn = screen.getByTitle('More asset categories');
  fireEvent.click(moreBtn);
}

function getDialog() {
  return screen.getByRole('dialog');
}

/* ── Test Suite ────────────────────────────────────────────────────────────── */
describe('MobileBottomNav Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  /* ─── Rendering ──────────────────────────────────────────────────────── */
  describe('Rendering', () => {
    it('renders all 5 main navigation tabs', () => {
      renderNav();

      expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Stocks' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Funds' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Deposits' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'More asset categories' })).toBeDefined();
    });

    it('renders a navigation landmark with correct label', () => {
      renderNav();
      const nav = screen.getByRole('navigation', { name: 'Mobile Navigation' });
      expect(nav).toBeDefined();
    });

    it('sets aria-current="page" only on the active tab', () => {
      renderNav({ activeAsset: 'stocks' });

      const homeBtn = screen.getByRole('button', { name: 'Home' });
      const stocksBtn = screen.getByRole('button', { name: 'Stocks' });

      expect(homeBtn.getAttribute('aria-current')).toBeNull();
      expect(stocksBtn.getAttribute('aria-current')).toBe('page');
    });
  });

  /* ─── Badge ──────────────────────────────────────────────────────────── */
  describe('Badge', () => {
    it('displays badge count when alertCount > 0', () => {
      renderNav({ alertCount: 3 });
      const badge = screen.getByRole('status', { name: /3 notification/ });
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe('3');
    });

    it('displays "9+" when alertCount is between 10 and 99', () => {
      renderNav({ alertCount: 15 });
      const badge = screen.getByRole('status', { name: /15 notification/ });
      expect(badge.textContent).toBe('9+');
    });

    it('displays "99+" when alertCount exceeds 99', () => {
      renderNav({ alertCount: 150 });
      const badge = screen.getByRole('status', { name: /150 notification/ });
      expect(badge.textContent).toBe('99+');
    });

    it('does not render badge when alertCount is 0', () => {
      renderNav({ alertCount: 0 });
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('does not render badge when alertCount is undefined', () => {
      renderNav();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('uses singular "notification" for count of 1', () => {
      renderNav({ alertCount: 1 });
      const badge = screen.getByRole('status');
      expect(badge.getAttribute('aria-label')).toBe('1 notification');
    });

    it('uses plural "notifications" for count > 1', () => {
      renderNav({ alertCount: 5 });
      const badge = screen.getByRole('status');
      expect(badge.getAttribute('aria-label')).toBe('5 notifications');
    });
  });

  /* ─── Tab Navigation ─────────────────────────────────────────────────── */
  describe('Tab Navigation', () => {
    it('triggers onChangeAsset when a main tab is clicked', () => {
      const onChangeAsset = vi.fn();
      renderNav({ onChangeAsset });

      fireEvent.click(screen.getByRole('button', { name: 'Stocks' }));
      expect(onChangeAsset).toHaveBeenCalledWith('stocks');
    });

    it('triggers onChangeAsset for each main tab', () => {
      const onChangeAsset = vi.fn();
      renderNav({ onChangeAsset });

      fireEvent.click(screen.getByRole('button', { name: 'Funds' }));
      expect(onChangeAsset).toHaveBeenCalledWith('sip');

      fireEvent.click(screen.getByRole('button', { name: 'Deposits' }));
      expect(onChangeAsset).toHaveBeenCalledWith('fd');

      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      expect(onChangeAsset).toHaveBeenCalledWith('home');
    });

    it('closes the drawer when a main tab is clicked while drawer is open', () => {
      renderNav();

      openMoreDrawer();
      expect(screen.getByRole('dialog')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Stocks' }));

      act(() => {
        vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS);
      });

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  /* ─── More Drawer ────────────────────────────────────────────────────── */
  describe('More Drawer', () => {
    it('opens drawer and manages aria attributes', () => {
      const onDrawerStateChange = vi.fn();
      renderNav({ onDrawerStateChange });

      const moreBtn = screen.getByRole('button', { name: 'More asset categories' });
      expect(moreBtn.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('dialog')).toBeNull();

      fireEvent.click(moreBtn);

      expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
      const dialog = getDialog();
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('All asset categories');
      expect(dialog.getAttribute('aria-describedby')).toBe('drawer-desc');
      expect(onDrawerStateChange).toHaveBeenCalledWith(true);
    });

    it('renders all more asset category buttons inside the drawer', () => {
      renderNav();
      openMoreDrawer();

      expect(screen.getByRole('button', { name: /Recurring Deposits/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Gold Holdings/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Real Estate/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Insurance Policies/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Document Vault/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Tax Harvesting/i })).toBeDefined();
    });

    it('stays open indefinitely (does NOT auto-minimize)', () => {
      renderNav();
      openMoreDrawer();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('navigates when an item in More sheet is clicked', () => {
      const onChangeAsset = vi.fn();
      renderNav({ onChangeAsset });

      openMoreDrawer();
      fireEvent.click(screen.getByRole('button', { name: /Gold Holdings/i }));

      expect(onChangeAsset).toHaveBeenCalledWith('gold');
    });

    it('navigates to all More drawer categories', () => {
      const onChangeAsset = vi.fn();
      renderNav({ onChangeAsset });

      const expectedCategories: Array<{ label: RegExp; id: string }> = [
        { label: /Recurring Deposits/i, id: 'rd' },
        { label: /Gold Holdings/i, id: 'gold' },
        { label: /Real Estate/i, id: 'real_estate' },
        { label: /Insurance Policies/i, id: 'insurance' },
        { label: /Document Vault/i, id: 'documents' },
        { label: /Tax Harvesting/i, id: 'tax' },
      ];

      for (const { label, id } of expectedCategories) {
        openMoreDrawer();
        fireEvent.click(screen.getByRole('button', { name: label }));
        expect(onChangeAsset).toHaveBeenCalledWith(id);
        // Flush close animation
        act(() => { vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS); });
      }
    });

    it('shows aria-current on More drawer item matching activeAsset', () => {
      renderNav({ activeAsset: 'gold' });
      openMoreDrawer();

      const goldBtn = screen.getByRole('button', { name: /Gold Holdings/i });
      expect(goldBtn.getAttribute('aria-current')).toBe('page');

      const rdBtn = screen.getByRole('button', { name: /Recurring Deposits/i });
      expect(rdBtn.getAttribute('aria-current')).toBeNull();
    });

    it('renders drawer description for screen readers', () => {
      renderNav();
      openMoreDrawer();

      const desc = document.getElementById('drawer-desc');
      expect(desc).toBeDefined();
      expect(desc?.textContent).toContain('additional asset categories');
    });

    it('renders a divider separator role', () => {
      renderNav();
      openMoreDrawer();

      expect(screen.getByRole('separator')).toBeDefined();
    });
  });

  /* ─── More Button Active State ───────────────────────────────────────── */
  describe('More Button Active State', () => {
    it('displays "More (active)" label when activeAsset is a More category', () => {
      renderNav({ activeAsset: 'gold' });

      const moreBtn = screen.getByRole('button', { name: 'More (active)' });
      expect(moreBtn).toBeDefined();
    });

    it('displays "More asset categories" label when activeAsset is a main tab', () => {
      renderNav({ activeAsset: 'home' });

      const moreBtn = screen.getByRole('button', { name: 'More asset categories' });
      expect(moreBtn).toBeDefined();
    });
  });

  /* ─── Smart Import ───────────────────────────────────────────────────── */
  describe('Smart Import', () => {
    it('renders Smart Import banner when onOpenSmartImport is provided', () => {
      const onOpenSmartImport = vi.fn();
      renderNav({ onOpenSmartImport });

      openMoreDrawer();

      const importBtn = screen.getByRole('button', { name: /Smart AI Import/i });
      expect(importBtn).toBeDefined();
    });

    it('does not render Smart Import banner when onOpenSmartImport is undefined', () => {
      renderNav();
      openMoreDrawer();

      expect(screen.queryByRole('button', { name: /Smart AI Import/i })).toBeNull();
    });

    it('calls onOpenSmartImport and closes drawer when clicked', () => {
      const onOpenSmartImport = vi.fn();
      renderNav({ onOpenSmartImport });

      openMoreDrawer();
      fireEvent.click(screen.getByRole('button', { name: /Smart AI Import/i }));

      expect(onOpenSmartImport).toHaveBeenCalledTimes(1);

      act(() => { vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS); });
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  /* ─── Accessibility & Focus Management ───────────────────────────────── */
  describe('Accessibility & Focus Management', () => {
    it('focuses close button on drawer open', () => {
      renderNav();
      openMoreDrawer();

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('supports focus trap with Tab key cycling', () => {
      renderNav();
      openMoreDrawer();

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const dialog = getDialog();
      const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled])');
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      // Focus last element and press Tab -> should wrap to firstEl
      lastEl.focus();
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(firstEl);

      // Press Shift+Tab on first element -> should wrap to lastEl
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastEl);
    });

    it('restores focus to previously focused element after drawer close', () => {
      renderNav();

      // Focus the Stocks button first
      const stocksBtn = screen.getByRole('button', { name: 'Stocks' });
      stocksBtn.focus();
      expect(document.activeElement).toBe(stocksBtn);

      openMoreDrawer();
      act(() => { vi.advanceTimersByTime(50); });

      // Focus should be on Close button now
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));

      // Close drawer
      fireEvent.keyDown(window, { key: 'Escape' });
      act(() => { vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS); });

      // Focus should return to Stocks button
      expect(document.activeElement).toBe(stocksBtn);
    });

    it('has aria-haspopup="dialog" on More button', () => {
      renderNav();
      const moreBtn = screen.getByRole('button', { name: 'More asset categories' });
      expect(moreBtn.getAttribute('aria-haspopup')).toBe('dialog');
    });
  });

  /* ─── Keyboard Interactions ──────────────────────────────────────────── */
  describe('Keyboard Interactions', () => {
    it('closes drawer on Escape key and notifies parent', () => {
      const onDrawerStateChange = vi.fn();
      renderNav({ onDrawerStateChange });

      openMoreDrawer();
      expect(getDialog()).toBeDefined();

      fireEvent.keyDown(window, { key: 'Escape' });

      act(() => {
        vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS);
      });

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onDrawerStateChange).toHaveBeenCalledWith(false);
    });

    it('does not close drawer on unrelated key presses', () => {
      renderNav();
      openMoreDrawer();

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'a' });

      expect(getDialog()).toBeDefined();
    });
  });

  /* ─── Backdrop ───────────────────────────────────────────────────────── */
  describe('Backdrop', () => {
    it('renders backdrop when drawer is open', () => {
      renderNav();
      openMoreDrawer();

      const backdrop = document.querySelector('[data-testid="drawer-backdrop"]');
      expect(backdrop).not.toBeNull();
    });

    it('closes drawer when backdrop is clicked', () => {
      renderNav();
      openMoreDrawer();
      expect(getDialog()).toBeDefined();

      const backdrop = document.querySelector('[data-testid="drawer-backdrop"]') as HTMLElement;
      fireEvent.click(backdrop);

      act(() => {
        vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS);
      });

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('backdrop is aria-hidden', () => {
      renderNav();
      openMoreDrawer();

      const backdrop = document.querySelector('[data-testid="drawer-backdrop"]');
      expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  /* ─── Race Conditions & Timer Safety ─────────────────────────────────── */
  describe('Race Conditions & Timer Safety', () => {
    it('prevents race conditions on rapid open-close-open', () => {
      renderNav();

      const moreBtn = screen.getByRole('button', { name: 'More asset categories' });

      // Open drawer
      fireEvent.click(moreBtn);
      expect(getDialog()).toBeDefined();

      // Close drawer (starts animation timer)
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);

      // Fast-forward 100ms (timer has remaining time)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Re-open drawer before timer fires
      fireEvent.click(moreBtn);

      // Advance by remaining timer duration
      act(() => {
        vi.advanceTimersByTime(260);
      });

      // Dialog should still be open because the old close timer was cancelled!
      expect(getDialog()).toBeDefined();
    });

    it('cleans up timers on unmount without errors', () => {
      const { unmount } = render(
        <MobileBottomNav activeAsset="home" onChangeAsset={vi.fn()} />
      );

      openMoreDrawer();

      // Start close animation (creates timer)
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);

      // Unmount before timer fires — should not throw
      expect(() => unmount()).not.toThrow();

      // Advance past where timer would have fired
      act(() => {
        vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS + 100);
      });
    });
  });

  /* ─── Drawer State Callback ──────────────────────────────────────────── */
  describe('Drawer State Callback', () => {
    it('calls onDrawerStateChange(true) on open', () => {
      const onDrawerStateChange = vi.fn();
      renderNav({ onDrawerStateChange });

      openMoreDrawer();
      expect(onDrawerStateChange).toHaveBeenCalledWith(true);
    });

    it('calls onDrawerStateChange(false) on close', () => {
      const onDrawerStateChange = vi.fn();
      renderNav({ onDrawerStateChange });

      openMoreDrawer();
      onDrawerStateChange.mockClear();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      act(() => { vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS); });

      expect(onDrawerStateChange).toHaveBeenCalledWith(false);
    });

    it('works correctly without onDrawerStateChange prop', () => {
      renderNav();

      // Should not throw
      expect(() => {
        openMoreDrawer();
      }).not.toThrow();
    });
  });

  /* ─── Active Asset Change Navigation ─────────────────────────────────── */
  describe('Active Asset Change Navigation', () => {
    it('closes drawer when activeAsset changes externally', () => {
      const { rerender } = render(
        <MobileBottomNav activeAsset="home" onChangeAsset={vi.fn()} />
      );

      openMoreDrawer();
      expect(getDialog()).toBeDefined();

      // Simulate parent changing activeAsset
      rerender(
        <MobileBottomNav activeAsset="gold" onChangeAsset={vi.fn()} />
      );

      act(() => {
        vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS);
      });

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('does not close drawer if activeAsset stays the same', () => {
      const { rerender } = render(
        <MobileBottomNav activeAsset="home" onChangeAsset={vi.fn()} />
      );

      openMoreDrawer();

      rerender(
        <MobileBottomNav activeAsset="home" onChangeAsset={vi.fn()} />
      );

      expect(getDialog()).toBeDefined();
    });
  });

  /* ─── Toggle Behavior ────────────────────────────────────────────────── */
  describe('Toggle Behavior', () => {
    it('toggles drawer closed when More button is clicked while open', () => {
      renderNav();

      openMoreDrawer();
      expect(getDialog()).toBeDefined();

      // Click More again to close
      fireEvent.click(screen.getByRole('button', { name: /More/i }));

      act(() => { vi.advanceTimersByTime(NAV_CLOSE_ANIMATION_MS); });
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});

/* ── Module-level constant mirroring NAV_CONSTANTS.CLOSE_ANIMATION_MS ──── */
const NAV_CLOSE_ANIMATION_MS = 360;
