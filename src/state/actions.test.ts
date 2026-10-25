import { describe, expect, it } from 'vitest';
import type { Bottle, Feed, LogEvent, Sleep } from '../domain/types';
import { at, bottle, feed, sleep } from '../domain/testing';
import { MIN } from '../domain/time';
import {
  changeMl,
  describeEvent,
  logBottle,
  logFeed,
  logVitd,
  shiftTargets,
  switchSide,
  toggleSleep,
  undoMessage,
  undoWake,
} from './actions';

const byId = <T extends LogEvent>(events: LogEvent[], id: string) => events.find((e) => e.id === id) as T;

describe('toggleSleep', () => {
  it('starts a sleep when awake', () => {
    const r = toggleSleep([], at('2026-10-22 14:32'), 'n');
    expect(r.events).toEqual([{ id: 'n', type: 'sleep', start: at('2026-10-22 14:32'), end: null }]);
    expect(undoMessage(r.events, r.undo)).toBe('Somnade 14:32');
    expect(r.undo.prev).toEqual([]);
  });

  it('ends the open sleep, at least 1 min after it started', () => {
    const s = sleep('2026-10-22 14:32', null);
    const r = toggleSleep([s], at('2026-10-22 15:40'), 'n');
    expect(byId<Sleep>(r.events, s.id).end).toBe(at('2026-10-22 15:40'));
    expect(undoMessage(r.events, r.undo)).toBe('Vaknade 15:40');
    const quick = toggleSleep([s], s.start + 10_000, 'n');
    expect(byId<Sleep>(quick.events, s.id).end).toBe(s.start + MIN);
  });
});

describe('logFeed', () => {
  it('logs a feed while awake', () => {
    const r = logFeed([], 'V', at('2026-10-22 14:00'), 'n');
    expect(r.events).toEqual([{ id: 'n', type: 'feed', t: at('2026-10-22 14:00'), side: 'V' }]);
    expect(r.undo.feedId).toBe('n');
    expect(r.undo.wakeId).toBeUndefined();
    expect(undoMessage(r.events, r.undo)).toBe('Amning vänster 14:00');
  });

  it('notes when it joins a session', () => {
    const r = logFeed([feed('2026-10-22 14:00', 'V')], 'H', at('2026-10-22 14:20'), 'n');
    expect(undoMessage(r.events, r.undo)).toBe('Amning höger 14:20 · samma tillfälle som 14:00');
  });

  it('ends a sleep at the same time (night feed)', () => {
    const s = sleep('2026-10-22 23:40', null);
    const r = logFeed([feed('2026-10-22 23:30', 'V'), s], 'H', at('2026-10-23 03:12'), 'n');
    expect(byId<Sleep>(r.events, s.id).end).toBe(at('2026-10-23 03:12'));
    expect(r.undo.wakeId).toBe(s.id);
    expect(undoMessage(r.events, r.undo)).toBe('Vaknade 03:12 · Amning höger 03:12');
  });

  it('does not end a sleep that started after the feed time', () => {
    const s = sleep('2026-10-22 14:30', null);
    const r = logFeed([s], 'H', at('2026-10-22 14:10'), 'n');
    expect(byId<Sleep>(r.events, s.id).end).toBeNull();
    expect(r.undo.wakeId).toBeUndefined();
  });
});

describe('logBottle and logVitd', () => {
  it('logs a bottle, ending a sleep like a feed', () => {
    const s = sleep('2026-10-22 01:00', null);
    const r = logBottle([s], 120, at('2026-10-22 03:00'), 'n');
    expect(byId<Bottle>(r.events, 'n').ml).toBe(120);
    expect(r.undo.bottleId).toBe('n');
    expect(undoMessage(r.events, r.undo)).toBe('Vaknade 03:00 · Flaska 120 ml 03:00');
  });

  it('joins a breastfeed with a bottle', () => {
    const r = logBottle([feed('2026-10-22 15:00', 'H')], 90, at('2026-10-22 15:15'), 'n');
    expect(undoMessage(r.events, r.undo)).toBe('Flaska 90 ml 15:15 · samma tillfälle som 15:00');
  });

  it('logs vitamin D', () => {
    const r = logVitd([], at('2026-10-22 08:15'), 'n');
    expect(undoMessage(r.events, r.undo)).toBe('D-droppar givna 08:15');
  });
});

describe('undo bar actions', () => {
  it('shifts all affected times relative to when they were logged', () => {
    const s = sleep('2026-10-22 23:40', null);
    const r = logFeed([s], 'H', at('2026-10-23 03:12'), 'n');
    const once = shiftTargets(r.events, r.undo, 10);
    // Not cumulative: −15 after −10 means 15 min before the logged time.
    const twice = shiftTargets(once, r.undo, 15);
    expect(byId<Feed>(twice, 'n').t).toBe(at('2026-10-23 02:57'));
    expect(byId<Sleep>(twice, s.id).end).toBe(at('2026-10-23 02:57'));
    expect(undoMessage(twice, r.undo)).toBe('Vaknade 02:57 · Amning höger 02:57');
  });

  it('never moves a wake-up before the sleep started', () => {
    const s = sleep('2026-10-22 14:00', null);
    const r = toggleSleep([s], at('2026-10-22 14:05'), 'n');
    expect(byId<Sleep>(shiftTargets(r.events, r.undo, 30), s.id).end).toBe(at('2026-10-22 14:01'));
  });

  it('switches side', () => {
    const r = logFeed([], 'V', at('2026-10-22 14:00'), 'n');
    expect(byId<Feed>(switchSide(r.events, r.undo), 'n').side).toBe('H');
  });

  it('changes the amount, at least 10 ml', () => {
    const r = logBottle([], 30, at('2026-10-22 14:00'), 'n');
    expect(byId<Bottle>(changeMl(r.events, r.undo, 10), 'n').ml).toBe(40);
    expect(byId<Bottle>(changeMl(r.events, r.undo, -30), 'n').ml).toBe(10);
  });

  it('undoes only the wake-up', () => {
    const s = sleep('2026-10-22 23:40', null);
    const r = logFeed([s], 'H', at('2026-10-23 03:12'), 'n');
    const w = undoWake(r.events, r.undo);
    expect(byId<Sleep>(w.events, s.id).end).toBeNull();
    expect(w.undo.wakeId).toBeUndefined();
    expect(w.undo.targets.map((t) => t.id)).toEqual(['n']);
    expect(undoMessage(w.events, w.undo)).toBe('Amning höger 03:12 · sömnen fortsätter');
  });

  it('uses a fixed message for edits', () => {
    expect(undoMessage([], { prev: [], targets: [], msg: 'Ändrat: sömn 13:10–14:00' })).toBe('Ändrat: sömn 13:10–14:00');
  });
});

describe('describeEvent', () => {
  it('describes each type', () => {
    expect(describeEvent(sleep('2026-10-22 13:10', '2026-10-22 14:00'))).toBe('sömn 13:10–14:00');
    expect(describeEvent(sleep('2026-10-22 13:10', null))).toBe('sömn 13:10–');
    expect(describeEvent(feed('2026-10-22 14:05', 'V'))).toBe('amning vänster 14:05');
    expect(describeEvent(bottle('2026-10-22 14:05', 120))).toBe('flaska 120 ml 14:05');
    expect(describeEvent({ id: 'v', type: 'vitd', t: at('2026-10-22 08:15') })).toBe('D-droppar 08:15');
  });
});
