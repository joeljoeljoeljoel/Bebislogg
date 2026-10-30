import { useMemo, useState } from 'react';
import { Check, Export, X } from '@phosphor-icons/react';
import { type BvcPeriod, bvcSummary } from '../domain/bvc';
import { dateStr, dur, hmm } from '../domain/time';
import { cap } from '../domain/wording';
import { oneDecimal, renderBvcImage } from '../bvc/image';
import { shareOrDownload } from '../db/files';
import { Seg } from '../components/Seg';
import { useModel } from '../state/useModel';
import { useUI } from '../state/ui';
import './BvcSheet.css';

const PERIODS: [BvcPeriod, string][] = [
  [7, '7 dygn'],
  [14, '14 dygn'],
  [28, '4 veckor'],
];

/** Averages and dygn by dygn, to show at the visit or share as an image. */
export function BvcSheet({ now }: { now: number }) {
  const ui = useUI();
  const m = useModel(now);
  const [period, setPeriod] = useState<BvcPeriod>(7);
  const [busy, setBusy] = useState(false);
  const s = useMemo(() => bvcSummary(m, period), [m, period]);

  async function share() {
    setBusy(true);
    try {
      const blob = await renderBvcImage(s);
      const file = new File([blob], `bebislogg-bvc-${dateStr(s.createdAt)}.png`, { type: 'image/png' });
      await shareOrDownload(file, 'Sammanfattning till BVC');
    } finally {
      setBusy(false);
    }
  }

  const averages: [string, string][] = [
    ['Sömn per dygn', dur(s.avg.total)],
    ['Varav natt', dur(s.avg.night)],
    ['Längsta nattsömn', s.avg.nightLongest !== null ? dur(s.avg.nightLongest) : '–'],
    ['Tupplurar per dygn', oneDecimal(s.avg.naps)],
    [`${cap(s.words.many)} per dygn`, oneDecimal(s.avg.sessions)],
    ...(s.showMl ? ([['Flaska per dygn', `${Math.round(s.avg.ml)} ml`]] as [string, string][]) : []),
    ['D-droppar', `${s.vitd.given} av ${s.vitd.days} dagar`],
  ];

  return (
    <div className="bvc">
      <div className="sheet-head">
        <h4>Sammanfattning till BVC</h4>
        <button type="button" className="btn btn-icon sheet-close" aria-label="Stäng" onClick={ui.closeSheet}>
          <X size={20} />
        </button>
      </div>

      <Seg full label="Period" options={PERIODS} value={period} onChange={setPeriod} />

      {s.rows.length === 0 ? (
        <p className="bvc-empty">
          Sammanfattningen visas när det finns ett helt dygn, från {s.dygnFrom} till {s.dygnFrom}.
        </p>
      ) : (
        <>
          <div className="bvc-who">
            <span className="bvc-name">{s.name}</span>
            <span className="bvc-sub">
              {[s.age, `${s.periodLabel} (${s.rows.length} dygn)`].filter(Boolean).join(' · ')}
            </span>
          </div>

          <div className="bvc-avg">
            {averages.map(([label, value]) => (
              <div key={label} className="dstat">
                <span className="dstat-label">{label}</span>
                <span className="dstat-value">{value}</span>
              </div>
            ))}
          </div>

          <table className="table bvc-table">
            <thead>
              <tr>
                <th>Dygn</th>
                <th>Sömn</th>
                <th>Natt</th>
                <th>Längst</th>
                <th>Lurar</th>
                <th>{s.words.tableHead}</th>
                {s.showMl && <th>ml</th>}
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.D}>
                  <td>{r.label}</td>
                  <td>{hmm(r.total)}</td>
                  <td>{hmm(r.night)}</td>
                  <td>{hmm(r.nightLongest)}</td>
                  <td>{r.naps}</td>
                  <td>{r.sessions}</td>
                  {s.showMl && <td>{r.ml}</td>}
                  <td className="bvc-vitd">{r.vitd ? <Check size={14} weight="bold" aria-label="givna" /> : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bvc-note">
            Ett dygn = <span className="nowrap">{s.dygnFrom}–{s.dygnFrom}</span>, så natten räknas till dagen innan.
            Längst = längsta sammanhängande sömn på natten. <span className="nowrap">D = D-droppar.</span>
          </p>

          <button type="button" className="btn btn-primary btn-block bvc-share" disabled={busy} onClick={share}>
            <Export size={18} />
            Dela som bild
          </button>
        </>
      )}
    </div>
  );
}
