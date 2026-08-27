// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Header from '../Header';
import { PrivacyProvider } from '../../contexts/PrivacyContext';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const defaultProps = {
  status: 'idle' as const,
  lastUpdated: new Date('2026-08-27T10:00:00Z'),
  onRefresh: vi.fn(),
  portfolios: [],
  onImportCSV: vi.fn(),
  portfolioOptions: [{ name: 'all', label: 'Family' }],
  alerts: [],
  onDismissAlert: vi.fn(),
  onDismissAll: vi.fn(),
  darkMode: false,
  onToggleDarkMode: vi.fn(),
  onChangePinClick: vi.fn(),
  onOpenMobileAlerts: vi.fn(),
};

function renderHeader(props = {}, isMobile = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: isMobile && query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

  return render(
    <PrivacyProvider>
      <Header {...defaultProps} {...props} />
    </PrivacyProvider>
  );
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and sync button', () => {
    renderHeader();
    expect(screen.getByText('Portfolio Tracker')).toBeDefined();
    expect(screen.getByTitle(/Sync prices|Last updated/i)).toBeDefined();
  });

  it('triggers onRefresh when sync button is clicked', () => {
    const onRefresh = vi.fn();
    renderHeader({ onRefresh });
    const syncButton = screen.getByTitle(/Sync prices|Last updated/i);
    fireEvent.click(syncButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  describe('Mobile Menu Popup', () => {
    it('opens mobile menu popup when more options button is clicked', () => {
      renderHeader({}, true);
      const menuBtn = screen.getByLabelText('More options');
      expect(menuBtn).toBeDefined();

      // Click to open
      fireEvent.click(menuBtn);
      expect(screen.getByRole('menu')).toBeDefined();
      expect(screen.getByText('Notifications')).toBeDefined();
      expect(screen.getByText('Hide Balances')).toBeDefined();
      expect(screen.getByText('Theme')).toBeDefined();
      expect(screen.getByText('Security')).toBeDefined();
    });

    it('triggers theme toggle and closes menu when Theme item is clicked', () => {
      const onToggleDarkMode = vi.fn();
      renderHeader({ onToggleDarkMode }, true);
      
      const menuBtn = screen.getByLabelText('More options');
      fireEvent.click(menuBtn);

      const themeItem = screen.getByText('Theme');
      fireEvent.click(themeItem);

      expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('triggers PIN change and closes menu when Security item is clicked', () => {
      const onChangePinClick = vi.fn();
      renderHeader({ onChangePinClick }, true);
      
      const menuBtn = screen.getByLabelText('More options');
      fireEvent.click(menuBtn);

      const pinItem = screen.getByText('Security');
      fireEvent.click(pinItem);

      expect(onChangePinClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('triggers mobile alerts and closes menu when Notifications item is clicked', () => {
      const onOpenMobileAlerts = vi.fn();
      renderHeader({ onOpenMobileAlerts }, true);
      
      const menuBtn = screen.getByLabelText('More options');
      fireEvent.click(menuBtn);

      const notifItem = screen.getByText('Notifications');
      fireEvent.click(notifItem);

      expect(onOpenMobileAlerts).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });
});

