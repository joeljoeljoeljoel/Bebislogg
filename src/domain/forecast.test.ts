import { describe, expect, it } from 'vitest';
import type { LogEvent } from './types';
import { NO_FORECAST_TEXT, fatigue, feedIntervals, forecastText, wakeWindows } from './forecast';
import { buildSessions } from './sessions';
import { getStatus } from './status';
import { at, feed, model, regularDays, sleep, vitd } from './testing';
import { HOUR, MIN } from './time';

describe('wakeWindows', () => {
  it('runs from one wake-up to the next sleep', () => {
    const sleeps = [
      sleep('2026-10-22 09:00', '2026-10-22 10:00'),
      sleep('2026-10-22 11:15', '2026-10-22 12:00'),
      sleep('2026-10-22 11:50', null), // overlapping, ignored as a window
    ];
    expect(wakeWindows(sleeps)).toEqual([{ t: at('2026-10-22 10:00'), len: 75 * MIN }]);
  });
});

describe('feedIntervals', () => {
  it('runs start to start between sessions', () => {
    const sessions = buildSessions([
      feed('2026-10-22 08:00', 'V'),
      feed('2026-10-22 08:20', 'H'),
      feed('2026-10-22 11:00', 'V'),
    ]);
    expect(feedIntervals(sessions)).toEqual([{ t: at('2026-10-22 08:00'), len: 3 * HOUR }]);
  });
});

describe('fatigue', () => {
  it('uses the median daytime wake window while awake in the day', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 10:00'), '2026-10-22 10:00');
    const f = fatigue(m, getStatus(m));
    expect(f?.median).toBe(75 * MIN);
    expect(f?.text).toBe('Brukar bli trött efter ca 1 h 15 min');
    // awake since 09:15
    expect(f?.progress).toBeCloseTo(45 / 75);
  });

  it('uses night wake windows at night', () => {
    // Every night the baby is awake 01:00–01:30.
    const events: LogEvent[] = regularDays('2026-10-18', 4, '2026-10-22 01:20').filter(
      (e) => !(e.type === 'sleep' && new Date(e.start).getHours() === 19),
    );
    for (const d of [18, 19, 20]) {
      events.push(sleep(`2026-10-${d} 19:00`, `2026-10-${d + 1} 01:00`));
      events.push(sleep(`2026-10-${d + 1} 01:30`, `2026-10-${d + 1} 07:00`));
    }
    events.push(sleep('2026-10-21 19:00', '2026-10-22 01:00'));
    const m = model(events, '2026-10-22 01:20');
    const f = fatigue(m, getStatus(m));
    expect(f?.text).toBe('Brukar bli trött efter ca 30 min');
    expect(f?.progress).toBeCloseTo(20 / 30);
  });

  it('is never more than full', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 12:40'), '2026-10-22 12:40');
    // awake since 11:30 → 70 of 75 min
    expect(fatigue(m, getStatus(m))?.progress).toBeCloseTo(70 / 75);
    const late = { ...m, now: at('2026-10-22 14:00') };
    expect(fatigue(late, getStatus(late))?.progress).toBe(1);
  });

  it('is hidden while asleep and before 3 days of data', () => {
    const asleep = model(regularDays('2026-10-18', 5, '2026-10-22 13:00'), '2026-10-22 13:00');
    expect(fatigue(asleep, getStatus(asleep))).toBeNull();
    const young = model(regularDays('2026-10-21', 2, '2026-10-22 10:00'), '2026-10-22 10:00');
    expect(fatigue(young, getStatus(young))).toBeNull();
  });
});

describe('forecastText', () => {
  it('adds the median interval to the last session', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 10:00'), '2026-10-22 10:00');
    expect(forecastText(m)).toBe('Nästa amning troligen runt 13:00');
  });

  it('says "about now" once the time has passed', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 12:59'), '2026-10-22 12:59');
    expect(forecastText(m)).toBe('Brukar vara dags för amning ungefär nu');
  });

  it('uses the wording of the feeding mode', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 10:00'), '2026-10-22 10:00', { feedMode: 'Båda' });
    expect(forecastText(m)).toBe('Nästa matning troligen runt 13:00');
  });

  it('ignores intervals of 6 hours or more', () => {
    // Intervals 3 h, 3 h, 7 h, 7 h, 7 h: the median would be 7 h if the long ones counted.
    const events = [
      vitd('2026-10-15 08:00'),
      feed('2026-10-21 06:00', 'V'),
      feed('2026-10-21 09:00', 'H'),
      feed('2026-10-21 12:00', 'V'),
      feed('2026-10-21 19:00', 'H'),
      feed('2026-10-22 02:00', 'V'),
      feed('2026-10-22 09:00', 'H'),
    ];
    expect(forecastText(model(events, '2026-10-22 10:00'))).toBe('Nästa amning troligen runt 12:00');
  });

  it('waits for 3 days of data', () => {
    const m = model(regularDays('2026-10-21', 2, '2026-10-22 10:00'), '2026-10-22 10:00');
    expect(forecastText(m)).toBe(NO_FORECAST_TEXT);
    expect(forecastText(model([], '2026-10-22 10:00'))).toBe(NO_FORECAST_TEXT);
  });
});
