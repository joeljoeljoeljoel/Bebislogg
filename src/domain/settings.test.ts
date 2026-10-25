import { describe, expect, it } from 'vitest';
import { resolveTheme } from './settings';
import { at, settings } from './testing';

describe('resolveTheme', () => {
  it('follows the night period on Auto', () => {
    const s = settings({ theme: 'Auto' });
    expect(resolveTheme(s, at('2026-10-25 03:10'))).toBe('dark');
    expect(resolveTheme(s, at('2026-10-25 11:35'))).toBe('light');
    expect(resolveTheme(s, at('2026-10-25 19:00'))).toBe('dark');
    expect(resolveTheme(s, at('2026-10-25 07:00'))).toBe('light');
  });

  it('can be fixed to light or dark', () => {
    expect(resolveTheme(settings({ theme: 'Ljust' }), at('2026-10-25 03:10'))).toBe('light');
    expect(resolveTheme(settings({ theme: 'Mörkt' }), at('2026-10-25 12:00'))).toBe('dark');
  });

  it('uses the configured night period', () => {
    const s = settings({ theme: 'Auto', nightStart: '20:30', nightEnd: '06:00' });
    expect(resolveTheme(s, at('2026-10-25 20:00'))).toBe('light');
    expect(resolveTheme(s, at('2026-10-25 06:30'))).toBe('light');
    expect(resolveTheme(s, at('2026-10-25 05:59'))).toBe('dark');
  });
});
