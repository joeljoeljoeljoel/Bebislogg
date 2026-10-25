import { type ChangeEvent, useRef, useState } from 'react';
import { DownloadSimple, Export, X } from '@phosphor-icons/react';
import type { FeedMode, ThemeSetting } from '../domain/types';
import { calLabel, dateStr, hm } from '../domain/time';
import { exportBackup, readBackup } from '../db/files';
import { Seg } from '../components/Seg';
import { detectPlatform } from '../platform';
import { clockNow } from '../state/clock';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import './SettingsSheet.css';

const FEED_MODES: [FeedMode, string][] = [
  ['Amning', 'Amning'],
  ['Flaska', 'Flaska'],
  ['Båda', 'Båda'],
];
const VITD: [boolean, string][] = [
  [true, 'Visa på Nu'],
  [false, 'Dölj'],
];
const THEMES: [ThemeSetting, string][] = [
  ['Auto', 'Auto'],
  ['Ljust', 'Ljust'],
  ['Mörkt', 'Mörkt'],
];

const BACKUP_WHERE = {
  ios: 'Spara en kopia i Filer eller iCloud Drive.',
  android: 'Spara en kopia i Google Drive eller Filer.',
  desktop: 'Spara en kopia som fil.',
};

/** Changes apply right away. */
export function SettingsSheet() {
  const ui = useUI();
  const { events, settings, updateSettings } = useStore();
  const [restoreFailed, setRestoreFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const now = clockNow();

  async function onExport() {
    const t = clockNow();
    if (await exportBackup(events, settings, t)) updateSettings({ lastBackup: t });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const data = await readBackup(file, clockNow());
    setRestoreFailed(!data);
    if (!data) return;
    ui.closeSheet();
    ui.restoreAll(data, 'Återställt från fil');
  }

  return (
    <div className="settings">
      <div className="sheet-head">
        <h4>Inställningar</h4>
        <button type="button" className="btn btn-icon sheet-close" aria-label="Stäng" onClick={ui.closeSheet}>
          <X size={20} />
        </button>
      </div>

      <div className="field">
        <label htmlFor="set-name">Bebisens namn</label>
        <input
          id="set-name"
          className="input"
          autoComplete="off"
          value={settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
          onBlur={(e) => updateSettings({ name: e.target.value.trim() })}
        />
      </div>

      <div className="field">
        <label htmlFor="set-birth">Födelsedatum</label>
        <input
          id="set-birth"
          className="input"
          type="date"
          max={dateStr(now)}
          value={settings.birth}
          onChange={(e) => e.target.value && updateSettings({ birth: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="set-night-start">Nattperiod</label>
        <div className="settings-night">
          <input
            id="set-night-start"
            className="input"
            type="time"
            aria-label="Nattperioden börjar"
            value={settings.nightStart}
            onChange={(e) => e.target.value && updateSettings({ nightStart: e.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            className="input"
            type="time"
            aria-label="Nattperioden slutar"
            value={settings.nightEnd}
            onChange={(e) => e.target.value && updateSettings({ nightEnd: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label>Matning</label>
        <Seg full label="Matning" options={FEED_MODES} value={settings.feedMode} onChange={(feedMode) => updateSettings({ feedMode })} />
        <span className="settings-help">Styr knapparna på Nu och vad Insikter visar.</span>
      </div>

      <div className="field">
        <label>D-droppar</label>
        <Seg full label="D-droppar" options={VITD} value={settings.vitD} onChange={(vitD) => updateSettings({ vitD })} />
      </div>

      <div className="field">
        <label>Tema</label>
        <Seg full label="Tema" options={THEMES} value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
        <span className="settings-help">Auto byter efter nattperioden.</span>
      </div>

      <section className="backup">
        <span className="backup-title">Säkerhetskopia</span>
        <span className="backup-text">All data finns bara i den här telefonen. {BACKUP_WHERE[detectPlatform()]}</span>
        <span className="backup-last">
          Senaste säkerhetskopia:{' '}
          {settings.lastBackup !== null ? `${calLabel(settings.lastBackup, now)} ${hm(settings.lastBackup)}` : 'aldrig'}
        </span>
        <div className="backup-actions">
          <button type="button" className="btn btn-primary" onClick={onExport}>
            <Export size={17} />
            Exportera till fil
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <DownloadSimple size={17} />
            Återställ från fil
          </button>
        </div>
        {restoreFailed && (
          <p className="backup-error" role="alert">
            Filen gick inte att läsa. Välj en säkerhetskopia från Bebislogg.
          </p>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </section>
    </div>
  );
}
