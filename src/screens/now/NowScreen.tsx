import { ClockCountdown, CloudArrowUp, GearSix } from '@phosphor-icons/react';
import { forecastText } from '../../domain/forecast';
import { getStatus } from '../../domain/status';
import { DAY, ageText } from '../../domain/time';
import { UndoBar } from '../../components/UndoBar';
import { useStore } from '../../state/store';
import { useModel } from '../../state/useModel';
import { useUI } from '../../state/ui';
import { FeedCard } from './FeedCard';
import { SleepButton } from './SleepButton';
import { StatusCard } from './StatusCard';
import { VitdRow } from './VitdRow';
import './Now.css';

/** The top half is for reading, the bottom half for tapping. */
export function NowScreen({ now }: { now: number }) {
  const { events, settings } = useStore();
  const ui = useUI();
  const m = useModel(now);
  const status = getStatus(m);
  const openSettings = () => ui.openSheet({ kind: 'settings' });

  // A discreet reminder once the latest backup is more than a week old.
  const backupFrom = settings.lastBackup ?? m.firstTs;
  const backupAge = events.length && backupFrom !== null ? now - backupFrom : 0;

  return (
    <div className="now">
      <header className="now-head">
        <div className="now-who">
          <span className="now-name">{settings.name || 'Bebis'}</span>
          <span className="now-age">{ageText(settings.birth, now)}</span>
        </div>
        {backupAge > 7 * DAY && (
          <button type="button" className="btn btn-ghost now-backup" onClick={openSettings}>
            <CloudArrowUp size={16} />
            Kopia {Math.floor(backupAge / DAY)} d sedan
          </button>
        )}
        <button type="button" className="btn btn-icon now-gear" aria-label="Inställningar" onClick={openSettings}>
          <GearSix size={22} />
        </button>
      </header>

      <StatusCard m={m} status={status} />

      <div className="now-forecast">
        <ClockCountdown size={18} />
        <span>{forecastText(m)}</span>
      </div>

      {settings.vitD && <VitdRow m={m} />}

      <div className="now-spacer" />

      <div className="now-actions">
        <UndoBar placement="now" />
        <FeedCard m={m} asleep={status.kind === 'asleep'} />
        <SleepButton asleep={status.kind === 'asleep'} />
      </div>
    </div>
  );
}
