// Geometry for the Dygnsklocka.

/** Degrees clockwise from 00:00 on a 24-hour face, by the wall clock. */
export function clockAngle(ts: number): number {
  const d = new Date(ts);
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 360;
}

/**
 * Where to draw the part of a sleep from a to b that lies in the dygn from D
 * to E: start and end in degrees on the face. The ring breaks for `gap`
 * degrees on each side of where the dygn begins and ends, and the arc stays
 * out of the break. Null when nothing is left to draw.
 */
export function dygnArc(a: number, b: number, D: number, E: number, gap: number): [number, number] | null {
  const seam = clockAngle(D);
  // Degrees from the break: the start of the dygn is 0 and its end 360.
  const rel = (t: number) => (t <= D ? 0 : t >= E ? 360 : (clockAngle(t) - seam + 360) % 360);
  const r0 = Math.max(rel(a), gap);
  const r1 = Math.min(rel(b), 360 - gap);
  // Less than two minutes left outside the break
  if (r1 - r0 < 0.5) return null;
  return [(seam + r0) % 360, (seam + r1) % 360];
}
