import type { DayStats } from '../domain/stats';
import { HOUR, WEEKDAYS, dur, shortDate } from '../domain/time';
import { C, CHART_W, fill, stroke } from './ChartCard';

/** The longest sleep of each night, as a line. The best night is labeled. */
export function LineChart({ days }: { days: DayStats[] }) {
  const L = 30;
  const T = 16;
  const B = 18;
  const H = 140;
  const PH = H - T - B;
  // Room on the right for the last weekday label
  const PW = CHART_W - L - 26;
  const n = days.length;
  const few = n <= 7;
  const max = Math.max(4 * HOUR, Math.ceil(Math.max(0, ...days.map((d) => d.nightLongest)) / HOUR) * HOUR);
  const Y = (v: number) => T + PH - (v / max) * PH;
  const X = (i: number) => L + 8 + (n < 2 ? PW / 2 : (i / (n - 1)) * PW);

  const points = days.flatMap((d, i) => (d.nightLongest > 0 ? [{ x: X(i), y: Y(d.nightLongest), v: d.nightLongest }] : []));
  const best = points.reduce<(typeof points)[number] | null>((b, p) => (!b || p.v > b.v ? p : b), null);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += 2 * HOUR) ticks.push(v);

  return (
    <svg className="chart" viewBox={`0 0 ${CHART_W} ${H}`} aria-hidden="true">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={CHART_W} y1={Y(v)} y2={Y(v)} {...stroke(C.grid)} />
          <text x={L - 6} y={Y(v) + 3.5} fontSize={10} textAnchor="end" {...fill(C.muted)}>
            {v / HOUR} h
          </text>
        </g>
      ))}
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          {...stroke(C.sleep)}
        />
      )}
      {points.map((p) => (
        <circle key={p.x} cx={p.x} cy={p.y} r={few ? 4 : 2.6} strokeWidth={2} style={{ fill: C.surface, stroke: C.sleep }} />
      ))}
      {best && (
        // Kept inside the chart when the best night is at either end
        <text
          x={best.x > CHART_W - 34 ? CHART_W - 2 : Math.max(L + 30, best.x)}
          y={best.y - 8}
          fontSize={10.5}
          textAnchor={best.x > CHART_W - 34 ? 'end' : 'middle'}
          {...fill(C.text)}
        >
          {dur(best.v)}
        </text>
      )}
      {days.map(
        (d, i) =>
          (few || i % 7 === (n - 1) % 7) && (
            <text key={d.D} x={X(i)} y={H - 3} fontSize={10} textAnchor="middle" {...fill(C.muted)}>
              {/* The night ends on the morning of the next day. */}
              {few ? WEEKDAYS[new Date(d.E).getDay()] : shortDate(d.E)}
            </text>
          ),
      )}
    </svg>
  );
}
