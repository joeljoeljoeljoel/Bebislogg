// What the buttons on Nu and the undo bar do, as pure functions over the event list.
import type { Bottle, Feed, LogEvent, Settings, Side, Sleep } from '../domain/types';
import { buildSessions } from '../domain/sessions';
import { MIN, hm } from '../domain/time';
import { sideName } from '../domain/wording';

export type TimeField = 'start' | 'end' | 't';

/** A time that "Ändra tid" can move, relative to when it was logged. */
export interface UndoTarget {
  id: string;
  field: TimeField;
  base: number;
}

export interface Undo {
  /** The event list before the action; "Ångra" restores it. */
  prev: LogEvent[];
  targets: UndoTarget[];
  /** The sleep a feeding ended ("Ångra uppvaknandet") */
  wakeId?: string;
  feedId?: string;
  bottleId?: string;
  /** The wake-up was undone */
  sleepContinues?: boolean;
  /** Fixed message, for edits, additions and deletions */
  msg?: string;
  /** Settings before a restore from file */
  prevSettings?: Settings;
}

export interface ActionResult {
  events: LogEvent[];
  undo: Undo;
}

export function newId(): string {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function openSleep(events: LogEvent[]): Sleep | undefined {
  let open: Sleep | undefined;
  for (const e of events) if (e.type === 'sleep' && e.end === null && (!open || e.start > open.start)) open = e;
  return open;
}

/** "Somnade nu" starts a sleep; "Vaknade nu" ends the open one (at least 1 min long). */
export function toggleSleep(events: LogEvent[], at: number, id: string): ActionResult {
  const open = openSleep(events);
  if (open) {
    const end = Math.max(at, open.start + MIN);
    return {
      events: events.map((e) => (e === open ? { ...open, end } : e)),
      undo: { prev: events, targets: [{ id: open.id, field: 'end', base: end }] },
    };
  }
  return {
    events: [...events, { id, type: 'sleep', start: at, end: null }],
    undo: { prev: events, targets: [{ id, field: 'start', base: at }] },
  };
}

/** A feeding while asleep also ends the sleep, at the same time. */
function logMeal(events: LogEvent[], meal: Feed | Bottle): ActionResult {
  const open = openSleep(events);
  const wakes = open !== undefined && meal.t > open.start;
  const next = wakes ? events.map((e) => (e === open ? { ...open, end: meal.t } : e)) : [...events];
  next.push(meal);
  const targets: UndoTarget[] = wakes ? [{ id: open.id, field: 'end', base: meal.t }] : [];
  targets.push({ id: meal.id, field: 't', base: meal.t });
  return {
    events: next,
    undo: {
      prev: events,
      targets,
      wakeId: wakes ? open.id : undefined,
      ...(meal.type === 'feed' ? { feedId: meal.id } : { bottleId: meal.id }),
    },
  };
}

export const logFeed = (events: LogEvent[], side: Side, at: number, id: string) =>
  logMeal(events, { id, type: 'feed', t: at, side });

export const logBottle = (events: LogEvent[], ml: number, at: number, id: string) =>
  logMeal(events, { id, type: 'bottle', t: at, ml });

export function logVitd(events: LogEvent[], at: number, id: string): ActionResult {
  return {
    events: [...events, { id, type: 'vitd', t: at }],
    undo: { prev: events, targets: [{ id, field: 't', base: at }] },
  };
}

/** "Ändra tid": every target moves to its logged time minus `minutes`. */
export function shiftTargets(events: LogEvent[], undo: Undo, minutes: number): LogEvent[] {
  return events.map((e) => {
    const tg = undo.targets.find((x) => x.id === e.id);
    if (!tg) return e;
    let v = tg.base - minutes * MIN;
    if (tg.field === 'end' && e.type === 'sleep') v = Math.max(v, e.start + MIN);
    return { ...e, [tg.field]: v } as LogEvent;
  });
}

/** "Byt sida" */
export function switchSide(events: LogEvent[], undo: Undo): LogEvent[] {
  return events.map((e) =>
    e.id === undo.feedId && e.type === 'feed' ? { ...e, side: e.side === 'V' ? 'H' : 'V' } : e,
  );
}

/** "Ändra mängd", never below 10 ml */
export function changeMl(events: LogEvent[], undo: Undo, delta: number): LogEvent[] {
  return events.map((e) =>
    e.id === undo.bottleId && e.type === 'bottle' ? { ...e, ml: Math.max(10, e.ml + delta) } : e,
  );
}

/** "Ångra uppvaknandet": the sleep goes on; only the feeding stays. */
export function undoWake(events: LogEvent[], undo: Undo): ActionResult {
  return {
    events: events.map((e) => (e.id === undo.wakeId && e.type === 'sleep' ? { ...e, end: null } : e)),
    undo: {
      ...undo,
      wakeId: undefined,
      targets: undo.targets.filter((t) => t.id !== undo.wakeId),
      sleepContinues: true,
    },
  };
}

/** "sömn 14:32–15:40", "amning vänster 14:05", "flaska 120 ml 14:05", "D-droppar 08:15" */
export function describeEvent(e: LogEvent): string {
  switch (e.type) {
    case 'sleep':
      return `sömn ${hm(e.start)}–${e.end !== null ? hm(e.end) : ''}`;
    case 'feed':
      return `amning ${sideName(e.side)} ${hm(e.t)}`;
    case 'bottle':
      return `flaska ${e.ml} ml ${hm(e.t)}`;
    case 'vitd':
      return `D-droppar ${hm(e.t)}`;
  }
}

/** The undo bar text, from the current state of the affected events. */
export function undoMessage(events: LogEvent[], undo: Undo): string {
  if (undo.msg) return undo.msg;
  const parts: string[] = [];
  for (const tg of undo.targets) {
    const e = events.find((x) => x.id === tg.id);
    if (!e) continue;
    if (e.type === 'sleep') {
      const v = tg.field === 'start' ? e.start : e.end;
      if (v !== null) parts.push(`${tg.field === 'start' ? 'Somnade' : 'Vaknade'} ${hm(v)}`);
    } else if (e.type === 'feed') parts.push(`Amning ${sideName(e.side)} ${hm(e.t)}`);
    else if (e.type === 'bottle') parts.push(`Flaska ${e.ml} ml ${hm(e.t)}`);
    else parts.push(`D-droppar givna ${hm(e.t)}`);
  }

  const mealId = undo.feedId ?? undo.bottleId;
  if (mealId) {
    const meals = events.filter((e): e is Feed | Bottle => e.type === 'feed' || e.type === 'bottle');
    const session = buildSessions(meals.sort((a, b) => a.t - b.t)).find((s) => s.meals.some((m) => m.id === mealId));
    const other = session?.meals.find((m) => m.id !== mealId);
    if (other) parts.push(`samma tillfälle som ${hm(other.t)}`);
  }
  if (undo.sleepContinues) parts.push('sömnen fortsätter');
  return parts.join(' · ');
}
