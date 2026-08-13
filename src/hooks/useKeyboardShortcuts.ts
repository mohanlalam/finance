import { useEffect } from 'react';

export function useKeyboardShortcuts(onRefresh: () => void) {
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      // Ignore global shortcuts if active element is an input control or inside a modal
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          activeEl.isContentEditable ||
          activeEl.closest('[role="dialog"]')
        ) {
          return;
        }
      }

      // Ctrl+Shift+R or Cmd+Shift+R — Refresh prices
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        (window as unknown as { __lastShortcutTime?: number }).__lastShortcutTime = Date.now();
        onRefresh();
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onRefresh]);
}

export default useKeyboardShortcuts;
