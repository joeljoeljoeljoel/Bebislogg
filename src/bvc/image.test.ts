import { describe, expect, it } from 'vitest';
import { bvcSummary } from '../domain/bvc';
import { bottle, model, regularDays, vitd } from '../domain/testing';
import { layoutBvcImage, oneDecimal } from './image';

const texts = (ops: ReturnType<typeof layoutBvcImage>['ops']) =>
  ops.flatMap((o) => (o.t === 'text' ? [o.text] : []));

describe('layoutBvcImage', () => {
  const events = [...regularDays('2026-10-10', 13, '2026-10-22 10:00'), vitd('2026-10-21 08:30')];

  it('has the header, the averages and one row per dygn', () => {
    const { ops } = layoutBvcImage(bvcSummary(model(events, '2026-10-22 10:00'), 7));
    const t = texts(ops);
    expect(t).toContain('Elsa');
    expect(t).toContain('6 veckor · 15–21 okt (7 dygn)');
    expect(t).toContain('16 h 30 min');
    expect(t).toContain('Amningar per dygn');
    expect(t).toContain('1 av 7 dagar');
    expect(t.filter((x) => /^(mån|tis|ons|tor|fre|lör|sön) \d+ okt$/.test(x))).toHaveLength(7);
    expect(ops.filter((o) => o.t === 'check')).toHaveLength(1);
    expect(t).not.toContain('ML');
    expect(t).toContain('Ett dygn = 07:00–07:00, så natten räknas till dagen innan.');
  });

  it('adds the bottle column and average when bottles are in use', () => {
    const withBottle = [...events, bottle('2026-10-21 12:00', 90)];
    const t = texts(layoutBvcImage(bvcSummary(model(withBottle, '2026-10-22 10:00', { feedMode: 'Båda' }), 7)).ops);
    expect(t).toContain('ML');
    expect(t).toContain('Flaska per dygn');
    expect(t).toContain('13 ml');
    expect(t).toContain('MAT.');
  });

  it('grows with the number of dygn and stays inside the width', () => {
    const week = layoutBvcImage(bvcSummary(model(events, '2026-10-22 10:00'), 7));
    const month = layoutBvcImage(bvcSummary(model(events, '2026-10-22 10:00'), 28));
    expect(month.height).toBeGreaterThan(week.height);
    for (const o of month.ops) if (o.t === 'text') expect(o.x).toBeLessThanOrEqual(month.width);
  });
});

describe('oneDecimal', () => {
  it('uses a decimal comma and drops ,0', () => {
    expect(oneDecimal(8)).toBe('8');
    expect(oneDecimal(7.43)).toBe('7,4');
    expect(oneDecimal(4.96)).toBe('5');
  });
});
