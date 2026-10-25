import { type ChangeEvent, useRef, useState } from 'react';
import { CheckCircle, DownloadSimple, Drop, DropHalf, DropHalfBottom, type Icon } from '@phosphor-icons/react';
import type { FeedMode, Settings } from '../domain/types';
import { dateStr } from '../domain/time';
import { parseBackup } from '../db/backup';
import { AppIcon } from '../components/AppIcon';
import { clockNow } from '../state/clock';
import { useStore } from '../state/store';
import './Intro.css';

const MODES: { mode: FeedMode; label: string; desc: string; Icon: Icon; color: string }[] = [
  { mode: 'Amning', label: 'Amning', desc: 'Knappar för vänster och höger bröst', Icon: Drop, color: 'var(--bl-feed)' },
  {
    mode: 'Flaska',
    label: 'Flaska',
    desc: 'En knapp för flaska, med mängd i ml',
    Icon: DropHalfBottom,
    color: 'var(--bl-bottle)',
  },
  {
    mode: 'Båda',
    label: 'Både och',
    desc: 'Både och: bröst och flaska på startsidan',
    Icon: DropHalf,
    color: 'var(--bl-feed)',
  },
];

type Draft = Pick<Settings, 'name' | 'birth' | 'feedMode' | 'nightStart' | 'nightEnd'>;

/** First start: the settings that forecasts and insights depend on. */
export function Intro() {
  const { settings, updateSettings, restore } = useStore();
  const [draft, setDraft] = useState<Draft>(() => ({
    name: settings.name,
    birth: settings.birth,
    feedMode: settings.feedMode,
    nightStart: settings.nightStart,
    nightEnd: settings.nightEnd,
  }));
  const [restoreFailed, setRestoreFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const finish = () => updateSettings({ ...draft, name: draft.name.trim() || 'Bebis', setupDone: true });

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const data = parseBackup(await file.text(), clockNow());
    setRestoreFailed(!data);
    if (data) restore(data);
  }

  return (
    <div className="intro">
      <AppIcon size={64} radius={14} />
      <div className="intro-head">
        <h2>Välkommen till Bebislogg</h2>
        <p>Några uppgifter först, så blir prognoser och insikter rätt. Allt går att ändra senare i Inställningar.</p>
      </div>

      <div className="field">
        <label htmlFor="intro-name">Bebisens namn</label>
        <input
          id="intro-name"
          className="input"
          placeholder="Namn"
          autoComplete="off"
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="intro-birth">Födelsedatum</label>
        <input
          id="intro-birth"
          className="input"
          type="date"
          max={dateStr(clockNow())}
          value={draft.birth}
          onChange={(e) => e.target.value && set({ birth: e.target.value })}
        />
      </div>

      <div className="intro-modes" role="radiogroup" aria-labelledby="intro-modes-label">
        <span id="intro-modes-label" className="intro-label">
          Hur matas bebisen?
        </span>
        {MODES.map(({ mode, label, desc, Icon, color }) => {
          const selected = draft.feedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              className="intro-mode"
              onClick={() => set({ feedMode: mode })}
            >
              <Icon size={24} weight="fill" color={color} />
              <span className="intro-mode-text">
                <span className="intro-mode-title">{label}</span>
                <span className="intro-mode-desc">{desc}</span>
              </span>
              {selected && <CheckCircle size={22} weight="fill" className="intro-mode-check" />}
            </button>
          );
        })}
      </div>

      <div className="field">
        <label htmlFor="intro-night-start">Nattperiod</label>
        <div className="intro-night">
          <input
            id="intro-night-start"
            className="input"
            type="time"
            aria-label="Nattperioden börjar"
            value={draft.nightStart}
            onChange={(e) => e.target.value && set({ nightStart: e.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            className="input"
            type="time"
            aria-label="Nattperioden slutar"
            value={draft.nightEnd}
            onChange={(e) => e.target.value && set({ nightEnd: e.target.value })}
          />
        </div>
        <span className="intro-help">Skiljer nattsömn från tupplurar och styr temat.</span>
      </div>

      <button type="button" className="btn btn-primary btn-block intro-start" onClick={finish}>
        Kom igång
      </button>
      <button type="button" className="btn btn-ghost intro-restore" onClick={() => fileRef.current?.click()}>
        <DownloadSimple size={17} />
        Återställ från säkerhetskopia
      </button>
      {restoreFailed && (
        <p className="intro-error" role="alert">
          Filen gick inte att läsa. Välj en säkerhetskopia från Bebislogg.
        </p>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
    </div>
  );
}
