// The summary for BVC: the last finished dygn, with averages per dygn.
import type { Model } from './model';
import type { Period } from './charts';
import { completeDays } from './stats';
import { WEEKDAYS, ageText, average, shortDate, startOfDay } from './time';
import { vitdOn } from './vitd';
import type { Words } from './wording';

export interface BvcRow {
  D: number;
  /** "tor 22 okt" */
  label: string;
  total: number;
  night: number;
  /** Longest sleep starting in the night window */
  nightLongest: number;
  naps: number;
  sessions: number;
  ml: number;
  vitd: boolean;
}

export interface BvcSummary {
  name: string;
  age: string;
  /** "16–22 okt" */
  periodLabel: string;
  /** Newest first. Only finished dygn: today's would pull the averages down. */
  rows: BvcRow[];
  avg: {
    total: number;
    night: number;
    /** Null when no night had a sleep to measure */
    nightLongest: number | null;
    naps: number;
    sessions: number;
    ml: number;
  };
  vitd: { given: number; days: number };
  /** The ml column and average apply when bottles are in use */
  showMl: boolean;
  words: Words;
  createdAt: number;
}

/** "16–22 okt", "28 sep – 4 okt", "29 dec 2026 – 4 jan 2027" */
export function rangeLabel(from: number, to: number): string {
  const a = new Date(from);
  const b = new Date(to);
  if (a.getFullYear() !== b.getFullYear()) {
    return `${shortDate(from)} ${a.getFullYear()} – ${shortDate(to)} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) return `${shortDate(from)} – ${shortDate(to)}`;
  return a.getDate() === b.getDate() ? shortDate(to) : `${a.getDate()}–${shortDate(to)}`;
}

export function bvcSummary(m: Model, period: Period): BvcSummary {
  const days = completeDays(m).slice(0, period);
  const rows = days.map(
    (s): BvcRow => ({
      D: s.D,
      label: `${WEEKDAYS[new Date(s.D).getDay()]} ${shortDate(s.D)}`,
      total: s.total,
      night: s.night,
      nightLongest: s.nightLongest,
      naps: s.naps,
      sessions: s.sessions,
      ml: s.ml,
      // Vitamin D counts per calendar day: the day each dygn begins on.
      vitd: vitdOn(m, startOfDay(s.D)) !== null,
    }),
  );
  const mean = (pick: (r: BvcRow) => number) => average(rows.map(pick)) ?? 0;

  return {
    name: m.settings.name.trim() || 'Bebis',
    age: ageText(m.settings.birth, m.now),
    periodLabel: rows.length ? rangeLabel(rows.at(-1)!.D, rows[0].D) : '',
    rows,
    avg: {
      total: mean((r) => r.total),
      night: mean((r) => r.night),
      nightLongest: average(rows.filter((r) => r.nightLongest > 0).map((r) => r.nightLongest)),
      naps: mean((r) => r.naps),
      sessions: mean((r) => r.sessions),
      ml: mean((r) => r.ml),
    },
    vitd: { given: rows.filter((r) => r.vitd).length, days: rows.length },
    showMl: m.useBottle,
    words: m.words,
    createdAt: m.now,
  };
}
