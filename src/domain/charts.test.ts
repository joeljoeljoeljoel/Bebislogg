import { describe, expect, it } from 'vitest';
import {
  balanceWeeks,
  clockDays,
  feedIntervalsIn,
  hasChartData,
  periodDays,
  sleepMapRows,
  wakeWindowsIn,
  weekRows,
} from './charts';
import { at, bottle, feed, model, regularDays, sleep, vitd } from './testing';
import { HOUR, MIN } from './time';

describe('chart data', () => {
  it('waits for half a day of data', () => {
    expect(hasChartData(model([], '2026-10-22 12:00'))).toBe(false);
    expect(hasChartData(model([feed('2026-10-22 08:00', 'V')], '2026-10-22 12:00'))).toBe(false);
    expect(hasChartData(model([feed('2026-10-21 23:00', 'V')], '2026-10-22 12:00'))).toBe(true);
  });

  it('gives the period oldest first', () => {
    const m = model(regularDays('2026-10-01', 22, '2026-10-22 10:00'), '2026-10-22 10:00');
    const days = periodDays(m, 7);
    expect(days).toHaveLength(7);
    expect(days[0].D).toBe(at('2026-10-16 07:00'));
    expect(days[6].D).toBe(at('2026-10-22 07:00'));
    expect(days[6].partial).toBe(true);
    expect(periodDays(m, 28)).toHaveLength(22);
  });

  it('steps the clock back through finished dygn only', () => {
    const m = model(regularDays('2026-10-01', 22, '2026-10-22 10:00'), '2026-10-22 10:00');
    const days = clockDays(m, 7);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(at('2026-10-21 07:00'));
    expect(days[6]).toBe(at('2026-10-15 07:00'));
    expect(clockDays(m, 28)).toHaveLength(21);
    // Before 07:00 the dygn that began yesterday is still going.
    expect(clockDays(model(regularDays('2026-10-20', 2, '2026-10-22 06:00'), '2026-10-22 06:00'), 7)).toEqual([
      at('2026-10-20 07:00'),
    ]);
  });
});

describe('sleepMapRows', () => {
  it('runs 18–18, newest first, with weekday labels', () => {
    const m = model(regularDays('2026-10-18', 5, '2026-10-22 10:00'), '2026-10-22 10:00');
    const rows = sleepMapRows(m, 7);
    expect(rows).toHaveLength(5);
    expect(rows[0].start).toBe(at('2026-10-21 18:00'));
    expect(rows[0].end).toBe(at('2026-10-22 18:00'));
    expect(rows.map((r) => r.label)).toEqual(['tor', 'ons', 'tis', 'mån', 'sön']);
    expect(rows[0].night).toEqual([at('2026-10-21 19:00'), at('2026-10-22 07:00')]);
    // The night sleep 19–07 lies inside one row.
    expect(rows[0].sleeps[0]).toEqual([at('2026-10-21 19:00'), at('2026-10-22 07:00')]);
  });

  it('labels every 7th row with a date over 4 weeks', () => {
    const m = model(regularDays('2026-10-01', 22, '2026-10-22 10:00'), '2026-10-22 10:00');
    const labels = sleepMapRows(m, 28).map((r) => r.label);
    expect(labels).toHaveLength(22);
    expect(labels[0]).toBe('22 okt');
    expect(labels[7]).toBe('15 okt');
    expect(labels[1]).toBeNull();
  });

  it('shades a 13 h night on the night DST ends', () => {
    const m = model([sleep('2026-10-24 19:00', '2026-10-25 07:00')], '2026-10-25 12:00');
    const [row] = sleepMapRows(m, 7);
    expect(row.end - row.start).toBe(25 * HOUR);
    expect(row.night[1] - row.night[0]).toBe(13 * HOUR);
  });
});

describe('intervals in the period', () => {
  it('keeps the period and leaves out intervals of 6 h or more', () => {
    const events = [
      vitd('2026-10-01 08:00'),
      feed('2026-10-10 08:00', 'V'),
      feed('2026-10-21 08:00', 'V'),
      feed('2026-10-21 11:00', 'H'),
      feed('2026-10-21 18:00', 'V'),
      sleep('2026-10-21 12:00', '2026-10-21 13:00'),
      sleep('2026-10-21 14:15', '2026-10-21 15:00'),
    ];
    const m = model(events, '2026-10-22 10:00');
    expect(feedIntervalsIn(m, 7)).toEqual([{ t: at('2026-10-21 08:00'), len: 3 * HOUR }]);
    expect(wakeWindowsIn(m, 7)).toEqual([{ t: at('2026-10-21 13:00'), len: 75 * MIN }]);
  });
});

describe('balanceWeeks', () => {
  it('counts sides per week back from now', () => {
    const events = [
      feed('2026-10-20 08:00', 'V'),
      feed('2026-10-21 08:00', 'H'),
      feed('2026-10-21 11:00', 'H'),
      feed('2026-10-12 08:00', 'V'),
    ];
    expect(balanceWeeks(model(events, '2026-10-22 10:00'), 7)).toEqual([
      { label: 'Senaste 7 d', V: 1, H: 2 },
      { label: 'Veckan innan', V: 1, H: 0 },
    ]);
  });

  it('stops before logging began', () => {
    expect(balanceWeeks(model([feed('2026-10-20 08:00', 'V')], '2026-10-22 10:00'), 28)).toHaveLength(1);
  });
});

describe('weekRows', () => {
  it('labels Idag, Igår and weekdays', () => {
    const events = [...regularDays('2026-10-15', 8, '2026-10-22 10:00'), bottle('2026-10-21 09:00', 90)];
    const rows = weekRows(model(events, '2026-10-22 10:00'));
    expect(rows.map((r) => r.label)).toEqual(['Idag', 'Igår', 'tis', 'mån', 'sön', 'lör', 'fre']);
    expect(rows[1].ml).toBe(90);
    expect(rows[1].total).toBe(12 * HOUR + 4.5 * HOUR);
  });
});
