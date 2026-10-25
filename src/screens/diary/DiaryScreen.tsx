import { useMemo, useState } from 'react';
import { CaretDown, CaretUp, Plus } from '@phosphor-icons/react';
import { type DiaryDay, diaryDays } from '../../domain/diary';
import { dygnStart } from '../../domain/days';
import { nextSide } from '../../domain/status';
import { clockNow } from '../../state/clock';
import { addDraft } from '../../state/draft';
import { useModel } from '../../state/useModel';
import { useUI } from '../../state/ui';
import { DiaryRow, useSwipe } from './DiaryRow';
import './Diary.css';

const FIRST_DAYS = 5;
const MORE_DAYS = 7;

/** Everything logged, dygn by dygn, newest first. */
export function DiaryScreen({ now }: { now: number }) {
  const m = useModel(now);
  const ui = useUI();
  const [count, setCount] = useState(FIRST_DAYS);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const swipe = useSwipe(ui.openEdit);
  const { days, hasMore } = useMemo(() => diaryDays(m, count), [m, count]);
  const today = dygnStart(now, m.night);

  const openAdd = () =>
    ui.openSheet({ kind: 'draft', draft: addDraft(clockNow(), nextSide(m) ?? 'V', m.bottles.at(-1)?.ml ?? 120) });

  return (
    <div className="scroll-screen">
      <div className="diary-head">
        <h2>Dagbok</h2>
        <button type="button" className="btn btn-primary diary-add" onClick={openAdd}>
          <Plus size={16} />
          Lägg till
        </button>
      </div>

      {days.length === 0 && <p className="diary-empty">Här hamnar allt som registreras, dygn för dygn. Inget än.</p>}

      {days.map((day) => (
        <Day
          key={day.D}
          day={day}
          open={expanded[day.D] ?? day.D === today}
          onToggle={(open) => setExpanded((x) => ({ ...x, [day.D]: open }))}
          swipe={swipe}
          onDelete={ui.deleteEvent}
        />
      ))}

      {hasMore && (
        <button type="button" className="btn btn-secondary diary-more" onClick={() => setCount((c) => c + MORE_DAYS)}>
          Visa äldre dygn
        </button>
      )}
    </div>
  );
}

function Day({
  day,
  open,
  onToggle,
  swipe,
  onDelete,
}: {
  day: DiaryDay;
  open: boolean;
  onToggle: (open: boolean) => void;
  swipe: ReturnType<typeof useSwipe>;
  onDelete: (id: string) => void;
}) {
  const Caret = open ? CaretUp : CaretDown;
  return (
    <section className="dday">
      <button type="button" className="dday-toggle" aria-expanded={open} onClick={() => onToggle(!open)}>
        <span className="dday-label">{day.label}</span>
        <span className="dday-summary">{day.summary}</span>
        <Caret size={16} />
      </button>
      {open && (
        <div className="dday-stats">
          {day.stats.map((s) => (
            <div key={s.label} className="dstat">
              <span className="dstat-label">{s.label}</span>
              <span className="dstat-value">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      {day.items.map((it) =>
        it.kind === 'wake' ? (
          <div key={it.key} className="dwake">
            {it.text}
          </div>
        ) : (
          <DiaryRow key={it.key} entry={it} swipe={swipe} onDelete={onDelete} />
        ),
      )}
    </section>
  );
}
