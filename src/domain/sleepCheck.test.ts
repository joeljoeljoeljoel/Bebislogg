import { describe, expect, it } from 'vitest';
import { checkSleep } from './sleepCheck';
import { at, sleep } from './testing';

const now = at('2026-10-22 18:00');
const existing = sleep('2026-10-22 13:10', '2026-10-22 14:00');

describe('checkSleep', () => {
  it('requires waking after falling asleep', () => {
    const w = checkSleep({ start: at('2026-10-22 15:00'), end: at('2026-10-22 15:00') }, [], now);
    expect(w).toEqual({ kind: 'order', text: 'Vaknade behöver vara efter Somnade.', fix: null });
  });

  it('accepts a sleep that does not overlap', () => {
    expect(checkSleep({ start: at('2026-10-22 15:00'), end: at('2026-10-22 16:00') }, [existing], now)).toBeNull();
    // Touching end to start is fine.
    expect(checkSleep({ start: at('2026-10-22 14:00'), end: at('2026-10-22 15:00') }, [existing], now)).toBeNull();
  });

  it('suggests moving Somnade when it starts inside another sleep', () => {
    const w = checkSleep({ start: at('2026-10-22 13:30'), end: at('2026-10-22 15:00') }, [existing], now);
    expect(w?.text).toBe('Överlappar sömnen 13:10–14:00.');
    expect(w?.fix).toEqual({ label: 'Flytta Somnade till 14:00', patch: { start: at('2026-10-22 14:00') } });
  });

  it('suggests moving Vaknade when it ends inside another sleep', () => {
    const w = checkSleep({ start: at('2026-10-22 12:00'), end: at('2026-10-22 13:30') }, [existing], now);
    expect(w?.fix).toEqual({ label: 'Flytta Vaknade till 13:10', patch: { end: at('2026-10-22 13:10') } });
  });

  it('ignores the sleep being edited', () => {
    const w = checkSleep({ id: existing.id, start: at('2026-10-22 13:00'), end: at('2026-10-22 14:10') }, [existing], now);
    expect(w).toBeNull();
  });

  it('says "nu" for an ongoing sleep', () => {
    const open = sleep('2026-10-22 17:00', null);
    const w = checkSleep({ start: at('2026-10-22 16:30'), end: at('2026-10-22 17:30') }, [open], now);
    expect(w?.text).toBe('Överlappar sömnen 17:00–nu.');
    expect(w?.fix?.label).toBe('Flytta Vaknade till 17:00');
  });

  it('has no fix for an ongoing draft that started earlier', () => {
    const w = checkSleep({ start: at('2026-10-22 12:00'), end: null }, [existing], now);
    expect(w).toEqual({ kind: 'overlap', text: 'Överlappar sömnen 13:10–14:00.', fix: null });
  });
});
