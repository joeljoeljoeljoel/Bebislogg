import { describe, expect, it } from 'vitest';
import { settings } from '../domain/testing';
import { toEvent, toEvents, toSettings } from './validate';

describe('toEvent', () => {
  it('accepts every event type and drops unknown fields', () => {
    expect(toEvent({ id: 'a', type: 'sleep', start: 1, end: null, extra: 1 })).toEqual({
      id: 'a',
      type: 'sleep',
      start: 1,
      end: null,
    });
    expect(toEvent({ id: 'b', type: 'sleep', start: 1, end: 5 })).not.toBeNull();
    expect(toEvent({ id: 'c', type: 'feed', t: 1, side: 'H' })).not.toBeNull();
    expect(toEvent({ id: 'd', type: 'bottle', t: 1, ml: 120 })).not.toBeNull();
    expect(toEvent({ id: 'e', type: 'vitd', t: 1 })).not.toBeNull();
  });

  it.each([
    ['not an object', 'x'],
    ['missing id', { type: 'vitd', t: 1 }],
    ['empty id', { id: '', type: 'vitd', t: 1 }],
    ['unknown type', { id: 'a', type: 'diaper', t: 1 }],
    ['sleep ending before it starts', { id: 'a', type: 'sleep', start: 5, end: 1 }],
    ['sleep without end field', { id: 'a', type: 'sleep', start: 5 }],
    ['feed with unknown side', { id: 'a', type: 'feed', t: 1, side: 'L' }],
    ['bottle with negative ml', { id: 'a', type: 'bottle', t: 1, ml: -10 }],
    ['time as string', { id: 'a', type: 'vitd', t: '2026-10-22' }],
    ['NaN time', { id: 'a', type: 'vitd', t: NaN }],
  ])('rejects %s', (_, value) => expect(toEvent(value)).toBeNull());
});

describe('toEvents', () => {
  it('keeps valid events and the first of duplicate ids', () => {
    const list = [
      { id: 'a', type: 'vitd', t: 1 },
      { id: 'a', type: 'vitd', t: 2 },
      { id: 'b', type: 'feed', t: 3 },
      { id: 'c', type: 'feed', t: 3, side: 'V' },
    ];
    expect(toEvents(list).map((e) => e.id)).toEqual(['a', 'c']);
  });
});

describe('toSettings', () => {
  const fallback = settings();

  it('keeps valid values', () => {
    const s = settings({ name: 'Ines', nightStart: '20:30', theme: 'Mörkt', feedMode: 'Flaska', lastBackup: 5 });
    expect(toSettings(JSON.parse(JSON.stringify(s)), fallback)).toEqual(s);
  });

  it('falls back field by field', () => {
    const s = toSettings({ name: 'Ines', birth: '2026-13-01', nightStart: '7pm', theme: 'Blå', vitD: 'ja' }, fallback);
    expect(s.name).toBe('Ines');
    expect(s.birth).toBe(fallback.birth);
    expect(s.nightStart).toBe(fallback.nightStart);
    expect(s.theme).toBe(fallback.theme);
    expect(s.vitD).toBe(fallback.vitD);
  });

  it('uses the fallback for missing settings', () => {
    expect(toSettings(null, fallback)).toBe(fallback);
  });
});
