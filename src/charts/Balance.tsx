import type { BalanceWeek } from '../domain/charts';
import { C, CHART_W, fill, stroke } from './ChartCard';

/** One row per week: left breast to the left of the center line, right to the right. */
export function Balance({ weeks }: { weeks: BalanceWeek[] }) {
  const LW = 78;
  const rh = 22;
  const gap = 10;
  const H = weeks.length * (rh + gap) + 4;
  const cx = LW + (CHART_W - LW) / 2;
  const half = (CHART_W - LW) / 2 - 30;
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.V, w.H)));

  return (
    <svg className="chart" viewBox={`0 0 ${CHART_W} ${H}`} aria-hidden="true">
      <line x1={cx} x2={cx} y1={0} y2={H} {...stroke(C.grid)} />
      {weeks.map((w, i) => {
        const y = 2 + i * (rh + gap);
        const lv = (w.V / max) * half;
        const lh = (w.H / max) * half;
        return (
          <g key={w.label}>
            <text x={0} y={y + rh / 2 + 4} fontSize={11} {...fill(C.muted)}>
              {w.label}
            </text>
            <rect x={cx - lv} y={y} width={lv} height={rh} rx={3} opacity={0.6} {...fill(C.feed)} />
            <rect x={cx} y={y} width={lh} height={rh} rx={3} {...fill(C.feed)} />
            <text x={cx - lv - 5} y={y + rh / 2 + 4} fontSize={11} textAnchor="end" {...fill(C.text)}>
              V {w.V}
            </text>
            <text x={cx + lh + 5} y={y + rh / 2 + 4} fontSize={11} {...fill(C.text)}>
              {w.H} H
            </text>
          </g>
        );
      })}
    </svg>
  );
}
