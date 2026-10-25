import type { SleepMapRow } from '../domain/charts';
import { C, CHART_W, fill, stroke } from './ChartCard';

const HOURS = ['18', '00', '06', '12', '18'];

/** One row per dygn, 18–18, newest first: sleep as bars, feedings as dots, the night shaded. */
export function SleepMap({ rows, now, compact }: { rows: SleepMapRow[]; now: number; compact: boolean }) {
  const L = 38;
  const PW = CHART_W - L - 2;
  const rh = compact ? 7 : 18;
  const gap = compact ? 3 : 7;
  const top = 4;
  const H = top + rows.length * (rh + gap) + 16;

  return (
    <svg className="chart" viewBox={`0 0 ${CHART_W} ${H}`} aria-hidden="true">
      {HOURS.map((label, i) => {
        const x = L + (i / 4) * PW;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={top - 2} y2={H - 15} {...stroke(C.grid)} />
            <text x={x} y={H - 3} fontSize={10} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} {...fill(C.muted)}>
              {label}
            </text>
          </g>
        );
      })}
      {rows.map((row, i) => {
        const y = top + i * (rh + gap);
        const span = row.end - row.start;
        const X = (ts: number) => L + ((ts - row.start) / span) * PW;
        return (
          <g key={row.start}>
            <rect
              x={X(row.night[0])}
              y={y - 1}
              width={Math.max(0, X(row.night[1]) - X(row.night[0]))}
              height={rh + 2}
              rx={2}
              {...fill(C.night)}
            />
            {row.label && (
              <text x={0} y={y + rh / 2 + 3.5} fontSize={10} {...fill(C.muted)}>
                {row.label}
              </text>
            )}
            {row.sleeps.map(([a, b], j) => (
              <rect
                key={j}
                x={X(a)}
                y={y}
                width={Math.max(1, X(b) - X(a))}
                height={rh}
                rx={compact ? 1.5 : 3}
                {...fill(C.sleep)}
              />
            ))}
            {row.meals.map((meal, j) => (
              <circle
                key={j}
                cx={X(meal.t)}
                cy={y + rh / 2}
                r={compact ? 1.7 : 3.2}
                strokeWidth={compact ? 0.5 : 1.2}
                style={{ fill: meal.bottle ? C.bottle : C.feed, stroke: C.surface }}
              />
            ))}
            {i === 0 && <line x1={X(now)} x2={X(now)} y1={y - 3} y2={y + rh + 3} strokeWidth={1.5} {...stroke(C.text)} />}
          </g>
        );
      })}
    </svg>
  );
}
