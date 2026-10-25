import { CheckCircle, Sun } from '@phosphor-icons/react';
import type { Model } from '../../domain/model';
import { vitdRow } from '../../domain/vitd';
import { useUI } from '../../state/ui';

/** Vitamin D drops: one tap when given; a tap after that opens the edit sheet. */
export function VitdRow({ m }: { m: Model }) {
  const ui = useUI();
  const row = vitdRow(m);
  const given = row.today !== null;

  return (
    <button
      type="button"
      className="vitd-row"
      data-given={given}
      onClick={() => (row.today ? ui.openEdit(row.today.id) : ui.logVitd())}
    >
      {given ? <CheckCircle size={24} weight="fill" /> : <Sun size={24} weight="fill" />}
      <span className="vitd-text">
        <span className="vitd-title">{row.title}</span>
        <span className="vitd-sub">{row.sub}</span>
      </span>
      <span className="vitd-dots" aria-hidden="true">
        {row.week.map((d) => (
          <span key={d.D} className="vitd-dot" data-given={d.given !== null} data-today={d.daysAgo === 0} />
        ))}
      </span>
    </button>
  );
}
