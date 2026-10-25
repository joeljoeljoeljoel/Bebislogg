// Test helpers: build events from readable local times ("2026-10-22 14:05").
import type { Bottle, Feed, LogEvent, Settings, Side, Sleep, VitD } from './types';
import { buildModel } from './model';
import { defaultSettings } from './settings';

let seq = 0;
const id = () => `x${++seq}`;

/** Local time. For the repeated hour when DST ends this gives the first (summer time) occurrence. */
export function at(s: string): number {
  const [date, time = '00:00'] = s.split(' ');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi).getTime();
}

export const sleep = (start: string, end: string | null): Sleep => ({
  id: id(),
  type: 'sleep',
  start: at(start),
  end: end === null ? null : at(end),
});
export const feed = (t: string, side: Side): Feed => ({ id: id(), type: 'feed', t: at(t), side });
export const bottle = (t: string, ml: number): Bottle => ({ id: id(), type: 'bottle', t: at(t), ml });
export const vitd = (t: string): VitD => ({ id: id(), type: 'vitd', t: at(t) });

export const settings = (over: Partial<Settings> = {}): Settings => ({
  ...defaultSettings(at('2026-09-10')),
  name: 'Elsa',
  birth: '2026-09-10',
  setupDone: true,
  ...over,
});

export const model = (events: LogEvent[], now: string, over: Partial<Settings> = {}) =>
  buildModel(events, settings(over), at(now));

/**
 * A very regular rhythm for `days` days starting the morning of `from`,
 * cut off at `now`: every daytime wake window is 1 h 15 min, the night sleep
 * runs 19:00–07:00 and a breastfeed starts every 3 hours from 07:00.
 */
export function regularDays(from: string, days: number, now: string): LogEvent[] {
  const cut = at(now);
  const out: LogEvent[] = [];
  const d0 = new Date(at(from));
  let side: Side = 'V';
  for (let i = 0; i < days; i++) {
    const day = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i);
    const t = (h: number, m = 0) =>
      new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
    const naps: [number, number][] = [
      [t(8, 15), t(9, 15)],
      [t(10, 30), t(11, 30)],
      [t(12, 45), t(13, 45)],
      [t(15, 0), t(16, 0)],
      [t(17, 15), t(17, 45)],
      [t(19, 0), t(31, 0)], // night, until 07:00 the next day
    ];
    for (const [start, end] of naps) {
      if (start > cut) break;
      out.push({ id: id(), type: 'sleep', start, end: end > cut ? null : end });
    }
    for (let h = 7; h < 31; h += 3) {
      if (t(h) > cut) break;
      out.push({ id: id(), type: 'feed', t: t(h), side });
      side = side === 'V' ? 'H' : 'V';
    }
  }
  return out;
}
