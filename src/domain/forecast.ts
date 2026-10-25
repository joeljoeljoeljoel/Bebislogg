import type { Sleep } from './types';
import type { Model } from './model';
import type { Session } from './sessions';
import type { Status } from './status';
import { isNight } from './days';
import { DAY, HOUR, MIN, dur, hm, median, round5 } from './time';

/** Something that started at t and lasted len ms. */
export interface Interval {
  t: number;
  len: number;
}

/** Forecasts and most insights need at least this many days of data. */
export const FORECAST_MIN_DAYS = 3;
/** Longer feeding intervals are left out of the forecast and the chart. */
export const MAX_FEED_INTERVAL = 6 * HOUR;

export const NO_FORECAST_TEXT = 'Prognoser visas när det finns några dygns data';

/** Wake windows: from the end of one sleep to the start of the next. */
export function wakeWindows(sleeps: Sleep[]): Interval[] {
  const out: Interval[] = [];
  for (let i = 0; i < sleeps.length - 1; i++) {
    const a = sleeps[i];
    const b = sleeps[i + 1];
    if (a.end !== null && b.start > a.end) out.push({ t: a.end, len: b.start - a.end });
  }
  return out;
}

/** Start-to-start intervals between feeding sessions. */
export function feedIntervals(sessions: Session[]): Interval[] {
  const out: Interval[] = [];
  for (let i = 0; i < sessions.length - 1; i++) {
    out.push({ t: sessions[i].t, len: sessions[i + 1].t - sessions[i].t });
  }
  return out;
}

export const canForecast = (m: Model) => m.dataDays >= FORECAST_MIN_DAYS;

export interface Fatigue {
  /** Typical wake window */
  median: number;
  /** 0–1, how far into the typical wake window we are; never more than 1 */
  progress: number;
  text: string;
}

/**
 * Median wake window over the last 7 days, using only windows with the same
 * night/day status as now. Shown only while awake.
 */
export function fatigue(m: Model, status: Status): Fatigue | null {
  if (!canForecast(m) || status.kind !== 'awake') return null;
  const nightNow = isNight(m.now, m.night);
  const med = median(
    wakeWindows(m.sleeps)
      .filter((w) => w.t > m.now - 7 * DAY && isNight(w.t, m.night) === nightNow)
      .map((w) => w.len),
  );
  if (!med) return null;
  return {
    median: med,
    progress: Math.min(1, (m.now - status.since) / med),
    text: `Brukar bli trött efter ca ${dur(round5(med))}`,
  };
}

/** Next feeding: the last session's start plus the median interval of the last 3 days. */
export function forecastText(m: Model): string {
  const last = m.sessions.at(-1);
  if (!canForecast(m) || !last) return NO_FORECAST_TEXT;
  const med = median(
    feedIntervals(m.sessions)
      .filter((x) => x.t > m.now - 3 * DAY && x.len < MAX_FEED_INTERVAL)
      .map((x) => x.len),
  );
  if (!med) return NO_FORECAST_TEXT;
  const next = round5(last.t + med);
  return next <= m.now + 2 * MIN
    ? `Brukar vara dags för ${m.words.one} ungefär nu`
    : `Nästa ${m.words.one} troligen runt ${hm(next)}`;
}
