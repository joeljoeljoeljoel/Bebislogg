// Generated demo data, ported from the prototype. Development only.
import type { LogEvent, Settings, Side } from '../domain/types';
import { isNight, nightConfig } from '../domain/days';
import { defaultSettings } from '../domain/settings';
import { DAY, MIN, dateStr } from '../domain/time';

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoSettings(now: number): Settings {
  return {
    ...defaultSettings(now),
    name: 'Elsa',
    birth: dateStr(now - 44 * DAY),
    feedMode: 'Båda',
    setupDone: true,
    lastBackup: now - 9 * DAY,
  };
}

/** A plausible rhythm for the last `days` days, with nights getting longer over time. */
export function demoEvents(now: number, days: number, settings: Settings): LogEvent[] {
  if (!days) return [];
  const r = rng(11);
  const R = (a: number, b: number) => a + (b - a) * r();
  const toMin = (ts: number) => Math.round(ts / MIN) * MIN;
  const night = nightConfig(settings);
  const isN = (ts: number) => isNight(ts, night);
  const mode = settings.feedMode;
  const ev: LogEvent[] = [];
  let n = 1;
  const id = () => `demo${n++}`;
  let side: Side = 'V';
  const flip = () => (side = side === 'V' ? 'H' : 'V');

  const feed = (at: number) => {
    at = toMin(at);
    if (at >= now) return;
    if (mode === 'Flaska' || (mode === 'Båda' && r() < 0.14)) {
      ev.push({ id: id(), type: 'bottle', t: at, ml: Math.round(R(80, 140) / 10) * 10 });
      return;
    }
    ev.push({ id: id(), type: 'feed', t: at, side });
    flip();
  };

  const t0 = now - days * DAY;
  const d = new Date(t0);
  d.setHours(7, 20, 0, 0);
  let t = d.getTime();
  for (let guard = 0; guard < 3000; guard++) {
    const progress = Math.min(1, Math.max(0, (t - t0) / (days * DAY)));
    const nightNow = isN(t);
    const t1 = t + R(2, 9) * MIN;
    feed(t1);
    const last = ev[ev.length - 1];
    if (last?.type === 'feed' && last.t === toMin(t1) && r() < 0.28) {
      const t2 = toMin(t1 + R(12, 24) * MIN);
      if (t2 < now) {
        ev.push({ id: id(), type: 'feed', t: t2, side });
        flip();
      }
    }
    const wake = nightNow ? R(22, 48) : R(42, 66) + progress * 22;
    const hour = new Date(t).getHours();
    if (!nightNow && hour >= 17 && hour < 21 && r() < 0.75) feed(t + wake * 0.75 * MIN);
    const start = toMin(t + wake * MIN);
    if (start > now) break;
    const len = isN(start) ? R(95, 160) + progress * 80 : R(28, 95);
    const end = toMin(start + len * MIN);
    if (end > now) {
      ev.push({ id: id(), type: 'sleep', start, end: null });
      break;
    }
    ev.push({ id: id(), type: 'sleep', start, end });
    t = end;
  }

  for (let back = days; back >= 0; back--) {
    const D = new Date(now - back * DAY);
    D.setHours(8, 30, 0, 0);
    const vt = toMin(D.getTime() + R(-40, 90) * MIN);
    if (vt < t0 || vt > now) continue;
    if (back > 0 && r() < 0.12) continue;
    ev.push({ id: id(), type: 'vitd', t: vt });
  }
  return ev;
}
