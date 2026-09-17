// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import MobileBottomNav from '../MobileBottomNav';

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

  it('renders main navigation tabs correctly', () => {
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Stocks' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Funds' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Deposits' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'More asset categories' })).toBeDefined();
  });

  it('triggers onChangeAsset when a main tab is clicked', () => {
    const onChangeAsset = vi.fn();
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={onChangeAsset}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stocks' }));
    expect(onChangeAsset).toHaveBeenCalledWith('stocks');
  });

  it('opens More sheet when More button is clicked and manages aria attributes', () => {
    const onDrawerStateChange = vi.fn();
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={vi.fn()}
        onDrawerStateChange={onDrawerStateChange}
      />
    );

    const moreBtn = screen.getByRole('button', { name: 'More asset categories' });
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(moreBtn);

    expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(onDrawerStateChange).toHaveBeenCalledWith(true);

    // Verify it stays open indefinitely (does NOT immediately auto-minimize)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('focuses close button and supports focus trap with Tab key cycling', () => {
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'More asset categories' }));

    // Advance timer for autofocus
    act(() => {
      vi.advanceTimersByTime(50);
    });

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(document.activeElement).toBe(closeBtn);

    // Test Tab wrapping from last element to first element
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled])');
    const firstEl = focusable[0];
    const lastEl = focusable[focusableElementsLength(focusable) - 1];

    // Focus last element and press Tab -> should wrap to firstEl
    lastEl.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(firstEl);

    // Press Shift+Tab on first element -> should wrap to lastEl
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastEl);
  });

  it('closes drawer on Escape key and notifies parent', () => {
    const onDrawerStateChange = vi.fn();
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={vi.fn()}
        onDrawerStateChange={onDrawerStateChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'More asset categories' }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });

    // Sheet exit animation timeout (360ms)
    act(() => {
      vi.advanceTimersByTime(360);
    });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onDrawerStateChange).toHaveBeenCalledWith(false);
  });

  it('prevents race conditions on rapid open-close-open', () => {
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={vi.fn()}
      />
    );

    const moreBtn = screen.getByRole('button', { name: 'More asset categories' });

    // Open drawer
    fireEvent.click(moreBtn);
    expect(screen.getByRole('dialog')).toBeDefined();

    // Close drawer (starts 360ms timer)
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    // Fast-forward 100ms (timer has 260ms left)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Re-open drawer before timer fires
    fireEvent.click(moreBtn);

    // Advance by remaining 260ms (old timer would have fired here)
    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Dialog should still be open because the old close timer was cancelled!
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('navigates when an item in More sheet is clicked', () => {
    const onChangeAsset = vi.fn();
    render(
      <MobileBottomNav
        activeAsset="home"
        onChangeAsset={onChangeAsset}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'More asset categories' }));
    fireEvent.click(screen.getByRole('button', { name: /Gold Holdings/i }));

    expect(onChangeAsset).toHaveBeenCalledWith('gold');
  });
});

function focusableElementsLength(elements: NodeListOf<HTMLElement>): number {
  return elements.length;
}
