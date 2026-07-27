import { useEffect } from 'react';

export function useKeyboardShortcuts(onRefresh: () => void) {
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      // Ctrl+Shift+R — Refresh prices (case-insensitive to handle Caps Lock variations)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRefresh();
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onRefresh]);
}

export default useKeyboardShortcuts;
