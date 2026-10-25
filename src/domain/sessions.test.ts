import { describe, expect, it } from 'vitest';
import type { Meal } from './types';
import { buildSessions } from './sessions';
import { at, bottle, feed, model } from './testing';

const shape = (meals: Meal[]) => buildSessions(meals).map((s) => s.meals.length);

describe('buildSessions', () => {
  it('joins the other breast within 30 min', () => {
    expect(shape([feed('2026-10-22 14:00', 'V'), feed('2026-10-22 14:20', 'H')])).toEqual([2]);
  });

  it('joins breast and bottle within 30 min', () => {
    expect(shape([feed('2026-10-22 15:00', 'H'), bottle('2026-10-22 15:15', 90)])).toEqual([2]);
    expect(shape([bottle('2026-10-22 15:00', 60), bottle('2026-10-22 15:20', 30)])).toEqual([2]);
  });

  it('never merges two feeds on the same breast', () => {
    expect(shape([feed('2026-10-22 14:00', 'V'), feed('2026-10-22 14:10', 'V')])).toEqual([1, 1]);
    // Not even with another meal in between.
    expect(
      shape([feed('2026-10-22 14:00', 'V'), feed('2026-10-22 14:15', 'H'), feed('2026-10-22 14:30', 'V')]),
    ).toEqual([2, 1]);
  });

  it('allows exactly 30 min but not more', () => {
    expect(shape([feed('2026-10-22 14:00', 'V'), feed('2026-10-22 14:30', 'H')])).toEqual([2]);
    expect(shape([feed('2026-10-22 14:00', 'V'), feed('2026-10-22 14:31', 'H')])).toEqual([1, 1]);
  });

  it('measures the gap from the latest meal in the session', () => {
    const meals = [feed('2026-10-22 14:00', 'V'), bottle('2026-10-22 14:25', 60), feed('2026-10-22 14:50', 'H')];
    const [s] = buildSessions(meals);
    expect(s.meals).toHaveLength(3);
    expect(s.t).toBe(at('2026-10-22 14:00'));
    expect(s.end).toBe(at('2026-10-22 14:50'));
  });

  it('is built by the model from unsorted events', () => {
    const v = feed('2026-10-22 14:00', 'V');
    const h = feed('2026-10-22 14:20', 'H');
    const m = model([h, v], '2026-10-22 15:00');
    expect(m.sessions).toHaveLength(1);
    expect(m.sessionOf.get(h.id)).toBe(m.sessions[0]);
    expect(m.sessionOf.get(v.id)?.t).toBe(v.t);
  });
});
