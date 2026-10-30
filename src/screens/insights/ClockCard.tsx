import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { DayClock } from '../../charts/DayClock';
import { C, ChartCard, type LegendItem } from '../../charts/ChartCard';
import { type Period, clockDays } from '../../domain/charts';
import { dygnLabel } from '../../domain/days';
import type { Model } from '../../domain/model';
import { dayStats } from '../../domain/stats';
import { dur } from '../../domain/time';
import { cap } from '../../domain/wording';

/** The Dygnsklocka: the last 24 hours, or a finished dygn further back. */
export function ClockCard({ m, period, feedLegend }: { m: Model; period: Period; feedLegend: LegendItem[] }) {
  // Start of the dygn shown; null is the last 24 hours.
  const [shown, setShown] = useState<number | null>(null);
  const days = clockDays(m, period);
  // A dygn that falls outside the period goes back to the last 24 hours.
  const i = shown === null ? -1 : days.indexOf(shown);
  if (shown !== null && i < 0) setShown(null);
  const D = i < 0 ? null : days[i];
  const s = D !== null ? dayStats(m, D) : null;
  const edge = m.settings.nightEnd;

  return (
    <ChartCard
      title="Dygnsklocka"
      question={D === null ? 'Senaste 24 timmarna, visaren är nu' : `Hela dygnet, ${edge} till ${edge} nästa dag`}
      legend={[
        { label: 'Sömn', color: C.sleep },
        ...feedLegend,
        { label: 'Natt', color: C.sleepDay },
        ...(D !== null ? [{ label: 'Dygnsgräns', color: C.text, line: true }] : []),
      ]}
    >
      <div className="clock-nav">
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label="Dygnet innan"
          disabled={i + 1 >= days.length}
          onClick={() => setShown(days[i + 1])}
        >
          <CaretLeft size={16} />
        </button>
        <span className="clock-nav-label">{D === null ? 'Nu' : dygnLabel(D, m.now, m.night)}</span>
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label="Dygnet efter"
          disabled={D === null}
          onClick={() => setShown(i > 0 ? days[i - 1] : null)}
        >
          <CaretRight size={16} />
        </button>
      </div>
      <div className="big-clock">
        <DayClock now={m.now} sleeps={m.sleeps} meals={m.meals} night={m.night} dygn={D ?? undefined} />
      </div>
      {s && (
        <div className="clock-stats">
          {[
            ['Sömn', dur(s.total)],
            ['Varav natt', dur(s.night)],
            [cap(m.words.many), String(s.sessions)],
          ].map(([label, value]) => (
            <div key={label} className="dstat">
              <span className="dstat-label">{label}</span>
              <span className="dstat-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
