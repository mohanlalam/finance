// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';
import ErrorBoundary from '../../components/ErrorBoundary';
import { ToastProvider, useToastActions } from '../../contexts/ToastContext';
import ToastContainer from '../../components/Toast';

afterEach(() => {
  cleanup();
});

// Test Component for Toast Actions
function ToastTester() {
  const { addToast } = useToastActions();
  return (
    <button onClick={() => addToast('Test Message', 'success')}>
      Trigger Toast
    </button>
  );
}

// Crashing Component for Error Boundary testing
function CrashingComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('Test Crash Error');
  }
  return <div>Safe Component</div>;
}

describe('EmptyState Component', () => {
  it('renders title, description, and CTA action button', () => {
    const handleCta = vi.fn();
    render(
      <EmptyState
        type="stocks"
        title="No holdings found"
        description="Please add holdings to start tracking."
        actionButton={
          <button onClick={handleCta}>Add Holding</button>
        }
      />
    );

    expect(screen.getByText('No holdings found')).toBeDefined();
    expect(screen.getByText('Please add holdings to start tracking.')).toBeDefined();
    
    const ctaBtn = screen.getByText('Add Holding');
    expect(ctaBtn).toBeDefined();
    fireEvent.click(ctaBtn);
    expect(handleCta).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Child')).toBeDefined();
  });

  it('catches render error and displays fallback UI', () => {
    // Suppress console.error log for expected test crash
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashingComponent shouldCrash={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText(/An unexpected error occurred/)).toBeDefined();
    expect(screen.getByText('Technical details')).toBeDefined();
    expect(screen.getByText(/Test Crash Error/)).toBeDefined();

    consoleSpy.mockRestore();
  });
});

describe('Toast System', () => {
  it('adds and clears toasts correctly via Provider and Container', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastTester />
        <ToastContainer />
      </ToastProvider>
    );

    // No toast displayed initially
    expect(screen.queryByRole('alert')).toBeNull();

    // Trigger toast
    const triggerBtn = screen.getByText('Trigger Toast');
    fireEvent.click(triggerBtn);

    // Toast should now be visible
    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(screen.getByText('Test Message')).toBeDefined();

    // Fast-forward timers by 3 seconds (3000ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Toast should auto-dismiss
    expect(screen.queryByRole('alert')).toBeNull();

    vi.useRealTimers();
  });

  it('can be manually dismissed using the close button', () => {
    render(
      <ToastProvider>
        <ToastTester />
        <ToastContainer />
      </ToastProvider>
    );

    // Trigger toast
    const triggerBtn = screen.getByText('Trigger Toast');
    fireEvent.click(triggerBtn);

    // Click close button
    const closeBtn = screen.getByLabelText('Close notification');
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);

    // Toast should be removed instantly
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
