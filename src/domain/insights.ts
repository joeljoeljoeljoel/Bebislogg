import type { Sleep } from './types';
import type { Model } from './model';
import { type NightConfig, isNight } from './days';
import { wakeWindows } from './forecast';
import { type DayStats, completeDays } from './stats';
import { DAY, MIN, WEEKDAYS_LONG, atTime, average, dur, median } from './time';
import { cap } from './wording';

export interface Insight {
  kicker: string;
  text: string;
  /** false → text is the "not enough data yet" placeholder */
  available: boolean;
}

/** Insight cards, computed from the baby's own data only. */
export function insights(m: Model): Insight[] {
  const { now, night, words: w } = m;
  const out: Insight[] = [];
  const add = (kicker: string, ok: boolean, needDays: number, text: () => string) =>
    out.push(
      ok
        ? { kicker, text: text(), available: true }
        : { kicker, text: `Visas när det finns ${needDays} dygns data`, available: false },
    );

  const dayWindows = wakeWindows(m.sleeps).filter((x) => !isNight(x.t, night));
  const w7 = dayWindows.filter((x) => x.t > now - 7 * DAY).map((x) => x.len);
  const wPrev = dayWindows.filter((x) => x.t > now - 14 * DAY && x.t <= now - 7 * DAY).map((x) => x.len);
  add('Vakenfönster', m.dataDays >= 7 && w7.length > 0, 7, () => {
    const prev = m.dataDays >= 14 && wPrev.length ? ` (veckan innan: ${dur(average(wPrev)!)})` : '';
    return `Vakenfönstret har i snitt varit ${dur(average(w7)!)} de senaste 7 dygnen${prev}`;
  });

  let record: Sleep | null = null;
  for (const s of m.sleeps) {
    if (s.end !== null && (!record || s.end - s.start > record.end! - record.start)) record = s;
  }
  add('Rekord', record !== null, 1, () => recordText(record!, night));

  const complete = completeDays(m);
  const c7 = complete.slice(0, 7);
  add('Dygnsrytm', c7.length >= 7, 7, () => {
    const n = c7.filter((s) => s.night > s.day).length;
    return `Mer sömn på natten än på dagen ${n} av de senaste 7 dygnen`;
  });

  const c4 = complete.slice(0, 4);
  add(w.eveningKicker, c4.length >= 4, 4, () => {
    const n = c4.filter((s) => eveningHeavy(m, s)).length;
    if (n === 4) return `Fler ${w.many} mellan 18 och 21 de senaste 4 kvällarna`;
    if (n > 0) return `Fler ${w.many} mellan 18 och 21 ${n} av de senaste 4 kvällarna`;
    return `${cap(w.many)}na har varit jämnt fördelade över dygnet de senaste 4 dygnen`;
  });

  const gaps = m.sessions
    .filter((s) => s.t > now - 7 * DAY)
    .map((s) => {
      const next = m.sleeps.find((x) => x.start >= s.end);
      return next ? next.start - s.end : null;
    })
    .filter((g): g is number => g !== null && g < 90 * MIN);
  add(`Sömn efter ${w.one}`, m.dataDays >= 7 && gaps.length > 3, 7, () => {
    const min = Math.max(5, Math.round(median(gaps)! / (5 * MIN)) * 5);
    return `Somnar oftast inom ${min} min efter ${w.one}`;
  });

  if (m.useBreast) {
    const f7 = m.feeds.filter((f) => f.t > now - 7 * DAY);
    add('Bröstbalans', m.dataDays >= 7, 7, () => {
      const h = f7.filter((f) => f.side === 'H').length;
      const v = f7.filter((f) => f.side === 'V').length;
      return `Senaste veckan: höger ${h} ${h === 1 ? 'gång' : 'gånger'}, vänster ${v}`;
    });
  }

  if (m.useBottle) {
    const b7 = m.bottles.filter((b) => b.t > now - 7 * DAY);
    add('Flaska', m.dataDays >= 7 && b7.length > 0, 7, () => {
      const perDay = Math.round(b7.reduce((a, b) => a + b.ml, 0) / 7);
      const perBottle = Math.round(average(b7.map((b) => b.ml))!);
      return `I snitt ${perDay} ml per dygn de senaste 7 dygnen, ${perBottle} ml per flaska`;
    });
  }

  return out;
}

/** "Längsta sömnpasset hittills: 3 h 40 min, natten till torsdag" or "…, på tisdag". */
function recordText(s: Sleep, night: NightConfig): string {
  const d = new Date(s.start);
  const atNight = isNight(s.start, night);
  // An evening start belongs to the night leading into the next day.
  if (atNight && d.getHours() >= 12) d.setDate(d.getDate() + 1);
  const when = atNight ? 'natten till' : 'på';
  return `Längsta sömnpasset hittills: ${dur(s.end! - s.start)}, ${when} ${WEEKDAYS_LONG[d.getDay()]}`;
}

/**
 * An evening counts when the sessions between 18 and 21 exceed 1.3 times the
 * average per 3-hour period over the rest of the dygn.
 */
function eveningHeavy(m: Model, s: DayStats): boolean {
  const a = atTime(s.D, 18 * 60);
  const b = atTime(s.D, 21 * 60);
  const inEvening = m.sessions.filter((x) => x.t >= a && x.t < b).length;
  const rest = s.sessions - inEvening;
  return inEvening > (rest / 7) * 1.3;
}
