import { X } from '@phosphor-icons/react';
import { useUI } from '../state/ui';

// Placeholder: settings and backup come in stage 6.
export function SettingsSheet() {
  const ui = useUI();
  return (
    <>
      <div className="sheet-head">
        <h4>Inställningar</h4>
        <button type="button" className="btn btn-icon sheet-close" aria-label="Stäng" onClick={ui.closeSheet}>
          <X size={20} />
        </button>
      </div>
      <p className="placeholder">Inställningar och säkerhetskopia byggs i etapp 6.</p>
    </>
  );
}
