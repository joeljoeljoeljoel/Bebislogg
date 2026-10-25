import type { Sleep } from './types';
import { hm, overlap } from './time';

export interface SleepDraft {
  /** Set when editing an existing sleep */
  id?: string;
  start: number;
  end: number | null;
}

export interface SleepWarning {
  /** 'order' must be fixed; 'overlap' can be saved anyway */
  kind: 'order' | 'overlap';
  text: string;
  /** Suggested correction, if there is an obvious one */
  fix: { label: string; patch: { start?: number; end?: number } } | null;
}

/** Validates a sleep being saved from the edit sheet. Null means it is fine. */
export function checkSleep(draft: SleepDraft, sleeps: Sleep[], now: number): SleepWarning | null {
  if (draft.end !== null && draft.end <= draft.start) {
    return { kind: 'order', text: 'Vaknade behöver vara efter Somnade.', fix: null };
  }
  const end = draft.end ?? now;
  const other = sleeps.find((s) => s.id !== draft.id && overlap(draft.start, end, s.start, s.end ?? now) > 0);
  if (!other) return null;

  const text = `Överlappar sömnen ${hm(other.start)}–${other.end !== null ? hm(other.end) : 'nu'}.`;
  if (other.end !== null && draft.start >= other.start && draft.start < other.end) {
    const fix = { label: `Flytta Somnade till ${hm(other.end)}`, patch: { start: other.end } };
    return { kind: 'overlap', text, fix };
  }
  if (draft.end !== null && draft.end > other.start) {
    const fix = { label: `Flytta Vaknade till ${hm(other.start)}`, patch: { end: other.start } };
    return { kind: 'overlap', text, fix };
  }
  return { kind: 'overlap', text, fix: null };
}
