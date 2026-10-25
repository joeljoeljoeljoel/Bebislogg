import { describe, expect, it } from 'vitest';
import { allDygn, completeDays, dayStats } from './stats';
import { at, bottle, feed, model, sleep } from './testing';
import { HOUR, MIN } from './time';

describe('dayStats', () => {
  const events = [
    sleep('2026-10-22 09:00', '2026-10-22 10:00'),
    sleep('2026-10-22 13:00', '2026-10-22 14:30'),
    sleep('2026-10-22 19:30', '2026-10-22 23:30'),
    sleep('2026-10-23 00:00', '2026-10-23 04:00'),
    sleep('2026-10-23 04:30', '2026-10-23 07:30'), // 30 min spill into the next dygn
    feed('2026-10-22 08:00', 'V'),
    feed('2026-10-22 08:20', 'H'),
    bottle('2026-10-22 11:00', 90),
    feed('2026-10-22 14:40', 'V'),
    feed('2026-10-22 18:00', 'H'),
    feed('2026-10-22 23:35', 'V'),
    bottle('2026-10-22 23:50', 60),
    feed('2026-10-23 07:40', 'H'),
  ];

  it('sums sleep, night sleep, naps and the longest sleeps', () => {
    const s = dayStats(model(events, '2026-10-23 12:00'), at('2026-10-22 07:00'));
    expect(s.E).toBe(at('2026-10-23 07:00'));
    expect(s.total).toBe(13 * HOUR);
    expect(s.night).toBe(10 * HOUR + 30 * MIN);
    expect(s.day).toBe(2 * HOUR + 30 * MIN);
    expect(s.naps).toBe(2);
    expect(s.longest).toBe(4 * HOUR);
    expect(s.nightLongest).toBe(4 * HOUR);
    expect(s.partial).toBe(false);
  });

  it('counts feeding sessions, bottles and the longest interval', () => {
    const s = dayStats(model(events, '2026-10-23 12:00'), at('2026-10-22 07:00'));
    expect(s.sessions).toBe(5);
    expect(s.bottleSessions).toBe(2);
    expect(s.ml).toBe(150);
    // 23:35 → 07:40 the next morning
    expect(s.longestInterval).toBe(8 * HOUR + 5 * MIN);
  });

  it('counts an ongoing sleep up to now', () => {
    const ongoing = [...events, sleep('2026-10-23 08:30', null)];
    const s = dayStats(model(ongoing, '2026-10-23 09:00'), at('2026-10-23 07:00'));
    expect(s.total).toBe(60 * MIN);
    expect(s.partial).toBe(true);
  });

  it('gets 13 hours of night sleep on the night DST ends', () => {
    const m = model([sleep('2026-10-24 19:00', '2026-10-25 07:00')], '2026-10-25 12:00');
    const s = dayStats(m, at('2026-10-24 07:00'));
    expect(s.total).toBe(13 * HOUR);
    expect(s.night).toBe(13 * HOUR);
    expect(s.day).toBe(0);
    expect(s.nightLongest).toBe(13 * HOUR);
  });
});

describe('dygn lists', () => {
  it('lists all dygn with data and the complete ones', () => {
    const m = model([feed('2026-10-22 10:00', 'V')], '2026-10-24 12:00');
    expect(allDygn(m)).toEqual([at('2026-10-24 07:00'), at('2026-10-23 07:00'), at('2026-10-22 07:00')]);
    expect(completeDays(m).map((s) => s.D)).toEqual([at('2026-10-23 07:00'), at('2026-10-22 07:00')]);
  });

  it('is empty without data', () => {
    expect(allDygn(model([], '2026-10-24 12:00'))).toEqual([]);
  });
});
