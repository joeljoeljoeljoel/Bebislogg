import { describe, expect, it } from 'vitest';
import { at } from '../domain/testing';
import { clockAngle, dygnArc } from './clock';

describe('clockAngle', () => {
  it('goes clockwise from 00:00 at the top', () => {
    expect(clockAngle(at('2026-10-21 00:00'))).toBe(0);
    expect(clockAngle(at('2026-10-21 07:00'))).toBe(105);
    expect(clockAngle(at('2026-10-21 18:30'))).toBe(277.5);
  });
});

describe('dygnArc', () => {
  const D = at('2026-10-21 07:00');
  const E = at('2026-10-22 07:00');
  const arc = (a: string, b: string) => dygnArc(Math.max(at(a), D), Math.min(at(b), E), D, E, 2.5);

  it('draws a sleep inside the dygn as it is', () => {
    expect(arc('2026-10-21 12:00', '2026-10-21 13:00')).toEqual([180, 195]);
  });

  it('stops a sleep cut off by the dygn at the break', () => {
    expect(arc('2026-10-21 05:00', '2026-10-21 07:40')).toEqual([107.5, 115]);
    expect(arc('2026-10-22 06:00', '2026-10-22 08:00')).toEqual([90, 102.5]);
  });

  it('leaves out a sleep that ends or begins within the break', () => {
    // These once wrapped all the way around the ring.
    expect(arc('2026-10-21 05:00', '2026-10-21 07:05')).toBeNull();
    expect(arc('2026-10-22 06:55', '2026-10-22 08:00')).toBeNull();
  });

  it('fills the ring but the break for a sleep over the whole dygn', () => {
    expect(arc('2026-10-21 06:00', '2026-10-22 08:00')).toEqual([107.5, 102.5]);
  });
});
