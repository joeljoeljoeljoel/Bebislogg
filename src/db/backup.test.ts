import { describe, expect, it } from 'vitest';
import { at, feed, settings, sleep } from '../domain/testing';
import { backupFileName, makeBackup, parseBackup } from './backup';

const now = at('2026-10-25 11:35');

describe('backup', () => {
  it('round-trips events and settings', () => {
    const events = [sleep('2026-10-25 09:00', null), feed('2026-10-25 08:00', 'V')];
    const s = settings({ name: 'Ines', feedMode: 'Båda' });
    const text = JSON.stringify(makeBackup(events, s, at('2026-10-24 21:14')));
    const data = parseBackup(text, now);
    expect(data?.events).toEqual(events);
    expect(data?.settings).toEqual({ ...s, setupDone: true, lastBackup: at('2026-10-24 21:14') });
  });

  it('has the documented format and file name', () => {
    const b = makeBackup([], settings(), now);
    expect(b.app).toBe('bebislogg');
    expect(b.version).toBe(1);
    expect(b.exportedAt).toBe(new Date(now).toISOString());
    expect(backupFileName(now)).toBe('bebislogg-2026-10-25.json');
  });

  it('marks the app as set up after a restore', () => {
    const b = makeBackup([], settings({ setupDone: false }), now);
    expect(parseBackup(JSON.stringify(b), now)?.settings.setupDone).toBe(true);
  });

  it('keeps a later lastBackup than the export time', () => {
    const b = makeBackup([], settings({ lastBackup: now }), at('2026-10-20 10:00'));
    expect(parseBackup(JSON.stringify(b), now)?.settings.lastBackup).toBe(now);
  });

  it('drops invalid events but keeps the rest', () => {
    const text = JSON.stringify({
      app: 'bebislogg',
      version: 1,
      events: [{ id: 'a', type: 'vitd', t: 1 }, { id: 'b' }],
    });
    const data = parseBackup(text, now);
    expect(data?.events).toHaveLength(1);
    expect(data?.settings.name).toBe('Bebis');
  });

  it.each([
    ['not JSON', 'hej'],
    ['another app', JSON.stringify({ app: 'annan', events: [] })],
    ['no events', JSON.stringify({ app: 'bebislogg' })],
    ['an array', '[]'],
    ['null', 'null'],
  ])('rejects %s', (_, text) => expect(parseBackup(text, now)).toBeNull());
});
