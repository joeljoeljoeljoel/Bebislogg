import { describe, expect, it } from 'vitest';
import { at } from './testing';
import { HOUR, MIN, addDays, ageText, calLabel, dur, hm, hmm, median, round5 } from './time';

describe('test environment', () => {
  it('runs in Swedish time', () => {
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(-120);
    expect(new Date(2026, 11, 1).getTimezoneOffset()).toBe(-60);
  });
});

describe('dur', () => {
  it.each([
    [0, '0 min'],
    [45 * MIN, '45 min'],
    [60 * MIN, '1 h 00 min'],
    [72 * MIN, '1 h 12 min'],
    [14 * HOUR + 5 * MIN, '14 h 05 min'],
    [-5 * MIN, '0 min'],
    [29_999, '0 min'],
    [30_000, '1 min'],
  ])('%i ms → %s', (ms, text) => expect(dur(ms)).toBe(text));
});

describe('formatting', () => {
  it('formats clock time with 24-hour clock', () => {
    expect(hm(at('2026-10-22 08:05'))).toBe('08:05');
    expect(hm(at('2026-10-22 23:59'))).toBe('23:59');
  });

  it('formats table durations', () => {
    expect(hmm(65 * MIN)).toBe('1:05');
    expect(hmm(0)).toBe('0:00');
    expect(hmm(14 * HOUR)).toBe('14:00');
  });

  it('rounds to 5 minutes', () => {
    expect(round5(72 * MIN)).toBe(70 * MIN);
    expect(round5(73 * MIN)).toBe(75 * MIN);
  });

  it('computes medians', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });
});

describe('calLabel', () => {
  const now = at('2026-10-25 11:35');
  it.each([
    ['2026-10-25 00:10', 'Idag'],
    ['2026-10-24 23:00', 'Igår'],
    ['2026-10-26 01:00', 'Imorgon'],
    ['2026-10-22 10:00', 'tor 22 okt'],
  ])('%s → %s', (ts, label) => expect(calLabel(at(ts), now)).toBe(label));

  it('counts calendar days, not 24-hour periods, across DST', () => {
    expect(calLabel(at('2026-10-24 00:30'), at('2026-10-25 23:30'))).toBe('Igår');
  });
});

describe('ageText', () => {
  it.each([
    ['2026-10-24 12:00', '6 veckor och 2 dagar'],
    ['2026-09-17 12:00', '1 vecka'],
    ['2026-09-18 12:00', '1 vecka och 1 dag'],
    ['2026-09-24 12:00', '2 veckor'],
    ['2026-09-13 12:00', '3 dagar'],
    ['2026-09-11 12:00', '1 dag'],
    ['2026-09-10 12:00', '0 dagar'],
    ['2026-09-09 12:00', ''],
  ])('born 2026-09-10, at %s → "%s"', (now, text) => expect(ageText('2026-09-10', at(now))).toBe(text));

  it('counts calendar days right after DST starts', () => {
    // Only 47.5 real hours have passed, but it is the second day after birth.
    expect(ageText('2026-03-28', at('2026-03-30 00:30'))).toBe('2 dagar');
  });
});

describe('addDays', () => {
  it('keeps the wall-clock time across DST', () => {
    const fall = at('2026-10-24 07:00');
    expect(addDays(fall, 1) - fall).toBe(25 * HOUR);
    expect(hm(addDays(fall, 1))).toBe('07:00');
    const spring = at('2026-03-28 07:00');
    expect(addDays(spring, 1) - spring).toBe(23 * HOUR);
  });
});
