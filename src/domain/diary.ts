import type { LogEvent } from './types';
import type { Model } from './model';
import { dygnEnd, dygnLabel } from './days';
import { getStatus } from './status';
import { allDygn, dayStats } from './stats';
import { MIN, dur, hm } from './time';
import { cap, sideName } from './wording';

export interface DiaryEntry {
  kind: 'event';
  key: string;
  event: LogEvent;
  /** "14:32–15:40" or "14:05" */
  time: string;
  sub: string;
  right: string;
  /** Row height in px; sleeps grow with their length */
  height: number;
}

export interface DiaryWake {
  kind: 'wake';
  key: string;
  /** "vaken 1 h 05 min", "… · pågår" */
  text: string;
}

export type DiaryItem = DiaryEntry | DiaryWake;

export interface DiaryDay {
  D: number;
  label: string;
  /** "Sömn 14 h 05 min · 9 matningar · 240 ml" */
  summary: string;
  stats: { label: string; value: string }[];
  /** Newest first */
  items: DiaryItem[];
}

/** Sleep rows are 54–104 px, in proportion to the length. */
export const sleepRowHeight = (ms: number) => Math.round(Math.min(104, Math.max(54, 40 + (ms / MIN) * 0.3)));

function entry(m: Model, e: LogEvent): DiaryEntry {
  const base = { kind: 'event' as const, key: e.id, event: e };
  switch (e.type) {
    case 'sleep': {
      const len = (e.end ?? m.now) - e.start;
      return {
        ...base,
        time: `${hm(e.start)}–${e.end !== null ? hm(e.end) : ''}`,
        sub: e.end !== null ? 'Sömn' : 'Sover nu',
        right: dur(len),
        height: sleepRowHeight(len),
      };
    }
    case 'vitd':
      return { ...base, time: hm(e.t), sub: 'D-droppar', right: '', height: 46 };
    case 'bottle': {
      const joined = m.sessionOf.get(e.id)!.meals[0] !== e;
      return { ...base, time: hm(e.t), sub: joined ? 'Flaska · samma tillfälle' : 'Flaska', right: `${e.ml} ml`, height: 52 };
    }
    case 'feed': {
      const session = m.sessionOf.get(e.id)!;
      const joined = session.meals[0] !== e;
      const sub = `Amning ${sideName(e.side)}${joined ? ' · samma tillfälle' : ''}`;
      return { ...base, time: hm(e.t), sub, right: joined ? `+${dur(e.t - session.t)}` : '', height: joined ? 44 : 52 };
    }
  }
}

/** Every row with its sort time; wake windows sit right below the sleep they lead up to. */
function allItems(m: Model): { k: number; item: DiaryItem }[] {
  const out: { k: number; item: DiaryItem }[] = [];
  m.sleeps.forEach((s, i) => {
    out.push({ k: s.start, item: entry(m, s) });
    const prev = m.sleeps[i - 1];
    if (prev?.end != null && s.start > prev.end) {
      out.push({ k: s.start - 1, item: { kind: 'wake', key: `w${s.id}`, text: `vaken ${dur(s.start - prev.end)}` } });
    }
  });
  for (const e of [...m.meals, ...m.vitds]) out.push({ k: e.t, item: entry(m, e) });
  const status = getStatus(m);
  if (status.kind === 'awake') {
    out.push({ k: m.now, item: { kind: 'wake', key: 'live', text: `vaken ${dur(m.now - status.since)} · pågår` } });
  }
  return out.sort((a, b) => b.k - a.k);
}

/** The newest `count` dygn for Dagbok. */
export function diaryDays(m: Model, count: number): { days: DiaryDay[]; hasMore: boolean } {
  const all = allDygn(m);
  const items = allItems(m);
  const { one, many } = m.words;
  const days = all.slice(0, count).map((D): DiaryDay => {
    const s = dayStats(m, D);
    const E = dygnEnd(D);
    const ml = m.useBottle && s.ml ? ` · ${s.ml} ml` : '';
    return {
      D,
      label: dygnLabel(D, m.now, m.night),
      summary: `Sömn ${dur(s.total)} · ${s.sessions} ${s.sessions === 1 ? one : many}${ml}`,
      stats: [
        { label: 'Total sömn', value: dur(s.total) },
        { label: 'Varav natt', value: dur(s.night) },
        { label: 'Tupplurar', value: String(s.naps) },
        { label: 'Längsta pass', value: dur(s.longest) },
        { label: cap(many), value: String(s.sessions) },
        { label: 'Längsta intervall', value: s.longestInterval ? dur(s.longestInterval) : '–' },
        ...(m.useBottle ? [{ label: 'Flaska totalt', value: `${s.ml} ml` }] : []),
      ],
      items: items.filter((x) => x.k >= D && x.k < E).map((x) => x.item),
    };
  });
  return { days, hasMore: all.length > count };
}
