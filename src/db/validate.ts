// Validation of data read from IndexedDB or a backup file. Unknown fields are
// dropped and anything malformed is left out rather than trusted.
import type { FeedMode, LogEvent, Settings, ThemeSetting } from '../domain/types';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function toEvent(v: unknown): LogEvent | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id) return null;
  const id = v.id;
  switch (v.type) {
    case 'sleep':
      if (!isTime(v.start)) return null;
      if (v.end !== null && !(isTime(v.end) && v.end >= v.start)) return null;
      return { id, type: 'sleep', start: v.start, end: v.end };
    case 'feed':
      if (!isTime(v.t) || (v.side !== 'V' && v.side !== 'H')) return null;
      return { id, type: 'feed', t: v.t, side: v.side };
    case 'bottle':
      if (!isTime(v.t) || !isTime(v.ml) || v.ml < 0) return null;
      return { id, type: 'bottle', t: v.t, ml: v.ml };
    case 'vitd':
      if (!isTime(v.t)) return null;
      return { id, type: 'vitd', t: v.t };
    default:
      return null;
  }
}

/** Valid events only, first occurrence of each id. */
export function toEvents(list: unknown[]): LogEvent[] {
  const seen = new Set<string>();
  const out: LogEvent[] = [];
  for (const v of list) {
    const e = toEvent(v);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const THEMES: ThemeSetting[] = ['Auto', 'Ljust', 'Mörkt'];
const MODES: FeedMode[] = ['Amning', 'Flaska', 'Båda'];

/** Settings with every invalid or missing field taken from `fallback`. */
export function toSettings(v: unknown, fallback: Settings): Settings {
  if (!isObj(v)) return fallback;
  const pick = <K extends keyof Settings>(key: K, ok: (x: unknown) => boolean): Settings[K] =>
    ok(v[key]) ? (v[key] as Settings[K]) : fallback[key];
  return {
    name: pick('name', (x) => typeof x === 'string'),
    birth: pick('birth', (x) => typeof x === 'string' && DATE.test(x)),
    nightStart: pick('nightStart', (x) => typeof x === 'string' && HHMM.test(x)),
    nightEnd: pick('nightEnd', (x) => typeof x === 'string' && HHMM.test(x)),
    theme: pick('theme', (x) => THEMES.includes(x as ThemeSetting)),
    feedMode: pick('feedMode', (x) => MODES.includes(x as FeedMode)),
    vitD: pick('vitD', (x) => typeof x === 'boolean'),
    setupDone: pick('setupDone', (x) => typeof x === 'boolean'),
    lastBackup: pick('lastBackup', (x) => x === null || isTime(x)),
  };
}
