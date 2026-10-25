import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { bottle, feed, settings, sleep } from '../domain/testing';
import { loadData, replaceAll, saveSettings, syncEvents } from './db';

const byId = (list: unknown[]) =>
  [...(list as { id: string }[])].sort((a, b) => a.id.localeCompare(b.id));

describe('db', () => {
  beforeEach(() => replaceAll([], settings()));

  it('starts empty', async () => {
    await replaceAll([], settings());
    const { events } = await loadData();
    expect(events).toEqual([]);
  });

  it('saves and loads settings', async () => {
    const s = settings({ name: 'Ines', theme: 'Mörkt' });
    await saveSettings(s);
    expect((await loadData()).settings).toEqual(s);
  });

  it('writes added, changed and removed events', async () => {
    const a = feed('2026-10-22 08:00', 'V');
    const b = sleep('2026-10-22 09:00', null);
    const c = bottle('2026-10-22 11:00', 90);
    await syncEvents([], [a, b, c]);
    expect(byId((await loadData()).events)).toEqual(byId([a, b, c]));

    const b2 = { ...b, end: b.start + 60_000 };
    await syncEvents([a, b, c], [a, b2]);
    expect(byId((await loadData()).events)).toEqual(byId([a, b2]));
  });

  it('adds to what is already stored', async () => {
    const a = feed('2026-10-22 08:00', 'V');
    await syncEvents([], [a]);
    const b = feed('2026-10-22 11:00', 'H');
    await syncEvents([a], [a, b]);
    expect(byId((await loadData()).events)).toEqual(byId([a, b]));
  });

  it('replaces everything', async () => {
    await syncEvents([], [feed('2026-10-22 08:00', 'V')]);
    const s = settings({ name: 'Ny' });
    const v = feed('2026-10-23 08:00', 'H');
    await replaceAll([v], s);
    const data = await loadData();
    expect(data.events).toEqual([v]);
    expect(data.settings).toEqual(s);
  });
});
