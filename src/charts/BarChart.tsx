import type { DayStats } from '../domain/stats';
import { HOUR, WEEKDAYS, shortDate } from '../domain/time';
import { C, CHART_W, fill, stroke } from './ChartCard';

type Mode = 'sleep' | 'feeds' | 'ml';

/**
 * One bar per dygn. sleep: night and day stacked, 0–18 h. feeds: sessions,
 * with those that included a bottle on top. ml: bottle amount. A dygn still
 * in progress is drawn faded.
 */
export function BarChart({ days, mode }: { days: DayStats[]; mode: Mode }) {
  const L = 32;
  const T = 12;
  const B = 18;
  const H = 150;
  const PH = H - T - B;
  const PW = CHART_W - L - 2;
  const n = days.length;
  const slot = PW / Math.max(1, n);
  const bw = Math.min(24, slot * 0.62);
  const few = n <= 7;

  let max: number;
  let ticks: number[];
  let fmt = (v: number) => String(v);
  if (mode === 'sleep') {
    max = 18 * HOUR;
    ticks = [0, 6, 12, 18].map((h) => h * HOUR);
    fmt = (v) => `${v / HOUR} h`;
  } else if (mode === 'ml') {
    max = Math.max(400, Math.ceil(Math.max(0, ...days.map((d) => d.ml)) / 200) * 200);
    ticks = [0, max / 2, max];
  } else {
    max = Math.max(8, Math.ceil((Math.max(0, ...days.map((d) => d.sessions)) + 1) / 4) * 4);
    ticks = [0, max / 2, max];
  }
  const h = (v: number) => (Math.min(v, max) / max) * PH;
  const Y = (v: number) => T + PH - h(v);

  return (
    <svg className="chart" viewBox={`0 0 ${CHART_W} ${H}`} aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={CHART_W} y1={Y(t)} y2={Y(t)} {...stroke(C.grid)} />
          <text x={L - 6} y={Y(t) + 3.5} fontSize={10} textAnchor="end" {...fill(C.muted)}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = L + i * slot + (slot - bw) / 2;
        const opacity = d.partial ? 0.5 : 1;
        const cx = x + bw / 2;
        const bars: { y: number; height: number; color: string }[] = [];
        let label: string | null = null;
        let labelY = 0;
        if (mode === 'sleep') {
          const nh = h(d.night);
          const dh = h(d.day);
          bars.push({ y: T + PH - nh, height: nh, color: C.sleep });
          bars.push({ y: T + PH - nh - dh - (dh && nh ? 1.5 : 0), height: dh, color: C.sleepDay });
        } else if (mode === 'ml') {
          const mh = h(d.ml);
          bars.push({ y: T + PH - mh, height: mh, color: C.bottle });
          if (few && d.ml) [label, labelY] = [String(d.ml), T + PH - mh - 4];
        } else {
          const fh = h(d.sessions - d.bottleSessions);
          const bh = h(d.bottleSessions);
          bars.push({ y: T + PH - fh, height: fh, color: C.feed });
          bars.push({ y: T + PH - fh - bh - (fh && bh ? 1.5 : 0), height: bh, color: C.bottle });
          if (few) [label, labelY] = [String(d.sessions), T + PH - fh - bh - 5];
        }
        const showX = few || i % 7 === (n - 1) % 7;
        return (
          <g key={d.D} opacity={opacity}>
            {bars.map(
              (b, j) => b.height > 0 && <rect key={j} x={x} y={b.y} width={bw} height={b.height} rx={2} {...fill(b.color)} />,
            )}
            {label && (
              <text x={cx} y={labelY} fontSize={10} textAnchor="middle" {...fill(C.text)}>
                {label}
              </text>
            )}
            {showX && (
              <text x={cx} y={H - 3} fontSize={10} textAnchor="middle" {...fill(C.muted)}>
                {few ? WEEKDAYS[new Date(d.D).getDay()] : shortDate(d.D)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
