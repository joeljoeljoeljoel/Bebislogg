import { useEffect, useState } from 'react';
import { MIN } from '../domain/time';

let offset = 0;

/** Current time. Use this rather than Date.now() so the dev clock (?time=) applies. */
export const clockNow = () => Date.now() + offset;

/** Development only: shift the clock. */
export function setClockOffset(ms: number) {
  offset = ms;
}

/**
 * The current time, updated on every minute boundary and whenever the app
 * comes back into view. Drives timers and the Auto theme.
 */
export function useNow(): number {
  const [now, setNow] = useState(clockNow);
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(clockNow());
        schedule();
      }, MIN - (clockNow() % MIN) + 20);
    };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(timer);
      setNow(clockNow());
      schedule();
    };
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}
