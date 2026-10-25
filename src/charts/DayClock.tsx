import type { Meal, Sleep } from '../domain/types';
import type { NightConfig } from '../domain/days';
import { DAY, MIN, pad } from '../domain/time';
import './charts.css';

interface Props {
  now: number;
  sleeps: Sleep[];
  meals: Meal[];
  night: NightConfig;
  /** Small: the one on Nu, without labels */
  small?: boolean;
}

/** The last 24 hours on a 24-hour face: sleep as arcs, feedings as dots, the night shaded, a hand for now. */
export function DayClock({ now, sleeps, meals, night, small = false }: Props) {
  const size = small ? 108 : 300;
  const c = size / 2;
  const sw = small ? 8 : 14;
  const R = c - (small ? sw / 2 + 3 : sw / 2 + 24);
  const RO = R + sw / 2;

  const angle = (ts: number) => {
    const d = new Date(ts);
    return ((d.getHours() + d.getMinutes() / 60) / 24) * 360;
  };
  const pt = (a: number, r: number) => {
    const rad = (a * Math.PI) / 180;
    return [c + r * Math.sin(rad), c - r * Math.cos(rad)];
  };
  const arc = (a0: number, a1: number, r: number) => {
    let d = a1 - a0;
    if (d < 0) d += 360;
    const [x0, y0] = pt(a0, r);
    if (d > 359.5) {
      const [x1, y1] = pt(a0 + 180, r);
      return `M${x0} ${y0}A${r} ${r} 0 1 1 ${x1} ${y1}A${r} ${r} 0 1 1 ${x0} ${y0}`;
    }
    const [x1, y1] = pt(a0 + d, r);
    return `M${x0} ${y0}A${r} ${r} 0 ${d > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };

  const n0 = (night.start / 1440) * 360;
  let nd = ((night.end - night.start) / 1440) * 360;
  if (nd < 0) nd += 360;
  const [w0x, w0y] = pt(n0, RO);
  const [w1x, w1y] = pt(n0 + nd, RO);
  const from = now - DAY + 3 * MIN;
  const [hx, hy] = pt(angle(now), RO + (small ? 2 : 5));

  return (
    <svg className="dayclock" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {nd > 0 && (
        <path
          className="dc-night"
          d={`M${c} ${c}L${w0x} ${w0y}A${RO} ${RO} 0 ${nd > 180 ? 1 : 0} 1 ${w1x} ${w1y}Z`}
        />
      )}
      <circle className="dc-ring" cx={c} cy={c} r={R} strokeWidth={sw} />
      {sleeps.map((s) => {
        const a = Math.max(s.start, from);
        const b = Math.min(s.end ?? now, now);
        if (b - a < 2 * MIN) return null;
        return <path key={s.id} className="dc-sleep" d={arc(angle(a), angle(b), R)} strokeWidth={sw} />;
      })}
      {meals.map((m) => {
        if (m.t < from || m.t > now) return null;
        const kind = m.type === 'bottle' ? 'bottle' : 'feed';
        if (small) {
          const [x, y] = pt(angle(m.t), R);
          return <circle key={m.id} className={`dc-dot dc-${kind}`} cx={x} cy={y} r={3.2} />;
        }
        const [x, y] = pt(angle(m.t), RO + 12);
        return (
          <g key={m.id} className={`dc-mark dc-${kind}`}>
            <circle cx={x} cy={y} r={8} />
            <text x={x} y={y + 3.5}>
              {m.type === 'feed' ? m.side : 'F'}
            </text>
          </g>
        );
      })}
      {!small &&
        [0, 6, 12, 18].map((h) => {
          const [x, y] = pt(h * 15, R - sw / 2 - 13);
          return (
            <text key={h} className="dc-label" x={x} y={y + 4}>
              {pad(h)}
            </text>
          );
        })}
      <line className="dc-hand" x1={c} y1={c} x2={hx} y2={hy} strokeWidth={small ? 1.5 : 2} />
      <circle className="dc-hub" cx={c} cy={c} r={small ? 2.5 : 3.5} />
    </svg>
  );
}
