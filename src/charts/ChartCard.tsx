import type { ReactNode } from 'react';

export interface LegendItem {
  label: string;
  color: string;
  /** Drawn as a short line instead of a square */
  line?: boolean;
}

/** A card with a title, the question the chart answers, the chart and a legend. */
export function ChartCard({
  title,
  question,
  legend = [],
  children,
}: {
  title: string;
  question: string;
  legend?: LegendItem[];
  children: ReactNode;
}) {
  return (
    <section className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">{title}</h3>
        <span className="chart-question">{question}</span>
      </div>
      <div>{children}</div>
      {legend.length > 0 && (
        <div className="chart-legend">
          {legend.map((l) => (
            <span key={l.label}>
              <i style={{ background: l.color }} data-line={l.line} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/** SVG presentation attributes cannot use var(), but style can. */
export const fill = (color: string) => ({ style: { fill: color } });
export const stroke = (color: string) => ({ style: { stroke: color } });

/** Every chart is 334 units wide and scales to the card. */
export const CHART_W = 334;

export const C = {
  text: 'var(--color-text)',
  surface: 'var(--color-surface)',
  muted: 'var(--bl-muted)',
  grid: 'var(--bl-grid)',
  night: 'var(--bl-night)',
  sleep: 'var(--bl-sleep)',
  sleepDay: 'var(--bl-sleep-day)',
  feed: 'var(--bl-feed)',
  bottle: 'var(--bl-bottle)',
  awake: 'var(--bl-awake)',
};
