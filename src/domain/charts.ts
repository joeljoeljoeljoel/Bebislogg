// Data for the charts and the week table in Insikter.
import type { Model } from './model';
import { dygnLabel } from './days';
import { type Interval, MAX_FEED_INTERVAL, feedIntervals, wakeWindows } from './forecast';
import { type DayStats, allDygn, dayStats } from './stats';
import { DAY, HOUR, WEEKDAYS, addDays, atTime, shortDate } from './time';

export type Period = 7 | 28;

/** Charts appear after half a day of data. */
export const hasChartData = (m: Model) => m.firstTs !== null && m.dataDays >= 0.5;

/** Stats for the last `period` dygn with data, oldest first. */
export function periodDays(m: Model, period: Period): DayStats[] {
  return allDygn(m)
    .slice(0, period)
    .reverse()
    .map((D) => dayStats(m, D));
}

export interface SleepMapRow {
  /** 18:00 to 18:00 the next day */
  start: number;
  end: number;
  /** "sön", or "25 okt" on every 7th row of 4 weeks */
  label: string | null;
  night: [number, number];
  sleeps: [number, number][];
  meals: { t: number; bottle: boolean }[];
}

/** One row per dygn running 18–18, so a night is never split. Newest first. */
export function sleepMapRows(m: Model, period: Period): SleepMapRow[] {
  const count = Math.min(period, Math.max(1, Math.ceil(m.dataDays + 0.5)));
  let base = atTime(m.now, 18 * 60);
  if (base > m.now) base = addDays(base, -1);
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(base, -i);
    const end = addDays(start, 1);
    let ns = atTime(start, m.night.start);
    if (ns < start) ns = addDays(ns, 1);
    let ne = atTime(ns, m.night.end);
    if (ne <= ns) ne = addDays(ne, 1);
    const morning = end - HOUR;
    const label = period === 7 ? WEEKDAYS[new Date(morning).getDay()] : i % 7 === 0 ? shortDate(morning) : null;
    const sleeps: [number, number][] = [];
    for (const s of m.sleeps) {
      const a = Math.max(s.start, start);
      const b = Math.min(s.end ?? m.now, end);
      if (b > a) sleeps.push([a, b]);
    }
    return {
      start,
      end,
      label,
      night: [Math.min(ns, end), Math.min(ne, end)],
      sleeps,
      meals: m.meals.filter((x) => x.t >= start && x.t < end).map((x) => ({ t: x.t, bottle: x.type === 'bottle' })),
    };
  });
}

export const wakeWindowsIn = (m: Model, period: Period): Interval[] =>
  wakeWindows(m.sleeps).filter((w) => w.t > m.now - period * DAY);

/** Intervals of 6 hours or more are left out, as in the forecast. */
export const feedIntervalsIn = (m: Model, period: Period): Interval[] =>
  feedIntervals(m.sessions).filter((x) => x.t > m.now - period * DAY && x.len < MAX_FEED_INTERVAL);

export interface BalanceWeek {
  label: string;
  V: number;
  H: number;
}

/** Breastfeeds per side for the last 2 weeks (or 4), newest first. */
export function balanceWeeks(m: Model, period: Period): BalanceWeek[] {
  const weeks: BalanceWeek[] = [];
  const count = period === 7 ? 2 : 4;
  for (let i = 0; i < count; i++) {
    const a = m.now - (i + 1) * 7 * DAY;
    const b = m.now - i * 7 * DAY;
    if (m.firstTs === null || b < m.firstTs) break;
    const feeds = m.feeds.filter((f) => f.t > a && f.t <= b);
    weeks.push({
      label: i === 0 ? 'Senaste 7 d' : i === 1 ? 'Veckan innan' : `${i} v sedan`,
      V: feeds.filter((f) => f.side === 'V').length,
      H: feeds.filter((f) => f.side === 'H').length,
    });
  }
  return weeks;
}

export interface WeekRow extends DayStats {
  /** "Idag", "Igår" or a weekday */
  label: string;
}

/** The week table: the last 7 dygn, newest first. */
export function weekRows(m: Model): WeekRow[] {
  return allDygn(m)
    .slice(0, 7)
    .map((D) => {
      const label = dygnLabel(D, m.now, m.night);
      return { ...dayStats(m, D), label: label === 'Idag' || label === 'Igår' ? label : WEEKDAYS[new Date(D).getDay()] };
    });
}
