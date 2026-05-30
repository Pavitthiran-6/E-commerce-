/**
 * useNetworkRecovery
 *
 * Detects:
 *  1. Online / offline browser events
 *  2. Tab visibility changes (sleep / wake recovery)
 *  3. Window focus (user switches back to the tab)
 *
 * Calls the provided `onRecover` callback whenever the browser appears to
 * have come back online or the user has returned to the tab after a period
 * of inactivity.  The callback is debounced (300 ms) so that rapid re-fires
 * (e.g. flapping connection) don't result in multiple simultaneous fetches.
 *
 * Usage:
 *   useNetworkRecovery(() => refetchData());
 */
import { useEffect, useRef } from 'react';

export function useNetworkRecovery(onRecover: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp of the last time we were hidden (sleep / background)
  const hiddenAtRef = useRef<number | null>(null);

  const debounced = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onRecover();
    }, 300);
  };

  useEffect(() => {
    const handleOnline = () => {
      // Clear the "backend unreachable" fast-fallback flag so the next
      // real request actually reaches the server again.
      sessionStorage.removeItem('belledonne_backend_unreachable');
      debounced();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const hiddenDuration = hiddenAtRef.current
          ? Date.now() - hiddenAtRef.current
          : 0;
        hiddenAtRef.current = null;

        // Only refetch if the tab was hidden for more than 30 seconds
        // (catches sleep / lock-screen scenarios without firing on every alt-tab)
        if (hiddenDuration > 30_000 || navigator.onLine) {
          sessionStorage.removeItem('belledonne_backend_unreachable');
          debounced();
        }
      }
    };

    const handleFocus = () => {
      // Window focus fires when the user switches back to the browser window.
      // Only trigger a recovery when we're also online.
      if (navigator.onLine) {
        debounced();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRecover]);
}
