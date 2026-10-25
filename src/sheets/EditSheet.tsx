import { type CSSProperties, useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  Drop,
  DropHalfBottom,
  type Icon,
  Info,
  Minus,
  Moon,
  Plus,
  Sun,
  Trash,
  X,
} from '@phosphor-icons/react';
import type { SleepWarning } from '../domain/sleepCheck';
import { MIN, addDays, calLabel, hm, parseHM } from '../domain/time';
import { clockNow } from '../state/clock';
import { type Draft, type EventType, draftFields, draftTitle, typedTime, withType } from '../state/draft';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import './EditSheet.css';

const TYPES: { type: EventType; label: string; Icon: Icon; color: string }[] = [
  { type: 'sleep', label: 'Sömn', Icon: Moon, color: 'var(--bl-sleep)' },
  { type: 'feed', label: 'Amning', Icon: Drop, color: 'var(--bl-feed)' },
  { type: 'bottle', label: 'Flaska', Icon: DropHalfBottom, color: 'var(--bl-bottle)' },
  { type: 'vitd', label: 'D-droppar', Icon: Sun, color: 'var(--bl-vitd)' },
];
const QUICK: [string, number][] = [
  ['Nu', 0],
  ['−5', 5],
  ['−10', 10],
  ['−15', 15],
  ['−30', 30],
];
const ML_PRESETS = [60, 90, 120, 150, 180];

/** Add, edit, or pick the time for a long-pressed button. */
export function EditSheet({ initial }: { initial: Draft }) {
  const ui = useUI();
  const { settings } = useStore();
  const [d, setD] = useState(initial);
  const [warning, setWarning] = useState<SleepWarning | null>(null);
  const now = clockNow();

  const update = (next: Draft) => {
    setD(next);
    setWarning(null);
  };
  const setTime = (v: number) => update({ ...d, [d.field]: v });
  const save = (draft: Draft, force = false) => setWarning(ui.saveDraft(draft, force));

  const sel = d[d.field];
  const color = TYPES.find((t) => t.type === d.type)!.color;
  const types = TYPES.filter(
    (t) => (t.type !== 'feed' || settings.feedMode !== 'Flaska') && (t.type !== 'bottle' || settings.feedMode !== 'Amning'),
  );

  return (
    <div className="edit" style={{ '--type-color': color } as CSSProperties}>
      <div className="sheet-head">
        <h4>{draftTitle(d)}</h4>
        <button type="button" className="btn btn-icon sheet-close" aria-label="Stäng" onClick={ui.closeSheet}>
          <X size={20} />
        </button>
      </div>

      {d.kind === 'add' && (
        <div className="type-grid">
          {types.map(({ type, label, Icon, color }) => (
            <button
              key={type}
              type="button"
              className="type-opt"
              aria-pressed={d.type === type}
              style={{ '--type-color': color } as CSSProperties}
              onClick={() => update(withType(d, type))}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="time-fields">
        {draftFields(d).map((f) => {
          const v = d[f.key];
          return (
            <button
              key={f.key}
              type="button"
              className="time-field"
              aria-pressed={d.field === f.key}
              onClick={() => update({ ...d, field: f.key })}
            >
              <span className="tf-label">{f.label}</span>
              <span className="tf-date">{v !== null ? calLabel(v, now) : ''}</span>
              <span className="tf-value">{v !== null ? hm(v) : 'sover'}</span>
            </button>
          );
        })}
      </div>

      <div className="quick-row">
        {QUICK.map(([label, min]) => (
          <button key={label} type="button" className="btn btn-secondary" onClick={() => setTime(clockNow() - min * MIN)}>
            {label}
          </button>
        ))}
      </div>

      <div className="day-row">
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label="Dagen innan"
          onClick={() => setTime(addDays(sel ?? clockNow(), -1))}
        >
          <CaretLeft size={16} />
        </button>
        <span className="day-label">{sel !== null ? calLabel(sel, now) : 'Inte vaknat än'}</span>
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label="Dagen efter"
          onClick={() => setTime(addDays(sel ?? clockNow(), 1))}
        >
          <CaretRight size={16} />
        </button>
        <input
          className="input day-time"
          type="time"
          aria-label="Klockslag"
          value={sel !== null ? hm(sel) : ''}
          onChange={(e) => e.target.value && setTime(typedTime(sel ?? clockNow(), parseHM(e.target.value), clockNow()))}
        />
      </div>

      {d.type === 'feed' && (
        <div className="side-row">
          {(['V', 'H'] as const).map((side) => (
            <button
              key={side}
              type="button"
              className="side-opt"
              aria-pressed={d.side === side}
              onClick={() => update({ ...d, side })}
            >
              <span className="side-letter">{side}</span>
              {side === 'V' ? 'Vänster' : 'Höger'}
            </button>
          ))}
        </div>
      )}

      {d.type === 'bottle' && (
        <div className="ml-box">
          <div className="ml-row">
            <button
              type="button"
              className="btn btn-icon btn-secondary"
              aria-label="Minska mängd"
              onClick={() => update({ ...d, ml: Math.max(10, d.ml - 10) })}
            >
              <Minus size={20} />
            </button>
            <div className="ml-value">
              <span className="ml-number">{d.ml}</span>
              <span className="ml-unit">ml</span>
            </div>
            <button
              type="button"
              className="btn btn-icon btn-secondary"
              aria-label="Öka mängd"
              onClick={() => update({ ...d, ml: d.ml + 10 })}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="quick-row">
            {ML_PRESETS.map((ml) => (
              <button key={ml} type="button" className="btn btn-secondary" onClick={() => update({ ...d, ml })}>
                {ml}
              </button>
            ))}
          </div>
        </div>
      )}

      {warning && (
        <div className="warn" role="alert">
          <div className="warn-text">
            <Info size={18} />
            <span>{warning.text}</span>
          </div>
          {warning.kind === 'overlap' && (
            <div className="warn-actions">
              {warning.fix && (
                <button type="button" className="btn btn-primary" onClick={() => save({ ...d, ...warning.fix!.patch })}>
                  {warning.fix.label}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => save(d, true)}>
                Spara ändå
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sheet-foot">
        {d.kind === 'edit' && d.id && (
          <button type="button" className="btn btn-ghost sheet-delete" onClick={() => ui.deleteEvent(d.id!)}>
            <Trash size={18} />
            Ta bort
          </button>
        )}
        <span className="grow" />
        <button type="button" className="btn btn-secondary sheet-cancel" onClick={ui.closeSheet}>
          Avbryt
        </button>
        <button type="button" className="btn btn-primary sheet-save" onClick={() => save(d)}>
          Spara
        </button>
      </div>
    </div>
  );
}
