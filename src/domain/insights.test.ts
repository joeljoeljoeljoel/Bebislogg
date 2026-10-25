import { describe, expect, it } from 'vitest';
import type { LogEvent } from './types';
import { insights } from './insights';
import { bottle, feed, model, regularDays, sleep, vitd } from './testing';

const byKicker = (events: LogEvent[], now: string, over = {}) =>
  Object.fromEntries(insights(model(events, now, over)).map((i) => [i.kicker, i]));

describe('insights without data', () => {
  it('shows how much data each card needs', () => {
    const list = insights(model([], '2026-10-22 10:00'));
    expect(list.map((i) => [i.kicker, i.text])).toEqual([
      ['Vakenfönster', 'Visas när det finns 7 dygns data'],
      ['Rekord', 'Visas när det finns 1 dygns data'],
      ['Dygnsrytm', 'Visas när det finns 7 dygns data'],
      ['Tätamning', 'Visas när det finns 4 dygns data'],
      ['Sömn efter amning', 'Visas när det finns 7 dygns data'],
      ['Bröstbalans', 'Visas när det finns 7 dygns data'],
    ]);
    expect(list.every((i) => !i.available)).toBe(true);
  });

  it('follows the feeding mode', () => {
    const kickers = (feedMode: 'Flaska' | 'Båda') =>
      insights(model([], '2026-10-22 10:00', { feedMode })).map((i) => i.kicker);
    expect(kickers('Båda')).toEqual([
      'Vakenfönster',
      'Rekord',
      'Dygnsrytm',
      'Kvällsmatning',
      'Sömn efter matning',
      'Bröstbalans',
      'Flaska',
    ]);
    expect(kickers('Flaska')).toEqual(['Vakenfönster', 'Rekord', 'Dygnsrytm', 'Kvällsmatning', 'Sömn efter flaska', 'Flaska']);
  });
});

describe('insights with a regular rhythm', () => {
  // 16 days: every daytime wake window 1 h 15 min, nights 19–07, a feed every 3 h.
  const events = regularDays('2026-10-06', 17, '2026-10-22 10:00');
  const ins = byKicker(events, '2026-10-22 10:00');

  it('averages the daytime wake window, with the week before', () => {
    expect(ins['Vakenfönster'].text).toBe(
      'Vakenfönstret har i snitt varit 1 h 15 min de senaste 7 dygnen (veckan innan: 1 h 15 min)',
    );
  });

  it('names the night of the longest sleep', () => {
    // The first 12 h night started Tuesday 6 Oct at 19:00.
    expect(ins['Rekord'].text).toBe('Längsta sömnpasset hittills: 12 h 00 min, natten till onsdag');
  });

  it('counts dygn with more night than day sleep', () => {
    expect(ins['Dygnsrytm'].text).toBe('Mer sömn på natten än på dagen 7 av de senaste 7 dygnen');
  });

  it('finds no evening cluster in an even rhythm', () => {
    expect(ins['Tätamning'].text).toBe(
      'Amningarna har varit jämnt fördelade över dygnet de senaste 4 dygnen',
    );
  });
});

describe('evening feeding', () => {
  const base = regularDays('2026-10-18', 5, '2026-10-22 10:00');
  const extra = (days: number[]) =>
    days.flatMap((d) => [feed(`2026-10-${d} 18:00`, 'V'), feed(`2026-10-${d} 20:30`, 'H')]);

  it('notices all of the last 4 evenings', () => {
    expect(byKicker([...base, ...extra([18, 19, 20, 21])], '2026-10-22 10:00')['Tätamning'].text).toBe(
      'Fler amningar mellan 18 och 21 de senaste 4 kvällarna',
    );
  });

  it('notices some of them', () => {
    expect(byKicker([...base, ...extra([20, 21])], '2026-10-22 10:00')['Tätamning'].text).toBe(
      'Fler amningar mellan 18 och 21 2 av de senaste 4 kvällarna',
    );
  });

  it('uses Kvällsmatning outside of breastfeeding-only', () => {
    const ins = byKicker([...base, ...extra([18, 19, 20, 21])], '2026-10-22 10:00', { feedMode: 'Båda' });
    expect(ins['Kvällsmatning'].text).toBe('Fler matningar mellan 18 och 21 de senaste 4 kvällarna');
  });
});

describe('cards that need a week of data', () => {
  // An old event makes it a week of data without filling every day.
  const old = vitd('2026-10-12 08:00');

  it('finds how soon the baby sleeps after feeding', () => {
    const events = [
      old,
      feed('2026-10-20 10:00', 'V'),
      sleep('2026-10-20 10:20', '2026-10-20 11:00'),
      feed('2026-10-20 13:00', 'H'),
      sleep('2026-10-20 13:10', '2026-10-20 14:00'),
      feed('2026-10-21 10:00', 'V'),
      sleep('2026-10-21 10:25', '2026-10-21 11:00'),
      feed('2026-10-21 13:00', 'H'),
      sleep('2026-10-21 13:20', '2026-10-21 14:00'),
      feed('2026-10-21 16:00', 'V'),
      sleep('2026-10-21 18:00', '2026-10-21 18:30'), // 2 h later, left out
    ];
    expect(byKicker(events, '2026-10-22 10:00')['Sömn efter amning'].text).toBe(
      'Somnar oftast inom 20 min efter amning',
    );
  });

  it('counts breasts over the last week', () => {
    const events = [
      old,
      feed('2026-10-20 10:00', 'V'),
      feed('2026-10-20 13:00', 'H'),
      feed('2026-10-21 10:00', 'V'),
      feed('2026-10-21 13:00', 'V'),
    ];
    expect(byKicker(events, '2026-10-22 10:00')['Bröstbalans'].text).toBe('Senaste veckan: höger 1 gång, vänster 3');
  });

  it('summarizes bottles', () => {
    const events = [old, bottle('2026-10-20 10:00', 120), bottle('2026-10-21 10:00', 90)];
    expect(byKicker(events, '2026-10-22 10:00', { feedMode: 'Båda' })['Flaska'].text).toBe(
      'I snitt 30 ml per dygn de senaste 7 dygnen, 105 ml per flaska',
    );
  });
});

describe('record', () => {
  it('says "på" for a daytime sleep', () => {
    // Tuesday
    const ins = byKicker([sleep('2026-10-20 13:00', '2026-10-20 15:30')], '2026-10-22 10:00');
    expect(ins['Rekord'].text).toBe('Längsta sömnpasset hittills: 2 h 30 min, på tisdag');
  });

  it('names the coming day for a sleep starting after midnight', () => {
    const ins = byKicker([sleep('2026-10-22 01:00', '2026-10-22 05:00')], '2026-10-22 10:00');
    expect(ins['Rekord'].text).toBe('Längsta sömnpasset hittills: 4 h 00 min, natten till torsdag');
  });
});
