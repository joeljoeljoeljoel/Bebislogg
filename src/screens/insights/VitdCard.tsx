import { Check, Sun } from '@phosphor-icons/react';
import type { Period } from '../../domain/charts';
import type { Model } from '../../domain/model';
import { WEEKDAYS, hm } from '../../domain/time';
import { vitdSummary } from '../../domain/vitd';

/** The week (or 4 weeks) of vitamin D drops, one circle per calendar day. */
export function VitdCard({ m, period }: { m: Model; period: Period }) {
  const { days, text } = vitdSummary(m, period);
  // Hidden on Nu and never given: nothing to show.
  if (!days.length || (!m.settings.vitD && !days.some((d) => d.given))) return null;

  return (
    <section className="card vitd-card">
      <div className="vitd-card-head">
        <Sun size={20} weight="fill" />
        <span className="vitd-card-text">
          <span className="vitd-card-title">D-droppar</span>
          <span className="vitd-card-sub">{text}</span>
        </span>
      </div>
      <div className="vitd-grid">
        {days.map((d, i) => (
          <div key={d.D} className="vitd-cell" data-today={d.daysAgo === 0}>
            {i < 7 && <span className="vitd-cell-day">{d.daysAgo === 0 ? 'idag' : WEEKDAYS[new Date(d.D).getDay()]}</span>}
            <span className="vitd-cell-dot" data-given={d.given !== null}>
              {d.given && <Check size={14} weight="bold" />}
            </span>
            {period === 7 && <span className="vitd-cell-time">{d.given ? hm(d.given.t) : '–'}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
