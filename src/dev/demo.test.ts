import { describe, expect, it } from 'vitest';
import { at } from '../domain/testing';
import { toEvents } from '../db/validate';
import { demoEvents, demoSettings } from './demo';

describe('demo data', () => {
  const now = at('2026-10-25 11:35');
  const events = demoEvents(now, 24, demoSettings(now));

  it('is valid and in the past', () => {
    expect(events.length).toBeGreaterThan(300);
    expect(toEvents(events)).toHaveLength(events.length);
    for (const e of events) expect(e.type === 'sleep' ? e.start : e.t).toBeLessThanOrEqual(now);
  });

  it('has no overlapping sleeps and at most one open', () => {
    const sleeps = events.flatMap((e) => (e.type === 'sleep' ? [e] : [])).sort((a, b) => a.start - b.start);
    for (let i = 1; i < sleeps.length; i++) expect(sleeps[i].start).toBeGreaterThanOrEqual(sleeps[i - 1].end!);
    expect(sleeps.filter((s) => s.end === null).length).toBeLessThanOrEqual(1);
  });
});
