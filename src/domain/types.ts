// All timestamps are epoch milliseconds; durations are derived from them so
// that DST transitions come out right.

export type Side = 'V' | 'H';

export interface Sleep {
  id: string;
  type: 'sleep';
  start: number;
  /** null while the baby is asleep */
  end: number | null;
}

/** Breastfeeding. Only the start is logged, never an end. */
export interface Feed {
  id: string;
  type: 'feed';
  t: number;
  side: Side;
}

export interface Bottle {
  id: string;
  type: 'bottle';
  t: number;
  ml: number;
}

export interface VitD {
  id: string;
  type: 'vitd';
  t: number;
}

export type LogEvent = Sleep | Feed | Bottle | VitD;
export type Meal = Feed | Bottle;

export type FeedMode = 'Amning' | 'Flaska' | 'Båda';
export type ThemeSetting = 'Auto' | 'Ljust' | 'Mörkt';

export interface Settings {
  name: string;
  /** YYYY-MM-DD */
  birth: string;
  /** HH:MM, default 19:00 */
  nightStart: string;
  /** HH:MM, default 07:00. Also where each dygn starts. */
  nightEnd: string;
  /** Auto = dark during the night period */
  theme: ThemeSetting;
  feedMode: FeedMode;
  /** Show the vitamin D row on Nu */
  vitD: boolean;
  /** false → show the intro */
  setupDone: boolean;
  lastBackup: number | null;
}
