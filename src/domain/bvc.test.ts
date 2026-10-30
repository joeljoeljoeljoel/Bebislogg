import { describe, expect, it } from 'vitest';
import { bvcSummary, rangeLabel } from './bvc';
import { at, bottle, model, regularDays, sleep, vitd } from './testing';
import { HOUR } from './time';

describe('bvcSummary', () => {
  // Every dygn: night 19–07 (12 h), naps 4.5 h in five naps, a feed every 3 h.
  const events = regularDays('2026-10-10', 13, '2026-10-22 10:00');

  it('covers the last finished dygn, newest first', () => {
    const s = bvcSummary(model(events, '2026-10-22 10:00'), 7);
    expect(s.rows).toHaveLength(7);
    expect(s.rows[0].D).toBe(at('2026-10-21 07:00'));
    expect(s.rows.map((r) => r.label)).toEqual([
      'ons 21 okt',
      'tis 20 okt',
      'mån 19 okt',
      'sön 18 okt',
      'lör 17 okt',
      'fre 16 okt',
      'tor 15 okt',
    ]);
    expect(s.periodLabel).toBe('15–21 okt');
  });

  it('averages per dygn', () => {
    const s = bvcSummary(model(events, '2026-10-22 10:00'), 7);
    expect(s.avg.total).toBe(16.5 * HOUR);
    expect(s.avg.night).toBe(12 * HOUR);
    expect(s.avg.nightLongest).toBe(12 * HOUR);
    expect(s.avg.naps).toBe(5);
    expect(s.avg.sessions).toBe(8);
  });

  it('uses what there is when the period is longer than the data', () => {
    const s = bvcSummary(model(events, '2026-10-22 10:00'), 28);
    expect(s.rows).toHaveLength(12);
    expect(s.periodLabel).toBe('10–21 okt');
  });

  it('includes bottles only when they are in use', () => {
    const withBottles = [...events, bottle('2026-10-20 12:00', 120), bottle('2026-10-21 12:00', 90)];
    expect(bvcSummary(model(withBottles, '2026-10-22 10:00'), 7).showMl).toBe(false);
    const s = bvcSummary(model(withBottles, '2026-10-22 10:00', { feedMode: 'Båda' }), 7);
    expect(s.showMl).toBe(true);
    expect(s.avg.ml).toBe(30);
    expect(s.rows[0].ml).toBe(90);
    expect(s.words.many).toBe('matningar');
  });

  it('counts vitamin D on the day each dygn begins', () => {
    const given = [vitd('2026-10-21 08:30'), vitd('2026-10-20 09:00'), vitd('2026-10-18 08:00')];
    const s = bvcSummary(model([...events, ...given], '2026-10-22 10:00'), 7);
    expect(s.vitd).toEqual({ given: 3, days: 7 });
    expect(s.rows.filter((r) => r.vitd).map((r) => r.label)).toEqual(['ons 21 okt', 'tis 20 okt', 'sön 18 okt']);
  });

  it('leaves nights without sleep out of the longest-sleep average', () => {
    const gap = [sleep('2026-10-20 19:00', '2026-10-21 05:00'), sleep('2026-10-21 09:00', '2026-10-21 10:00')];
    const s = bvcSummary(model(gap, '2026-10-22 10:00'), 7);
    expect(s.rows).toHaveLength(2);
    expect(s.rows[0].nightLongest).toBe(0);
    expect(s.avg.nightLongest).toBe(10 * HOUR);
  });

  it('is empty before the first dygn is finished', () => {
    const s = bvcSummary(model([sleep('2026-10-22 08:00', '2026-10-22 09:00')], '2026-10-22 10:00'), 7);
    expect(s.rows).toEqual([]);
    expect(s.periodLabel).toBe('');
    expect(s.avg.nightLongest).toBeNull();
  });

  it('names the baby and the age', () => {
    const s = bvcSummary(model(events, '2026-10-22 10:00', { name: '  ' }), 7);
    expect(s.name).toBe('Bebis');
    expect(s.age).toBe('6 veckor');
  });
});

describe('rangeLabel', () => {
  it('shortens within a month and spells out across months and years', () => {
    expect(rangeLabel(at('2026-10-16 07:00'), at('2026-10-22 07:00'))).toBe('16–22 okt');
    expect(rangeLabel(at('2026-09-28 07:00'), at('2026-10-04 07:00'))).toBe('28 sep – 4 okt');
    expect(rangeLabel(at('2026-12-29 07:00'), at('2027-01-04 07:00'))).toBe('29 dec 2026 – 4 jan 2027');
    expect(rangeLabel(at('2026-10-22 07:00'), at('2026-10-22 07:00'))).toBe('22 okt');
  });
});
