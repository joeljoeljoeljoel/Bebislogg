import { useEffect, useLayoutEffect } from 'react';
import type { Settings } from '../domain/types';
import { type ThemeName, resolveTheme } from '../domain/settings';

/** Read synchronously by the inline script in index.html, so the first paint has the right theme. */
export const THEME_MIRROR_KEY = 'bebislogg-theme';

const BG: Record<ThemeName, string> = { dark: '#161826', light: '#f6f1ea' };

export function applyTheme(name: ThemeName) {
  document.documentElement.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[name]);
}

export function mirrorThemeSettings(s: Pick<Settings, 'theme' | 'nightStart' | 'nightEnd'>) {
  try {
    localStorage.setItem(
      THEME_MIRROR_KEY,
      JSON.stringify({ theme: s.theme, nightStart: s.nightStart, nightEnd: s.nightEnd }),
    );
  } catch {
    // Without storage the next start falls back to the default night period.
  }
}

/** Applies the theme for the current time and keeps the mirror up to date. */
export function useThemeSync(settings: Settings, now: number) {
  const name = resolveTheme(settings, now);
  useLayoutEffect(() => applyTheme(name), [name]);
  const { theme, nightStart, nightEnd } = settings;
  useEffect(() => mirrorThemeSettings({ theme, nightStart, nightEnd }), [theme, nightStart, nightEnd]);
}
