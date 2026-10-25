// The edit sheet works on a draft that holds every field, so the type can be
// switched while adding without losing what was entered.
import type { LogEvent, Side } from '../domain/types';
import { MIN, addDays, atTime } from '../domain/time';
import { sideName } from '../domain/wording';
import type { TimeField } from './actions';

export type EventType = LogEvent['type'];

export interface Draft {
  /** quick: from a long press, saving logs it like a tap. */
  kind: 'quick' | 'edit' | 'add';
  type: EventType;
  /** Set when editing */
  id?: string;
  start: number;
  end: number | null;
  t: number;
  side: Side;
  ml: number;
  /** The time field the quick buttons and the clock act on */
  field: TimeField;
  /** Quick sheet for "Vaknade" while asleep */
  quickWake?: boolean;
}

export function editDraft(e: LogEvent, field?: TimeField): Draft {
  const base = { kind: 'edit' as const, type: e.type, id: e.id, side: 'V' as Side, ml: 120 };
  if (e.type === 'sleep') return { ...base, start: e.start, end: e.end, t: e.start, field: field ?? 'start' };
  return {
    ...base,
    start: e.t,
    end: e.t,
    t: e.t,
    side: e.type === 'feed' ? e.side : 'V',
    ml: e.type === 'bottle' ? e.ml : 120,
    field: 't',
  };
}

/** Dagbok → Lägg till: a sleep 90–30 min ago, or a feeding 20 min ago. */
export function addDraft(now: number, side: Side, ml: number): Draft {
  return { kind: 'add', type: 'sleep', start: now - 90 * MIN, end: now - 30 * MIN, t: now - 20 * MIN, side, ml, field: 'start' };
}

/** Long press on a button on Nu: pick the time before logging. */
export function quickDraft(
  type: 'sleep' | 'feed' | 'bottle',
  now: number,
  opts: { asleep: boolean; side: Side; ml: number },
): Draft {
  const base = { kind: 'quick' as const, type, start: now, end: now, t: now, side: opts.side, ml: opts.ml };
  if (type === 'sleep') return { ...base, quickWake: opts.asleep, field: opts.asleep ? 'end' : 'start' };
  return { ...base, field: 't' };
}

export const withType = (d: Draft, type: EventType): Draft => ({ ...d, type, field: type === 'sleep' ? 'start' : 't' });

export function draftEvent(d: Draft, id: string): LogEvent {
  switch (d.type) {
    case 'sleep':
      return { id, type: 'sleep', start: d.start, end: d.end };
    case 'feed':
      return { id, type: 'feed', t: d.t, side: d.side };
    case 'bottle':
      return { id, type: 'bottle', t: d.t, ml: d.ml };
    case 'vitd':
      return { id, type: 'vitd', t: d.t };
  }
}

export function draftTitle(d: Draft): string {
  if (d.type === 'vitd') return d.kind === 'edit' ? 'Redigera D-droppar' : 'D-droppar';
  if (d.kind === 'add') return 'Lägg till';
  if (d.kind === 'quick') {
    if (d.type === 'bottle') return 'Flaska';
    if (d.type === 'feed') return `Amning ${sideName(d.side)}`;
    return d.quickWake ? 'Vaknade' : 'Somnade';
  }
  return d.type === 'bottle' ? 'Redigera flaska' : d.type === 'feed' ? 'Redigera amning' : 'Redigera sömn';
}

/** The time fields shown in the sheet. */
export function draftFields(d: Draft): { key: TimeField; label: string }[] {
  if (d.type !== 'sleep') return [{ key: 't', label: d.kind === 'quick' && d.type === 'feed' ? 'Amningen startade' : 'Tid' }];
  if (d.kind === 'quick') return [d.quickWake ? { key: 'end', label: 'Vaknade' } : { key: 'start', label: 'Somnade' }];
  return [
    { key: 'start', label: 'Somnade' },
    { key: 'end', label: 'Vaknade' },
  ];
}

/**
 * A clock time typed into the time field, on the day of the current value.
 * A time that would be in the future means the day before: at 00:10, "23:50"
 * is yesterday evening.
 */
export function typedTime(current: number, minutes: number, now: number): number {
  const ts = atTime(current, minutes);
  return ts > now + MIN ? addDays(ts, -1) : ts;
}
