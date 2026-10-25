import { MoonStars, SunHorizon } from '@phosphor-icons/react';
import { DayClock } from '../../charts/DayClock';
import { fatigue } from '../../domain/forecast';
import type { Model } from '../../domain/model';
import { type Status, timerParts } from '../../domain/status';
import { hm } from '../../domain/time';
import { emptyHint } from '../../domain/wording';

/** Awake or asleep, for how long, and the typical wake window. */
export function StatusCard({ m, status }: { m: Model; status: Status }) {
  const tired = fatigue(m, status);
  const asleep = status.kind === 'asleep';
  const label = status.kind === 'none' ? 'Ingen registrering än' : asleep ? 'Sover i' : 'Vaken i';
  const Icon = asleep ? MoonStars : SunHorizon;

  return (
    <section className="status-card" data-status={status.kind}>
      <div className="status-row">
        <div className="status-main">
          <div className="status-label">
            <Icon size={17} weight="fill" />
            <span>{label}</span>
          </div>
          {status.kind === 'none' ? (
            <p className="status-hint">{emptyHint(m.mode)}</p>
          ) : (
            <>
              <Timer ms={m.now - status.since} />
              <div className="status-since">sedan {hm(status.since)}</div>
            </>
          )}
        </div>
        <div className="status-clock">
          <DayClock now={m.now} sleeps={m.sleeps} meals={m.meals} night={m.night} small />
        </div>
      </div>
      {tired && (
        <div className="fatigue">
          <div className="fatigue-track">
            <div className="fatigue-fill" style={{ width: `${tired.progress * 100}%` }} />
          </div>
          <span>{tired.text}</span>
        </div>
      )}
    </section>
  );
}

/** "1 h 12 min" with small units */
function Timer({ ms }: { ms: number }) {
  const { h, m } = timerParts(ms);
  return (
    <div className="status-timer">
      {h > 0 && (
        <>
          <span>{h}</span>
          <span className="status-unit status-unit-h">h</span>
        </>
      )}
      <span>{h > 0 ? String(m).padStart(2, '0') : m}</span>
      <span className="status-unit">min</span>
    </div>
  );
}
