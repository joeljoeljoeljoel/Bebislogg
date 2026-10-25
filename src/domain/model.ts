import type { Bottle, Feed, FeedMode, LogEvent, Meal, Settings, Sleep, VitD } from './types';
import { type NightConfig, nightConfig } from './days';
import { type Session, buildSessions } from './sessions';
import { DAY } from './time';
import { type Words, words } from './wording';

/** Everything derived from the raw events that several views need. */
export interface Model {
  now: number;
  settings: Settings;
  night: NightConfig;
  mode: FeedMode;
  useBreast: boolean;
  useBottle: boolean;
  words: Words;
  /** Sorted by start */
  sleeps: Sleep[];
  openSleep: Sleep | null;
  /** Sorted by time */
  feeds: Feed[];
  bottles: Bottle[];
  meals: Meal[];
  vitds: VitD[];
  sessions: Session[];
  sessionOf: Map<string, Session>;
  /** Time of the earliest event, null when nothing is logged */
  firstTs: number | null;
  /** Days of data so far, fractional */
  dataDays: number;
}

export const eventTime = (e: LogEvent) => (e.type === 'sleep' ? e.start : e.t);

const byT = (a: { t: number }, b: { t: number }) => a.t - b.t;

export function buildModel(events: LogEvent[], settings: Settings, now: number): Model {
  const sleeps = events.filter((e): e is Sleep => e.type === 'sleep').sort((a, b) => a.start - b.start);
  const feeds = events.filter((e): e is Feed => e.type === 'feed').sort(byT);
  const bottles = events.filter((e): e is Bottle => e.type === 'bottle').sort(byT);
  const vitds = events.filter((e): e is VitD => e.type === 'vitd').sort(byT);
  const meals = [...feeds, ...bottles].sort(byT);
  const sessions = buildSessions(meals);
  const sessionOf = new Map<string, Session>();
  for (const s of sessions) for (const m of s.meals) sessionOf.set(m.id, s);

  const openSleep = sleeps.filter((s) => s.end === null).at(-1) ?? null;
  const firstTs = events.length ? Math.min(...events.map(eventTime)) : null;
  const mode = settings.feedMode;

  return {
    now,
    settings,
    night: nightConfig(settings),
    mode,
    useBreast: mode !== 'Flaska',
    useBottle: mode !== 'Amning',
    words: words(mode),
    sleeps,
    openSleep,
    feeds,
    bottles,
    meals,
    vitds,
    sessions,
    sessionOf,
    firstTs,
    dataDays: firstTs === null ? 0 : (now - firstTs) / DAY,
  };
}
