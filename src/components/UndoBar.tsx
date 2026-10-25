import { CheckCircle } from '@phosphor-icons/react';
import { undoMessage } from '../state/actions';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import './UndoBar.css';

const SHIFTS = [5, 10, 15, 30];
const ML_STEPS = [-30, -10, 10, 30];

/**
 * Shown for 6 s after every registration. On Nu it sits just above the
 * buttons; on the other tabs above the tab bar.
 */
export function UndoBar({ placement }: { placement: 'now' | 'tab' }) {
  const { events } = useStore();
  const ui = useUI();
  const u = ui.undo;
  if (!u) return null;

  return (
    <div className={`undo undo-${placement}`} role="status">
      <div className="undo-msg">
        <CheckCircle size={18} weight="fill" />
        <span>{undoMessage(events, u)}</span>
      </div>

      {ui.undoMode === 'base' && (
        <div className="undo-actions">
          {u.targets.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => ui.setUndoMode('time')}>
              Ändra tid
            </button>
          )}
          {u.feedId && (
            <button type="button" className="btn btn-secondary" onClick={ui.switchSide}>
              Byt sida
            </button>
          )}
          {u.bottleId && (
            <button type="button" className="btn btn-secondary" onClick={() => ui.setUndoMode('ml')}>
              Ändra mängd
            </button>
          )}
          {u.wakeId && (
            <button type="button" className="btn btn-secondary" onClick={ui.undoWake}>
              Ångra uppvaknandet
            </button>
          )}
          <button type="button" className="btn btn-primary undo-all" onClick={ui.undoAll}>
            Ångra
          </button>
        </div>
      )}

      {ui.undoMode === 'time' && (
        <div className="undo-row">
          {SHIFTS.map((m) => (
            <button key={m} type="button" className="btn btn-secondary" onClick={() => ui.shiftUndo(m)}>
              −{m}
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={ui.undoMore}>
            Mer
          </button>
        </div>
      )}

      {ui.undoMode === 'ml' && (
        <div className="undo-row">
          {ML_STEPS.map((d) => (
            <button key={d} type="button" className="btn btn-secondary" onClick={() => ui.changeMl(d)}>
              {d > 0 ? '+' : '−'}
              {Math.abs(d)} ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
