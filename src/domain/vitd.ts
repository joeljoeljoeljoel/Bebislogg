import type { VitD } from './types';
import type { Model } from './model';
import { WEEKDAYS, addDays, hm, startOfDay } from './time';

// Vitamin D drops are counted per calendar day (00–24), not per dygn.

export interface VitdDay {
  /** Local midnight */
  D: number;
  /** 0 = today */
  daysAgo: number;
  given: VitD | null;
}

export function vitdOn(m: Model, D: number): VitD | null {
  const E = addDays(D, 1);
  return m.vitds.find((v) => v.t >= D && v.t < E) ?? null;
}

/** The last n calendar days, oldest first and today last. */
export function vitdDays(m: Model, n: number): VitdDay[] {
  const today = startOfDay(m.now);
  return Array.from({ length: n }, (_, i) => {
    const daysAgo = n - 1 - i;
    const D = addDays(today, -daysAgo);
    return { D, daysAgo, given: vitdOn(m, D) };
  });
}

export interface VitdRow {
  today: VitD | null;
  title: string;
  sub: string;
  week: VitdDay[];
}

/** The vitamin D row on Nu. */
export function vitdRow(m: Model): VitdRow {
  const week = vitdDays(m, 7);
  const today = week[6].given;
  const count = week.filter((d) => d.given).length;
  const status = today ? `Idag ${hm(today.t)}` : 'Inte givna idag, tryck när de är givna';
  return {
    today,
    title: today ? 'D-droppar givna' : 'D-droppar',
    sub: `${status} · ${count} av 7 dagar`,
    week,
  };
}

/** Days for the vitamin D card in Insikter, limited to days since logging began. */
export function vitdSummary(m: Model, period: 7 | 28): { days: VitdDay[]; text: string } {
  if (m.firstTs === null) return { days: [], text: '' };
  const first = startOfDay(m.firstTs);
  const days = vitdDays(m, period).filter((d) => d.D >= first);
  const given = days.filter((d) => d.given).length;
  // Today is never counted as missed.
  const missed = days.filter((d) => !d.given && d.daysAgo > 0);
  let text = `Givna ${given} av ${days.length} ${days.length === 1 ? 'dag' : 'dagar'}`;
  if (period === 7 && missed.length && missed.length < 4) {
    text += ` · missade ${missed.map((d) => WEEKDAYS[new Date(d.D).getDay()]).join(', ')}`;
  }
  if (!days.at(-1)?.given) text += ' · inte givna idag';
  return { days, text };
}
