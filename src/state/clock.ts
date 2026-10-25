import { useEffect, useState } from 'react';
import { MIN } from '../domain/time';

let offset = 0;
const listeners = new Set<() => void>();

/** Current time. Use this rather than Date.now() so the dev clock (?time=) applies. */
export const clockNow = () => Date.now() + offset;

/** Development only: shift the clock. */
export function setClockOffset(ms: number) {
  offset = ms;
}

/** Update every useNow() right away, e.g. after something was logged. */
export function refreshNow() {
  listeners.forEach((l) => l());
}

/**
 * The current time, updated on every minute boundary, when the app comes back
 * into view and on refreshNow(). Drives timers and the Auto theme.
 */
export function useNow(): number {
  const [now, setNow] = useState(clockNow);
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(update, MIN - (clockNow() % MIN) + 20);
    };
    const update = () => {
      window.clearTimeout(timer);
      setNow(clockNow());
      schedule();
    };
    const onVisible = () => document.visibilityState === 'visible' && update();
    schedule();
    listeners.add(update);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      listeners.delete(update);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}
