import { describe, expect, it } from 'vitest';
import { feed, model, vitd } from './testing';
import { vitdDays, vitdRow, vitdSummary } from './vitd';

const now = '2026-10-25 11:35';
// Missed Thursday 22 Oct.
const week = [
  vitd('2026-10-19 08:00'),
  vitd('2026-10-20 08:00'),
  vitd('2026-10-21 08:00'),
  vitd('2026-10-23 09:00'),
  vitd('2026-10-24 08:30'),
];
const today = vitd('2026-10-25 08:15');

describe('vitdRow', () => {
  it('shows when they were given today', () => {
    const row = vitdRow(model([...week, today], now));
    expect(row.title).toBe('D-droppar givna');
    expect(row.sub).toBe('Idag 08:15 · 6 av 7 dagar');
    expect(row.week.map((d) => !!d.given)).toEqual([true, true, true, false, true, true, true]);
  });

  it('asks for them when not given today', () => {
    const row = vitdRow(model(week, now));
    expect(row.title).toBe('D-droppar');
    expect(row.sub).toBe('Inte givna idag, tryck när de är givna · 5 av 7 dagar');
  });
});

describe('vitdSummary', () => {
  it('lists missed days, never today', () => {
    expect(vitdSummary(model([...week, today], now), 7).text).toBe('Givna 6 av 7 dagar · missade tor');
    expect(vitdSummary(model(week, now), 7).text).toBe('Givna 5 av 7 dagar · missade tor · inte givna idag');
  });

  it('only counts days since logging began', () => {
    const s = vitdSummary(model([vitd('2026-10-24 08:00'), today], now), 7);
    expect(s.days).toHaveLength(2);
    expect(s.text).toBe('Givna 2 av 2 dagar');
  });

  it('does not list 4 or more missed days', () => {
    const s = vitdSummary(model([feed('2026-10-19 08:00', 'V'), today], now), 7);
    expect(s.text).toBe('Givna 1 av 7 dagar');
  });

  it('covers 4 weeks', () => {
    const s = vitdSummary(model([feed('2026-09-01 08:00', 'V'), ...week, today], now), 28);
    expect(s.days).toHaveLength(28);
    expect(s.text).toBe('Givna 6 av 28 dagar');
  });
});

describe('calendar days', () => {
  it('counts per calendar day across the DST change', () => {
    const m = model([vitd('2026-10-25 00:30'), vitd('2026-10-24 23:30')], '2026-10-25 23:50');
    const days = vitdDays(m, 7);
    expect(days.every((d) => new Date(d.D).getHours() === 0)).toBe(true);
    expect(days.slice(-2).map((d) => !!d.given)).toEqual([true, true]);
  });
});
