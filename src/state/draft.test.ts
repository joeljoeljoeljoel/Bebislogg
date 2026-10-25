import { describe, expect, it } from 'vitest';
import { at, bottle, feed, sleep } from '../domain/testing';
import { addDraft, draftEvent, draftFields, draftTitle, editDraft, quickDraft, typedTime, withType } from './draft';

const now = at('2026-10-22 14:00');

describe('drafts', () => {
  it('round-trips an edited event', () => {
    for (const e of [sleep('2026-10-22 13:10', '2026-10-22 14:00'), feed('2026-10-22 12:00', 'H'), bottle('2026-10-22 11:00', 90)]) {
      expect(draftEvent(editDraft(e), e.id)).toEqual(e);
    }
  });

  it('starts adding a sleep, and can switch type', () => {
    const d = addDraft(now, 'H', 90);
    expect(d.type).toBe('sleep');
    expect(d.field).toBe('start');
    const f = withType(d, 'feed');
    expect(f.field).toBe('t');
    expect(draftEvent(f, 'n')).toEqual({ id: 'n', type: 'feed', t: at('2026-10-22 13:40'), side: 'H' });
  });

  it('titles the sheet', () => {
    expect(draftTitle(addDraft(now, 'V', 120))).toBe('Lägg till');
    expect(draftTitle(withType(addDraft(now, 'V', 120), 'vitd'))).toBe('D-droppar');
    expect(draftTitle(editDraft(sleep('2026-10-22 13:10', null)))).toBe('Redigera sömn');
    expect(draftTitle(editDraft({ id: 'v', type: 'vitd', t: now }))).toBe('Redigera D-droppar');
    expect(draftTitle(quickDraft('feed', now, { asleep: false, side: 'H', ml: 120 }))).toBe('Amning höger');
    expect(draftTitle(quickDraft('sleep', now, { asleep: true, side: 'H', ml: 120 }))).toBe('Vaknade');
    expect(draftTitle(quickDraft('bottle', now, { asleep: false, side: 'H', ml: 120 }))).toBe('Flaska');
  });

  it('lists the time fields', () => {
    expect(draftFields(editDraft(sleep('2026-10-22 13:10', null))).map((f) => f.label)).toEqual(['Somnade', 'Vaknade']);
    expect(draftFields(quickDraft('sleep', now, { asleep: false, side: 'V', ml: 0 })).map((f) => f.label)).toEqual(['Somnade']);
    expect(draftFields(quickDraft('feed', now, { asleep: false, side: 'V', ml: 0 })).map((f) => f.label)).toEqual(['Amningen startade']);
    expect(draftFields(editDraft(feed('2026-10-22 12:00', 'H'))).map((f) => f.label)).toEqual(['Tid']);
  });
});

describe('typedTime', () => {
  it('sets the time on the same day', () => {
    expect(typedTime(at('2026-10-22 13:00'), 12 * 60 + 15, now)).toBe(at('2026-10-22 12:15'));
  });

  it('takes a future time to mean the day before', () => {
    const justAfterMidnight = at('2026-10-23 00:10');
    expect(typedTime(justAfterMidnight, 23 * 60 + 50, justAfterMidnight)).toBe(at('2026-10-22 23:50'));
  });
});
