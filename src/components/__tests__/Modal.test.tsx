// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Modal from '../Modal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Modal Component', () => {
  it('does not render content when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).toBeNull();
    expect(screen.queryByText('Modal Content')).toBeNull();
  });

  it('renders title, children, and dialog role when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Financial Vault" ariaLabel="Vault Dialog">
        <div>Secure Data Inside</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Financial Vault')).toBeDefined();
    expect(screen.getByText('Secure Data Inside')).toBeDefined();
  });

  it('calls onClose when the close icon button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Dialog">
        <p>Dialog Body</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Body</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside on the backdrop overlay', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop Test">
        <p>Inner text</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.previousElementSibling;
    expect(backdrop).not.toBeNull();

    if (backdrop) {
      fireEvent.pointerDown(backdrop, { target: backdrop });
      fireEvent.click(backdrop, { target: backdrop });
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does NOT call onClose when preventClose is true on backdrop click or Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Locked Modal" preventClose={true}>
        <p>Async Task Running...</p>
      </Modal>
    );

    // Escape should be blocked
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    // Backdrop click should be blocked
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.previousElementSibling;
    if (backdrop) {
      fireEvent.pointerDown(backdrop, { target: backdrop });
      fireEvent.click(backdrop, { target: backdrop });
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('applies custom maxWidth class to modal container', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} maxWidth="max-w-4xl" title="Wide Modal">
        <p>Wide Content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-4xl');
  });
});
