import { describe, expect, it } from 'vitest';
import { dygnLabel, dygnList, dygnStart, isNight, nightConfig, nightWindow } from './days';
import { at } from './testing';
import { HOUR, hm } from './time';

const night = nightConfig({ nightStart: '19:00', nightEnd: '07:00' });

describe('isNight', () => {
  it.each([
    ['2026-10-22 19:00', true],
    ['2026-10-22 18:59', false],
    ['2026-10-22 03:10', true],
    ['2026-10-22 06:59', true],
    ['2026-10-22 07:00', false],
    ['2026-10-22 12:00', false],
  ])('%s → %s', (ts, expected) => expect(isNight(at(ts), night)).toBe(expected));

  it('handles a night period that does not cross midnight', () => {
    const early = nightConfig({ nightStart: '00:00', nightEnd: '06:00' });
    expect(isNight(at('2026-10-22 03:00'), early)).toBe(true);
    expect(isNight(at('2026-10-22 23:00'), early)).toBe(false);
  });

  it('treats both 02:30s on the night DST ends as night', () => {
    const first = at('2026-10-25 02:30');
    const second = first + HOUR;
    expect(hm(first)).toBe('02:30');
    expect(hm(second)).toBe('02:30');
    expect(isNight(first, night)).toBe(true);
    expect(isNight(second, night)).toBe(true);
  });
});

describe('dygn', () => {
  it('starts at nightEnd', () => {
    expect(dygnStart(at('2026-10-25 06:59'), night)).toBe(at('2026-10-24 07:00'));
    expect(dygnStart(at('2026-10-25 07:00'), night)).toBe(at('2026-10-25 07:00'));
    expect(dygnStart(at('2026-10-25 03:10'), night)).toBe(at('2026-10-24 07:00'));
  });

  it('has a 12 h night window on a normal night', () => {
    const [s, e] = nightWindow(at('2026-10-22 07:00'), night);
    expect(s).toBe(at('2026-10-22 19:00'));
    expect(e).toBe(at('2026-10-23 07:00'));
    expect(e - s).toBe(12 * HOUR);
  });

  it('has a 13 h night window when DST ends (25 Oct 2026)', () => {
    const [s, e] = nightWindow(at('2026-10-24 07:00'), night);
    expect(s).toBe(at('2026-10-24 19:00'));
    expect(e).toBe(at('2026-10-25 07:00'));
    expect(e - s).toBe(13 * HOUR);
  });

  it('has an 11 h night window when DST starts', () => {
    const [s, e] = nightWindow(at('2026-03-28 07:00'), night);
    expect(e - s).toBe(11 * HOUR);
  });

  it('lists dygn newest first', () => {
    const list = dygnList(at('2026-10-22 10:00'), at('2026-10-25 06:00'), night);
    expect(list).toEqual([at('2026-10-24 07:00'), at('2026-10-23 07:00'), at('2026-10-22 07:00')]);
  });

  it('labels dygn', () => {
    const now = at('2026-10-25 11:35');
    expect(dygnLabel(at('2026-10-25 07:00'), now, night)).toBe('Idag');
    expect(dygnLabel(at('2026-10-24 07:00'), now, night)).toBe('Igår');
    expect(dygnLabel(at('2026-10-22 07:00'), now, night)).toBe('tor 22 okt');
    // In the small hours the dygn that began yesterday morning is still "Idag".
    expect(dygnLabel(at('2026-10-24 07:00'), at('2026-10-25 03:10'), night)).toBe('Idag');
  });
});
