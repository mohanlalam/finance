// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PinLockScreen from '../PinLockScreen';
import * as auth from '../../utils/auth';
import * as biometrics from '../../utils/biometrics';

vi.mock('../../utils/auth', () => ({
  verifyPin: vi.fn(),
  markSessionVerified: vi.fn(),
  acquireSessionToken: vi.fn(),
  prewarmSessionCache: vi.fn(),
  clearCustomPin: vi.fn(),
  getPinLength: vi.fn(() => 4),
  hashPin: vi.fn((pin: string) => Promise.resolve(`hash-${pin}`)),
}));

vi.mock('../../utils/biometrics', () => ({
  isBiometricsSupported: vi.fn(() => Promise.resolve(false)),
  isBiometricsEnrolled: vi.fn(() => false),
  isBiometricAutoPromptEnabled: vi.fn(() => false),
  authenticateWithBiometrics: vi.fn(),
}));

vi.mock('../../utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

describe('PinLockScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    (auth.getPinLength as ReturnType<typeof vi.fn>).mockReturnValue(4);
    (biometrics.isBiometricsSupported as ReturnType<typeof vi.fn>).mockReturnValue(Promise.resolve(false));
    (biometrics.isBiometricsEnrolled as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders numeric keypad with digits 1 through 9 and 0', () => {
    render(<PinLockScreen onUnlock={vi.fn()} />);

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByLabelText(`Digit ${i}`)).toBeDefined();
    }
  });

  it('calls onUnlock when correct 4-digit PIN is entered', async () => {
    const onUnlock = vi.fn();
    (auth.verifyPin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(<PinLockScreen onUnlock={onUnlock} />);

    // Click 1, 2, 3, 4
    fireEvent.click(screen.getByLabelText('Digit 1'));
    fireEvent.click(screen.getByLabelText('Digit 2'));
    fireEvent.click(screen.getByLabelText('Digit 3'));
    fireEvent.click(screen.getByLabelText('Digit 4'));

    await waitFor(() => {
      expect(auth.verifyPin).toHaveBeenCalledWith('1234');
    });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalled();
    }, { timeout: 1500 });
  });

  it('displays error message on incorrect PIN entry', async () => {
    const onUnlock = vi.fn();
    (auth.verifyPin as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    render(<PinLockScreen onUnlock={onUnlock} />);

    // Click 9, 9, 9, 9
    fireEvent.click(screen.getByLabelText('Digit 9'));
    fireEvent.click(screen.getByLabelText('Digit 9'));
    fireEvent.click(screen.getByLabelText('Digit 9'));
    fireEvent.click(screen.getByLabelText('Digit 9'));

    await waitFor(() => {
      expect(auth.verifyPin).toHaveBeenCalledWith('9999');
    });

    await waitFor(() => {
      expect(screen.getByText(/Incorrect PIN/i)).toBeDefined();
      expect(onUnlock).not.toHaveBeenCalled();
    });
  });

  it('supports backspace / delete button to remove digits', async () => {
    render(<PinLockScreen onUnlock={vi.fn()} />);

    const btn1 = screen.getByLabelText('Digit 1');

    // Type two digits so the delete button is visible
    fireEvent.click(btn1);
    fireEvent.click(btn1);

    const deleteBtn = screen.getByLabelText('Delete last digit');
    expect(deleteBtn).toBeDefined();

    // Delete one digit
    fireEvent.click(deleteBtn);

    // Should not trigger verification yet as length is 1
    expect(auth.verifyPin).not.toHaveBeenCalled();
  });

  it('handles keyboard numeric input events', async () => {
    const onUnlock = vi.fn();
    (auth.verifyPin as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(<PinLockScreen onUnlock={onUnlock} />);

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: '3' });
    fireEvent.keyDown(window, { key: '4' });

    await waitFor(() => {
      expect(auth.verifyPin).toHaveBeenCalledWith('1234');
    });
  });

  it('shows biometric button when biometrics are supported and enrolled', async () => {
    (biometrics.isBiometricsSupported as ReturnType<typeof vi.fn>).mockReturnValue(Promise.resolve(true));
    (biometrics.isBiometricsEnrolled as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<PinLockScreen onUnlock={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Unlock with Biometrics/i)).toBeDefined();
    });
  });
});
