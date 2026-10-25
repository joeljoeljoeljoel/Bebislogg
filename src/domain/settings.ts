import type { Settings } from './types';
import { isNight, nightConfig } from './days';
import { dateStr } from './time';

export function defaultSettings(now: number): Settings {
  return {
    name: '',
    birth: dateStr(now),
    nightStart: '19:00',
    nightEnd: '07:00',
    theme: 'Auto',
    feedMode: 'Amning',
    vitD: true,
    setupDone: false,
    lastBackup: null,
  };
}

export type ThemeName = 'light' | 'dark';

/** Auto is dark during the night period and light otherwise. */
export function resolveTheme(s: Settings, now: number): ThemeName {
  if (s.theme === 'Ljust') return 'light';
  if (s.theme === 'Mörkt') return 'dark';
  return isNight(now, nightConfig(s)) ? 'dark' : 'light';
}
