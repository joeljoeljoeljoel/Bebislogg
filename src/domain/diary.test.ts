import { describe, expect, it } from 'vitest';
import { type DiaryEntry, diaryDays, sleepRowHeight } from './diary';
import { at, bottle, feed, model, sleep, vitd } from './testing';
import { HOUR, MIN } from './time';

const describeItems = (items: ReturnType<typeof diaryDays>['days'][number]['items']) =>
  items.map((it) => (it.kind === 'wake' ? `~ ${it.text}` : `${it.time} ${it.sub} ${it.right}`.trim()));

describe('diaryDays', () => {
  const events = [
    sleep('2026-10-22 09:00', '2026-10-22 10:00'),
    feed('2026-10-22 10:05', 'V'),
    feed('2026-10-22 10:25', 'H'),
    bottle('2026-10-22 10:40', 60),
    vitd('2026-10-22 10:50'),
    sleep('2026-10-22 11:05', '2026-10-22 12:00'),
  ];

  it('lists rows newest first, with the wake window below the sleep it led up to', () => {
    const { days } = diaryDays(model(events, '2026-10-22 12:30'), 5);
    expect(describeItems(days[0].items)).toEqual([
      '~ vaken 30 min · pågår',
      '11:05–12:00 Sömn 55 min',
      '~ vaken 1 h 05 min',
      '10:50 D-droppar',
      '10:40 Flaska · samma tillfälle 60 ml',
      '10:25 Amning höger · samma tillfälle +20 min',
      '10:05 Amning vänster',
      '09:00–10:00 Sömn 1 h 00 min',
    ]);
  });

  it('shows an ongoing sleep without a live wake window', () => {
    const { days } = diaryDays(model([...events, sleep('2026-10-22 12:20', null)], '2026-10-22 12:30'), 5);
    expect(describeItems(days[0].items).slice(0, 2)).toEqual(['12:20– Sover nu 10 min', '~ vaken 20 min']);
  });

  it('makes joined feeds shorter and sleeps taller with their length', () => {
    const { days } = diaryDays(model(events, '2026-10-22 12:30'), 5);
    const entries = days[0].items.filter((x): x is DiaryEntry => x.kind === 'event');
    expect(entries.map((e) => e.height)).toEqual([sleepRowHeight(55 * MIN), 46, 52, 44, 52, sleepRowHeight(HOUR)]);
    expect(sleepRowHeight(0)).toBe(54);
    expect(sleepRowHeight(10 * HOUR)).toBe(104);
  });

  it('summarizes each dygn in the wording of the feeding mode', () => {
    const { days } = diaryDays(model(events, '2026-10-22 12:30', { feedMode: 'Båda' }), 5);
    expect(days[0].label).toBe('Idag');
    expect(days[0].summary).toBe('Sömn 1 h 55 min · 1 matning · 60 ml');
    expect(days[0].stats.map((s) => `${s.label}: ${s.value}`)).toEqual([
      'Total sömn: 1 h 55 min',
      'Varav natt: 0 min',
      'Tupplurar: 2',
      'Längsta pass: 1 h 00 min',
      'Matningar: 1',
      'Längsta intervall: –',
      'Flaska totalt: 60 ml',
    ]);
    const amning = diaryDays(model(events, '2026-10-22 12:30'), 5).days[0];
    expect(amning.summary).toBe('Sömn 1 h 55 min · 1 amning');
    expect(amning.stats).toHaveLength(6);
  });

  it('groups by dygn from 07:00, newest first, and pages through older ones', () => {
    const many = [feed('2026-10-15 08:00', 'V'), feed('2026-10-22 06:30', 'H'), feed('2026-10-22 07:30', 'V')];
    const m = model(many, '2026-10-22 12:00');
    const first = diaryDays(m, 5);
    expect(first.days.map((d) => d.label)).toEqual(['Idag', 'Igår', 'tis 20 okt', 'mån 19 okt', 'sön 18 okt']);
    expect(first.hasMore).toBe(true);
    // 06:30 belongs to the dygn that began yesterday at 07:00.
    expect(describeItems(first.days[1].items)).toEqual(['06:30 Amning höger']);
    const all = diaryDays(m, 12);
    expect(all.days).toHaveLength(8);
    expect(all.hasMore).toBe(false);
  });

  it('is empty without data', () => {
    expect(diaryDays(model([], '2026-10-22 12:00'), 5)).toEqual({ days: [], hasMore: false });
  });

  it('keeps the night to 25 Oct, when DST ends, in one dygn', () => {
    const m = model([sleep('2026-10-24 19:00', '2026-10-25 07:00')], '2026-10-25 12:00');
    const { days } = diaryDays(m, 5);
    expect(days[1].summary).toBe('Sömn 13 h 00 min · 0 amningar');
    expect(at('2026-10-25 07:00') - days[1].D).toBe(25 * HOUR);
  });
});
