import { useEffect } from 'react';

export function useKeyboardShortcuts(onRefresh: () => void) {
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      // Ctrl+Shift+R — Refresh prices
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        onRefresh();
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onRefresh]);
}

export default useKeyboardShortcuts;
