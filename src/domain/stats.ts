import type { Model } from './model';
import { dygnEnd, dygnList, nightWindow } from './days';
import { overlap } from './time';

export interface DayStats {
  /** Dygn start and end */
  D: number;
  E: number;
  /** Sleep within the dygn; an ongoing sleep counts up to now */
  total: number;
  night: number;
  day: number;
  /** Sleeps starting in the dygn before the night window */
  naps: number;
  /** Longest sleep starting in the dygn */
  longest: number;
  /** Longest sleep starting in the night window */
  nightLongest: number;
  /** Feeding sessions starting in the dygn */
  sessions: number;
  /** Of which include a bottle */
  bottleSessions: number;
  ml: number;
  /** Longest start-to-start gap from a session in the dygn to the next */
  longestInterval: number;
  /** The dygn is still in progress */
  partial: boolean;
}

export function dayStats(m: Model, D: number): DayStats {
  const E = dygnEnd(D);
  const [nS] = nightWindow(D, m.night);
  let total = 0;
  let night = 0;
  let naps = 0;
  let longest = 0;
  let nightLongest = 0;
  for (const s of m.sleeps) {
    const end = s.end ?? m.now;
    total += overlap(s.start, end, D, E);
    night += overlap(s.start, end, nS, E);
    if (s.start >= D && s.start < E) {
      const len = end - s.start;
      longest = Math.max(longest, len);
      if (s.start < nS) naps++;
      else nightLongest = Math.max(nightLongest, len);
    }
  }

  let sessions = 0;
  let bottleSessions = 0;
  let longestInterval = 0;
  m.sessions.forEach((s, i) => {
    if (s.t < D || s.t >= E) return;
    sessions++;
    if (s.meals.some((x) => x.type === 'bottle')) bottleSessions++;
    const next = m.sessions[i + 1];
    if (next) longestInterval = Math.max(longestInterval, next.t - s.t);
  });

  const ml = m.bottles.filter((b) => b.t >= D && b.t < E).reduce((a, b) => a + b.ml, 0);

  return {
    D,
    E,
    total,
    night,
    day: total - night,
    naps,
    longest,
    nightLongest,
    sessions,
    bottleSessions,
    ml,
    longestInterval,
    partial: E > m.now,
  };
}

/** All dygn with data, newest first. */
export function allDygn(m: Model): number[] {
  return m.firstTs === null ? [] : dygnList(m.firstTs, m.now, m.night);
}

/** Stats of finished dygn, newest first. */
export function completeDays(m: Model): DayStats[] {
  return allDygn(m)
    .filter((D) => dygnEnd(D) <= m.now)
    .map((D) => dayStats(m, D));
}
