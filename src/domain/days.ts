import type { Settings } from './types';
import { WEEKDAYS, addDays, atTime, parseHM, shortDate } from './time';

/** Night period as minutes after midnight. Usually crosses midnight (19:00–07:00). */
export interface NightConfig {
  start: number;
  end: number;
}

export const nightConfig = (s: Pick<Settings, 'nightStart' | 'nightEnd'>): NightConfig => ({
  start: parseHM(s.nightStart),
  end: parseHM(s.nightEnd),
});

/** Whether the wall-clock time of ts falls within the night period. */
export function isNight(ts: number, n: NightConfig): boolean {
  const d = new Date(ts);
  const x = d.getHours() * 60 + d.getMinutes();
  return n.start > n.end ? x >= n.start || x < n.end : x >= n.start && x < n.end;
}

/**
 * Start of the dygn containing ts. A dygn runs from nightEnd (07:00) to the
 * same wall-clock time the next day, so a night is never split in two.
 */
export function dygnStart(ts: number, n: NightConfig): number {
  const d = atTime(ts, n.end);
  return d > ts ? addDays(d, -1) : d;
}

export const dygnEnd = (D: number) => addDays(D, 1);

/**
 * Night window of the dygn starting at D: from the last nightStart before the
 * dygn ends, until it ends. Computed on the wall clock, so the window is 13 h
 * on the night DST ends and 11 h on the night it starts.
 */
export function nightWindow(D: number, n: NightConfig): [number, number] {
  const E = dygnEnd(D);
  if (n.start === n.end) return [E, E];
  let s = atTime(E, n.start);
  if (s >= E) s = addDays(s, -1);
  return [Math.max(s, D), E];
}

/** Dygn starts from the one containing `now` back to the one containing `from`, newest first. */
export function dygnList(from: number, now: number, n: NightConfig): number[] {
  const first = dygnStart(from, n);
  const out: number[] = [];
  for (let D = dygnStart(now, n); D >= first; D = addDays(D, -1)) out.push(D);
  return out;
}

/** Dygn label for Dagbok: "Idag", "Igår" or "tor 22 okt". */
export function dygnLabel(D: number, now: number, n: NightConfig): string {
  const today = dygnStart(now, n);
  if (D === today) return 'Idag';
  if (D === addDays(today, -1)) return 'Igår';
  return `${WEEKDAYS[new Date(D).getDay()]} ${shortDate(D)}`;
}
