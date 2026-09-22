/**
 * scrollLock.ts — Reference-counted body scroll lock.
 *
 * Prevents the race condition where two independent sheet components both call
 * `document.body.style.overflow = ''` in their cleanup, unlocking the body
 * while the sibling sheet is still open.
 *
 * Usage:
 *   import { lockScroll, unlockScroll } from '../utils/scrollLock';
 *
 *   useEffect(() => {
 *     if (isOpen) lockScroll();
 *     return () => unlockScroll();
 *   }, [isOpen]);
 */

let lockCount = 0;

export function lockScroll(): void {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

/** Force-reset the lock (e.g. on route change or app-level error recovery). */
export function resetScrollLock(): void {
  lockCount = 0;
  document.body.style.overflow = '';
}
