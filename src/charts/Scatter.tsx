import type { Interval } from '../domain/forecast';
import { MIN, dur, pad } from '../domain/time';
import { C, CHART_W, fill, stroke } from './ChartCard';

/** Time of day (0–24) against length, with an optional dashed median. */
export function Scatter({
  points,
  maxMinutes,
  color,
  median,
}: {
  points: Interval[];
  maxMinutes: number;
  color: string;
  median?: number | null;
}) {
  const L = 34;
  const T = 10;
  const B = 18;
  const H = 150;
  const PH = H - T - B;
  const PW = CHART_W - L - 4;
  const max = maxMinutes * MIN;
  const X = (ts: number) => {
    const d = new Date(ts);
    return L + ((d.getHours() + d.getMinutes() / 60) / 24) * PW;
  };
  const Y = (v: number) => T + PH - (Math.min(v, max) / max) * PH;
  const step = maxMinutes > 200 ? 120 : 60;
  const ticks: number[] = [];
  for (let m = 0; m <= maxMinutes; m += step) ticks.push(m);

  return (
    <svg className="chart" viewBox={`0 0 ${CHART_W} ${H}`} aria-hidden="true">
      {ticks.map((m) => (
        <g key={m}>
          <line x1={L} x2={CHART_W} y1={Y(m * MIN)} y2={Y(m * MIN)} {...stroke(C.grid)} />
          <text x={L - 6} y={Y(m * MIN) + 3.5} fontSize={10} textAnchor="end" {...fill(C.muted)}>
            {m / 60} h
          </text>
        </g>
      ))}
      {[0, 6, 12, 18, 24].map((h, i) => (
        <text
          key={h}
          x={L + (h / 24) * PW}
          y={H - 3}
          fontSize={10}
          textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}
          {...fill(C.muted)}
        >
          {pad(h)}
        </text>
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={X(p.t)} cy={Y(p.len)} r={2.8} opacity={0.75} {...fill(color)} />
      ))}
      {median != null && (
        <g opacity={0.7}>
          <line x1={L} x2={CHART_W} y1={Y(median)} y2={Y(median)} strokeWidth={1.2} strokeDasharray="4 4" {...stroke(C.text)} />
          <text x={CHART_W - 2} y={Y(median) - 5} fontSize={10.5} textAnchor="end" {...fill(C.text)}>
            median {dur(median)}
          </text>
        </g>
      )}
    </svg>
  );
}
